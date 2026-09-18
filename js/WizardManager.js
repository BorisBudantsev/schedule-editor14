// WizardManager.js
import { EmployeeManager } from './EmployeeManager.js';
import { ScheduleModel } from './ScheduleModel.js';

export class WizardManager {
  constructor(dom, model, employeeManager, onTableCreated) {
    this.dom = dom;
    this.model = model;
    this.employeeManager = employeeManager;
    this.onTableCreated = onTableCreated;

    this.wizardStep = 1;
    this.wizardMonth = 0;
    this.wizardYear = 2025;
    this.selectedEmployeeIds = [];

    this.initWizard();
  }

  initWizard() {
    const dom = this.dom;
    dom.wizardCloseBtn.addEventListener('click', () => this.closeWizard());
    dom.wizardPrevBtn.addEventListener('click', () => this.prevStep());
    dom.wizardNextBtn.addEventListener('click', () => this.nextStep());
    dom.wizardFinishBtn.addEventListener('click', () => this.finishWizard());
    dom.wizardAddEmployeeBtn.addEventListener('click', () => this.wizardAddEmployee());
    dom.wizardDeleteEmployeeBtn.addEventListener('click', () => this.wizardDeleteSelected());
    dom.wizardSelectAll.addEventListener('change', (e) => this.wizardToggleAll(e.target.checked));
    dom.wizardEmployeeName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.wizardAddEmployee();
    });

    dom.wizardModal.addEventListener('click', (e) => {
      if (e.target === dom.wizardModal) this.closeWizard();
    });
  }

  openWizard() {
    this.wizardMonth = this.model.currentMonth !== undefined ? this.model.currentMonth : new Date().getMonth();
    this.wizardYear = this.model.currentYear !== undefined ? this.model.currentYear : new Date().getFullYear();
    this.selectedEmployeeIds = this.employeeManager.getAll().map(e => e.id);
    this.dom.wizardMonthSelect.value = this.wizardMonth;
    this.dom.wizardYearInput.value = this.wizardYear;
    this.dom.wizardModal.style.display = 'flex';
    this.renderWizardStep();
    this.dom.wizardMessage.textContent = '';
  }

  closeWizard() {
    this.dom.wizardModal.style.display = 'none';
  }

  renderWizardStep() {
    const dom = this.dom;
    dom.wizardStep1.style.display = 'none';
    dom.wizardStep2.style.display = 'none';
    dom[`wizardStep${this.wizardStep}`].style.display = 'block';

    dom.wizardPrevBtn.style.display = this.wizardStep > 1 ? 'inline-block' : 'none';
    dom.wizardNextBtn.style.display = this.wizardStep < 2 ? 'inline-block' : 'none';
    dom.wizardFinishBtn.style.display = this.wizardStep === 2 ? 'inline-block' : 'none';
    dom.wizardTitle.textContent = `Создание новой таблицы (шаг ${this.wizardStep} из 2)`;

    if (this.wizardStep === 2) {
      this.wizardRenderEmployeeList();
    }
  }

  nextStep() {
    if (this.wizardStep === 1) {
      this.wizardMonth = parseInt(this.dom.wizardMonthSelect.value);
      this.wizardYear = parseInt(this.dom.wizardYearInput.value) || new Date().getFullYear();
    }
    if (this.wizardStep < 2) {
      this.wizardStep++;
      this.renderWizardStep();
    }
  }

  prevStep() {
    if (this.wizardStep > 1) {
      this.wizardStep--;
      this.renderWizardStep();
    }
  }

  // ========== ИСПРАВЛЕННЫЙ finishWizard ==========
  finishWizard() {
    const selectedEmployees = this.employeeManager.getAll().filter(e => this.selectedEmployeeIds.includes(e.id));
    if (selectedEmployees.length === 0) {
      this.dom.wizardMessage.textContent = 'Выберите хотя бы одного сотрудника.';
      return;
    }

    const month = this.wizardMonth;
    const year = this.wizardYear;

    // 1. Полностью очищаем localStorage, чтобы избежать конфликтов со старыми данными
    ScheduleModel.clearLocalStorage();

    // 2. Очищаем модель
    this.model.employees = [];
    this.model.nextId = 0;
    this.model.currentMonth = month;
    this.model.currentYear = year;
    this.model.dayCount = this.model.getDaysInMonth(month, year);
    this.model.special.endo = new Array(this.model.dayCount).fill('3');
    this.model.special.oper = new Array(this.model.dayCount).fill('3');

    // 3. Добавляем выбранных сотрудников напрямую с корректными id из справочника
    selectedEmployees.forEach(emp => {
      const days = new Array(this.model.dayCount).fill('');
      const empObj = {
        id: emp.id,
        name: emp.name,
        category: emp.category,
        days: days
      };
      this.model.employees.push(empObj);
      if (emp.id >= this.model.nextId) {
        this.model.nextId = emp.id + 1;
      }
    });

    // 4. Убеждаемся, что nextId больше всех id
    const maxId = this.model.employees.reduce((max, e) => Math.max(max, e.id), 0);
    this.model.nextId = Math.max(this.model.nextId, maxId + 1);

    // 5. Сбрасываем флаг dirty и принудительно сохраняем новую модель в localStorage
    this.model.resetDirty();
    ScheduleModel.saveToLocalStorage(this.model);

    // 6. Закрываем мастер и обновляем таблицу
    this.closeWizard();
    if (this.onTableCreated) {
      this.onTableCreated();
    }
  }

  // ========== УПРАВЛЕНИЕ СОТРУДНИКАМИ В МАСТЕРЕ ==========
  wizardAddEmployee() {
    const nameInput = this.dom.wizardEmployeeName;
    const catSelect = this.dom.wizardEmployeeCategory;
    const name = nameInput.value.trim();
    if (!name) {
      this.dom.wizardMessage.textContent = 'Введите имя сотрудника.';
      return;
    }
    const newEmp = this.employeeManager.add(name, catSelect.value);
    if (newEmp) {
      nameInput.value = '';
      this.dom.wizardMessage.textContent = `Сотрудник "${name}" добавлен.`;
      this.selectedEmployeeIds.push(newEmp.id);
      this.wizardRenderEmployeeList();
    } else {
      this.dom.wizardMessage.textContent = `Сотрудник с именем "${name}" уже существует.`;
    }
  }

  wizardDeleteSelected() {
    const checked = this.dom.wizardEmployeeList.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length === 0) {
      this.dom.wizardMessage.textContent = 'Выберите сотрудников для удаления.';
      return;
    }
    if (!confirm(`Удалить выбранных сотрудников (${checked.length})?`)) return;
    const idsToRemove = [];
    checked.forEach(cb => {
      const id = parseInt(cb.value);
      idsToRemove.push(id);
    });
    idsToRemove.forEach(id => {
      this.employeeManager.remove(id);
      const idx = this.selectedEmployeeIds.indexOf(id);
      if (idx > -1) this.selectedEmployeeIds.splice(idx, 1);
    });
    this.dom.wizardMessage.textContent = `Удалено сотрудников: ${idsToRemove.length}`;
    this.wizardRenderEmployeeList();
  }

  wizardToggleAll(checked) {
    this.dom.wizardEmployeeList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = checked;
      const id = parseInt(cb.value);
      if (checked) {
        if (!this.selectedEmployeeIds.includes(id)) this.selectedEmployeeIds.push(id);
      } else {
        const idx = this.selectedEmployeeIds.indexOf(id);
        if (idx > -1) this.selectedEmployeeIds.splice(idx, 1);
      }
    });
  }

  wizardRenderEmployeeList() {
    const tbody = this.dom.wizardEmployeeList;
    tbody.innerHTML = '';
    const employees = this.employeeManager.getAll();
    if (employees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Список пуст. Добавьте сотрудников.</td></tr>';
      return;
    }
    employees.forEach(emp => {
      const tr = document.createElement('tr');
      const checked = this.selectedEmployeeIds.includes(emp.id) ? 'checked' : '';
      tr.innerHTML = `
        <td><input type="checkbox" value="${emp.id}" ${checked}></td>
        <td>${this.escapeHtml(emp.name)}</td>
        <td>${emp.category === 'permanent' ? 'Постоянный' : 'Совместитель'}</td>
      `;
      tbody.appendChild(tr);
    });

    const allCb = this.dom.wizardSelectAll;
    const allChecked = tbody.querySelectorAll('input[type="checkbox"]:checked').length === employees.length;
    allCb.checked = allChecked && employees.length > 0;

    tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(e.target.value);
        if (e.target.checked) {
          if (!this.selectedEmployeeIds.includes(id)) this.selectedEmployeeIds.push(id);
        } else {
          const idx = this.selectedEmployeeIds.indexOf(id);
          if (idx > -1) this.selectedEmployeeIds.splice(idx, 1);
        }
        const allChecked = tbody.querySelectorAll('input[type="checkbox"]:checked').length === employees.length;
        allCb.checked = allChecked && employees.length > 0;
      });
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}