// ScheduleController.js
import { ScheduleModel } from './ScheduleModel.js';
import { TableView } from './TableView.js';
import { StorageService } from './StorageService.js';
import { UIManager } from './UIManager.js';
import { WizardManager } from './WizardManager.js';
import { ExportManager } from './ExportManager.js';
import { EmployeeManager } from './EmployeeManager.js';
import { CellInteractionHandler } from './CellInteractionHandler.js';
import { PopupManager } from './PopupManager.js';
import { EmployeeManagerUI } from './EmployeeManagerUI.js';
import { TableActionsHandler } from './TableActionsHandler.js';
import { DragDropHandler } from './DragDropHandler.js';
import { ToolbarHandler } from './ToolbarHandler.js';

export class ScheduleController {
  constructor(dom) {
    this.dom = dom;
    this.model = new ScheduleModel();
    this.storage = new StorageService();

    // Инициализация UI менеджера до создания View, чтобы передать колбэки
    this.uiManager = new UIManager(this.dom, this.model, null); // view будет установлен позже

    // Создание View с колбэками (пока пустые, будут переопределены позже)
    this.view = new TableView({
      tableHead: this.dom.tableHead,
      tableBody: this.dom.tableBody,
      tableWrapper: this.dom.tableWrapper,
      model: this.model,
      callbacks: {} // временно
    });
    this.uiManager.view = this.view; // связываем

    // Сервисы
    this.employeeManager = new EmployeeManager();
    this.exportManager = new ExportManager(this.model, this.storage, this.dom, this.uiManager);
    this.wizardManager = new WizardManager(this.dom, this.model, this.employeeManager, () => this.onTableCreated());

    // Дочерние компоненты
    this.popupManager = new PopupManager(this.dom, this.model, this.view, this.uiManager);
    this.cellHandler = new CellInteractionHandler(this.model, this.view, this.popupManager, this.uiManager);
    this.employeeUI = new EmployeeManagerUI(this.model, this.employeeManager, this.view, this.uiManager);
    this.tableActions = new TableActionsHandler(this.dom, this.model, this.view, this.uiManager, this.exportManager);
    this.dragDrop = new DragDropHandler(this.dom.container, this.exportManager);
    this.toolbar = new ToolbarHandler(
      this.dom,
      this.wizardManager,
      this.employeeUI,
      this.tableActions,
      this.exportManager,
      this.uiManager,
      this.model
    );

    // Переопределяем колбэки View, чтобы использовать методы наших классов
    this.view.callbacks = {
      onCellClick: (data) => this.cellHandler.handleCellClick(data),
      onCellChange: (data) => this.cellHandler.handleCellChange(data),
      onPaste: (data) => this.cellHandler.handlePaste(data),
      onClearDay: (day) => this.tableActions.clearDay(day),
      onRemoveEmployee: (id) => this.employeeUI.removeEmployee(id),
      onRenameEmployee: (id, name) => this.employeeUI.renameEmployee(id, name),
      onChangeCategory: (id) => this.employeeUI.changeCategory(id),
    };

    // Восстановление состояния
    this.restoreFromStorage();
    this.bindGlobalEvents();
  }

  restoreFromStorage() {
    const saved = ScheduleModel.loadFromLocalStorage();
    if (saved) {
      this.model.currentMonth = saved.currentMonth;
      this.model.currentYear = saved.currentYear;
      this.model.dayCount = saved.dayCount;
      this.model.employees = saved.employees;
      this.model.special = saved.special;
      this.model.nextId = saved.nextId;
      this.model.resetDirty();
      this.uiManager.refreshTable();
      this.uiManager.hideEmptyState();
    } else {
      this.model.employees = [];
      this.model.currentMonth = new Date().getMonth();
      this.model.currentYear = new Date().getFullYear();
      this.model.dayCount = this.model.getDaysInMonth(this.model.currentMonth, this.model.currentYear);
      this.model.special.endo = new Array(this.model.dayCount).fill('3');
      this.model.special.oper = new Array(this.model.dayCount).fill('3');
      this.model.nextId = 0;
      this.model.resetDirty();
      this.uiManager.refreshTable();
      this.uiManager.showEmptyState();
    }
  }

  onTableCreated() {
    // Синхронизируем элементы управления с моделью
    this.dom.monthSelect.value = this.model.currentMonth;
    this.dom.yearInput.value = this.model.currentYear;
    this.uiManager.refreshTable();
    this.uiManager.hideAnalysis();
    this.uiManager.hideEmptyState();
    this.uiManager.showToast('Таблица создана');
  }

  bindGlobalEvents() {
    window.addEventListener('beforeunload', (e) => {
      if (this.model.isDirty()) {
        e.preventDefault();
        e.returnValue = 'У вас есть несохранённые изменения. Вы уверены, что хотите покинуть страницу?';
      }
    });
  }
}