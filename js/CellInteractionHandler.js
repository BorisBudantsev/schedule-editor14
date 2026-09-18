// CellInteractionHandler.js
import { ALLOWED_PERMANENT, ALLOWED_PARTTIME } from './constants.js';
import { ValidationService } from './ValidationService.js';

export class CellInteractionHandler {
  constructor(model, view, popupManager, uiManager) {
    this.model = model;
    this.view = view;
    this.popupManager = popupManager;
    this.uiManager = uiManager;
    this.bindViewEvents();
  }

  bindViewEvents() {
    // Переопределяем колбэки в представлении
    this.view.callbacks = {
      onCellClick: (data) => this.handleCellClick(data),
      onCellChange: (data) => this.handleCellChange(data),
      onPaste: (data) => this.handlePaste(data),
      // Другие колбэки (clearDay, removeEmployee и т.д.) будут заданы извне
    };
  }

  handleCellClick({ empId, specialType, day, input }) {
    if (empId !== null) {
      const emp = this.model.employees.find(e => e.id === empId);
      if (!emp) {
        this.uiManager.showToast('Ошибка: сотрудник не найден. Попробуйте перезагрузить страницу.', 3000);
        return;
      }
    }
    let menuType = 'employee';
    if (specialType === 'endo') menuType = 'endo';
    else if (specialType === 'oper') menuType = 'oper';
    else if (empId !== null) {
      const emp = this.model.employees.find(e => e.id === empId);
      if (emp && emp.category === 'parttime') menuType = 'parttime';
    }
    this.popupManager.showPopup(input, menuType);
  }

  handleCellChange({ empId, specialType, day, newValue, input }) {
    if (specialType) {
      if (!ValidationService.isValidSpecial(newValue)) {
        alert('Введите число от 1 до 4 или оставьте пустым.');
        this.uiManager.refreshTable();
        return;
      }
      this.model.setSpecialDay(specialType, day, newValue);
    } else if (empId !== null) {
      const emp = this.model.employees.find(e => e.id === empId);
      if (!emp) return;
      if (!ValidationService.isValidForEmployee(newValue, emp.category)) {
        alert(`Недопустимое значение для категории "${emp.category}". Разрешённые: ${emp.category === 'permanent' ? ALLOWED_PERMANENT.join(', ') : ALLOWED_PARTTIME.join(', ')}`);
        this.uiManager.refreshTable();
        return;
      }
      if (emp.category === 'parttime') {
        const forbidden = ['вых', 'до 17', 'до 16'];
        if (forbidden.includes(newValue.toLowerCase())) {
          alert('Для совместителей недопустимы "вых", "до 17", "до 16".');
          this.uiManager.refreshTable();
          return;
        }
        const oldValue = emp.days[day] || '';
        if (newValue === '' && oldValue !== '' && oldValue !== '*') {
          this.model.setEmployeeDay(empId, day, '*');
          this.uiManager.refreshTable();
          return;
        }
        if (newValue !== '*' && newValue !== '' && !oldValue) {
          alert('Для совместителя сначала необходимо установить символ "*" (доступность), затем можно выбрать рабочее место.');
          this.uiManager.refreshTable();
          return;
        }
      }
      if (emp.category === 'permanent' && newValue === '*') {
        alert('Для постоянных сотрудников символ "*" не используется.');
        this.uiManager.refreshTable();
        return;
      }
      this.model.setEmployeeDay(empId, day, newValue);
    }
    this.uiManager.refreshTable();
  }

  handlePaste({ empId, specialType, day, values }) {
    if (specialType) {
      if (values.length > 0) {
        const val = values[0];
        if (ValidationService.isValidSpecial(val)) {
          this.model.setSpecialDay(specialType, day, val);
        } else {
          alert(`Недопустимое значение "${val}" для специальной строки.`);
        }
      }
      this.uiManager.refreshTable();
      return;
    }
    if (empId === null) return;
    const emp = this.model.employees.find(e => e.id === empId);
    if (!emp) return;
    for (let i = 0; i < values.length && day + i < this.model.dayCount; i++) {
      const val = values[i];
      if (val === '') continue;
      if (ValidationService.isValidForEmployee(val, emp.category)) {
        if (emp.category === 'parttime') {
          const forbidden = ['вых', 'до 17', 'до 16'];
          if (forbidden.includes(val.toLowerCase())) {
            alert(`Недопустимое значение "${val}" для совместителя. Пропущено.`);
            continue;
          }
          const currentValue = emp.days[day + i] || '';
          if (val !== '*' && !currentValue && val !== '') {
            alert(`Для совместителя сначала нужно установить "*" перед рабочим местом. Пропущено.`);
            continue;
          }
        }
        if (emp.category === 'permanent' && val === '*') {
          alert(`Для постоянных сотрудников символ "*" не используется. Пропущено.`);
          continue;
        }
        this.model.setEmployeeDay(empId, day + i, val);
      } else {
        alert(`Недопустимое значение "${val}" для сотрудника ${emp.name}. Пропущено.`);
      }
    }
    this.uiManager.refreshTable();
  }
}