// ToolbarHandler.js
import { AnalysisEngine } from './AnalysisEngine.js';

export class ToolbarHandler {
  constructor(dom, wizardManager, employeeUI, tableActions, exportManager, uiManager, model) {
    this.dom = dom;
    this.wizardManager = wizardManager;
    this.employeeUI = employeeUI;
    this.tableActions = tableActions;
    this.exportManager = exportManager;
    this.uiManager = uiManager;
    this.model = model;
    this.bindEvents();
  }

  bindEvents() {
    this.dom.addEmployeeBtn.addEventListener('click', () => this.employeeUI.addEmployee());
    this.dom.newGraphBtn.addEventListener('click', () => this.wizardManager.openWizard());
    this.dom.saveGraphBtn.addEventListener('click', () => this.exportManager.handleSave());
    this.dom.loadGraphBtn.addEventListener('click', () => this.dom.loadFileInput.click());
    this.dom.loadFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.exportManager.handleLoadFile(e.target.files[0]);
        e.target.value = '';
      }
    });
    this.dom.applyDateBtn.addEventListener('click', () => this.tableActions.applyDate());
    this.dom.monthSelect.addEventListener('change', () => {
      this.dom.yearInput.value = this.model.currentYear;
    });

    this.dom.toolsDropdown.addEventListener('change', (e) => {
      const value = e.target.value;
      if (!value) return;
      switch (value) {
        case 'analyze':
          const violations = AnalysisEngine.checkSchedule(this.model);
          this.uiManager.showAnalysis(violations);
          break;
        case 'stats':
          const stats = AnalysisEngine.computeLoadStats(this.model);
          this.uiManager.showLoadAnalysis(stats);
          break;
        case 'clear':
          this.tableActions.clearAll();
          break;
      }
      e.target.value = '';
    });

    this.dom.exportDropdown.addEventListener('change', (e) => {
      const value = e.target.value;
      if (!value) return;
      switch (value) {
        case 'html': this.exportManager.handleExportHtml(); break;
        case 'excel': this.exportManager.handleExportExcel(); break;
        case 'word': this.exportManager.handleExportWord(); break;
      }
      e.target.value = '';
    });
  }
}