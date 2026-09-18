// ExportManager.js
import { MONTH_NAMES } from './constants.js';
import { AnalysisEngine } from './AnalysisEngine.js';

export class ExportManager {
  constructor(model, storage, dom, uiManager) {
    this.model = model;
    this.storage = storage;
    this.dom = dom;
    this.uiManager = uiManager;
  }

  async handleSave() {
    const data = this.model.toJSON();
    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') + '-' +
      String(now.getMinutes()).padStart(2, '0') + '-' +
      String(now.getSeconds()).padStart(2, '0');
    const defaultName = `график_${dateStr}.json`;
    try {
      await this.storage.saveToJson(data, defaultName);
      this.model.resetDirty();
      this.uiManager.showToast('Файл успешно сохранён');
      return true;
    } catch (err) {
      if (err.message === 'aborted') {
        return false;
      }
      alert('Ошибка при сохранении файла: ' + err.message);
      return false;
    }
  }

  handleLoadFile(file) {
    this.storage.loadFromFile(file)
      .then(data => {
        if (data.version && data.version !== '1.0') {
          if (!confirm(`Версия файла (${data.version}) не соответствует текущей (1.0). Возможны проблемы. Загрузить всё равно?`)) {
            return;
          }
        }
        if (!data.employees || !data.special) {
          alert('Неверный формат файла.');
          return;
        }
        import('./ScheduleModel.js').then(module => {
          const ScheduleModel = module.ScheduleModel;
          const newModel = ScheduleModel.fromJSON(data);
          this.model.currentMonth = newModel.currentMonth;
          this.model.currentYear = newModel.currentYear;
          this.model.dayCount = newModel.dayCount;
          this.model.employees = newModel.employees;
          this.model.special = newModel.special;
          this.model.nextId = newModel.nextId;
          this.model.resetDirty();
          this.uiManager.refreshTable();
          this.uiManager.updateDocumentTitle();
          this.uiManager.hideAnalysis();
          this.uiManager.hideEmptyState();
          this.uiManager.showToast('График успешно загружен');
        });
      })
      .catch(err => {
        alert('Ошибка при загрузке файла: ' + err.message);
      });
  }

  handleExportHtml() {
    const scale = parseInt(this.dom.exportScaleSelect.value) || 8;
    const html = this.storage.generateHtmlExport(this.model, scale);
    const monthName = MONTH_NAMES[this.model.currentMonth];
    const filename = `график_${monthName}_${this.model.currentYear}.html`;
    this.storage.downloadHtml(html, filename);
    this.uiManager.showToast('HTML-файл экспортирован');
  }

  handleExportExcel() {
    try {
      const workbook = this.storage.generateExcelExport(this.model);
      const monthName = MONTH_NAMES[this.model.currentMonth];
      const filename = `график_${monthName}_${this.model.currentYear}.xlsx`;
      this.storage.downloadExcel(workbook, filename);
      this.uiManager.showToast('Excel-файл экспортирован');
    } catch (err) {
      console.error('Ошибка экспорта в Excel:', err);
      this.uiManager.showToast('❌ Ошибка при экспорте: ' + err.message, 4000);
    }
  }

  handleExportWord() {
    const scale = parseInt(this.dom.exportScaleSelect.value) || 8;
    const html = this.storage.generateHtmlExport(this.model, scale);
    const monthName = MONTH_NAMES[this.model.currentMonth];
    const filename = `график_${monthName}_${this.model.currentYear}`;
    this.storage.downloadWord(html, filename);
    this.uiManager.showToast('Word-файл экспортирован');
  }
}