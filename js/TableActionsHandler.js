// TableActionsHandler.js
export class TableActionsHandler {
  constructor(dom, model, view, uiManager, exportManager) {
    this.dom = dom;
    this.model = model;
    this.view = view;
    this.uiManager = uiManager;
    this.exportManager = exportManager;
  }

  clearDay(day) {
    if (!confirm(`Очистить все назначения на день ${day + 1}?`)) return;
    this.model.clearDay(day);
    this.uiManager.refreshTable();
    this.uiManager.showToast(`День ${day + 1} очищен`);
  }

  async clearAll() {
    const hasData = this.model.employees.length > 0 || 
                    this.model.special.endo.some(v => v !== '3') || 
                    this.model.special.oper.some(v => v !== '3');
    if (!hasData) {
      this.uiManager.showToast('Таблица уже пуста');
      return;
    }

    const saveChoice = confirm('Вы собираетесь очистить всю таблицу. Хотите сохранить текущие данные перед очисткой?\n\nНажмите "OK" для сохранения и очистки, "Отмена" — для очистки без сохранения.');
    if (saveChoice) {
      const saved = await this.exportManager.handleSave();
      if (!saved) {
        this.uiManager.showToast('Сохранение отменено — очистка не выполнена.');
        return;
      }
    }
    this.confirmAndClear();
  }

  confirmAndClear() {
    if (!confirm('Вы уверены, что хотите удалить всех сотрудников и очистить служебные строки? Это действие необратимо.')) return;
    this.model.clearAll();
    this.model.constructor.clearLocalStorage();
    this.uiManager.refreshTable();
    this.uiManager.hideAnalysis();
    this.uiManager.showEmptyState();
    this.uiManager.showToast('Таблица очищена');
  }

  applyDate() {
    const month = parseInt(this.dom.monthSelect.value);
    const year = parseInt(this.dom.yearInput.value) || new Date().getFullYear();
    const oldMonth = this.model.currentMonth;
    const oldYear = this.model.currentYear;

    this.model.currentMonth = month;
    this.model.currentYear = year;
    const newDayCount = this.model.getDaysInMonth(month, year);
    const success = this.model.adjustDays(newDayCount, false);
    if (!success) {
      this.model.currentMonth = oldMonth;
      this.model.currentYear = oldYear;
      return;
    }
    this.model.markDirty();
    this.uiManager.refreshTable();
    this.uiManager.updateDocumentTitle();
    this.uiManager.hideAnalysis();
  }
}