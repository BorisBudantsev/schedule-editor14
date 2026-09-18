// TableView.js
import { ALLOWED_PERMANENT, ALLOWED_PARTTIME, ALLOWED_SPECIAL } from './constants.js';

export class TableView {
  constructor({ tableHead, tableBody, tableWrapper, model, callbacks }) {
    this.tableHead = tableHead;
    this.tableBody = tableBody;
    this.tableWrapper = tableWrapper;
    this.model = model;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  render(errors = []) {
    const month = this.model.currentMonth;
    const year = this.model.currentYear;
    const dayCount = this.model.dayCount;
    const weekdays = this.model.getWeekdays();

    const errorDays = new Set(errors.map(v => v.day));
    const errorMessagesByDay = {};
    errors.forEach(v => {
      if (!errorMessagesByDay[v.day]) errorMessagesByDay[v.day] = [];
      errorMessagesByDay[v.day].push(v.message);
    });

    const getTitleAttr = (day) => {
      const dayErrors = errorMessagesByDay[day] || [];
      return dayErrors.length ? ` title="${this.escapeHtml(dayErrors.join('\n'))}"` : '';
    };

    // --- Заголовки ---
    let theadHtml = `
      <tr>
        <th style="min-width:16px; width:16px;">№</th>
        <th style="min-width:70px; width:70px;">Сотрудник</th>
    `;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const isError = errorDays.has(d + 1);
      const titleAttr = getTitleAttr(d + 1);
      const cls = `day-header${isWeekend ? ' weekend-column' : ''}${isError ? ' error-day' : ''}`;
      theadHtml += `<th class="${cls}"${titleAttr}>${d + 1}`;
      theadHtml += `<button class="btn btn-secondary btn-xs" style="margin-left:2px; font-size:6px;" data-clear-day="${d}">✕</button>`;
      theadHtml += `</th>`;
    }
    theadHtml += `<th style="min-width:24px;">⚙️</th></tr>`;

    theadHtml += `
      <tr>
        <th style="background:#f8fafc; min-width:16px; width:16px;"></th>
        <th style="min-width:70px; width:70px; background:#f8fafc; font-weight:400; font-size:6px; color:#64748b;">&nbsp;</th>
    `;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const weekdayName = this.model.getWeekdayName(weekdays[d]);
      const isError = errorDays.has(d + 1);
      const titleAttr = getTitleAttr(d + 1);
      const cls = `day-weekday${isWeekend ? ' weekend-column' : ''}${isError ? ' error-day' : ''}`;
      theadHtml += `<th class="${cls}"${titleAttr}>${weekdayName}</th>`;
    }
    theadHtml += `<th style="background:#f8fafc; min-width:24px;"></th></tr>`;

    this.tableHead.innerHTML = theadHtml;

    // --- Тело ---
    let tbodyHtml = '';

    const employees = [...this.model.getEmployees()].sort((a, b) => {
      if (a.category === 'permanent' && b.category === 'parttime') return -1;
      if (a.category === 'parttime' && b.category === 'permanent') return 1;
      return 0;
    });

    let permanentCount = employees.filter(e => e.category === 'permanent').length;
    let parttimeCount = employees.filter(e => e.category === 'parttime').length;

    let rowIndex = 0;
    employees.forEach((emp, idx) => {
      if (idx === permanentCount && parttimeCount > 0) {
        tbodyHtml += `<tr class="divider-row"><td colspan="${dayCount + 3}" style="border-top:4px solid #1e293b; padding:0; height:0;"></td></tr>`;
      }

      rowIndex++;
      const rowNum = rowIndex;
      const catLabel = emp.category === 'permanent' ? 'П' : 'С';
      const catClass = emp.category === 'permanent' ? 'permanent' : 'parttime';

      tbodyHtml += `
        <tr>
          <td class="row-number">${rowNum}</td>
          <td class="row-header">
            <span class="emp-name" data-id="${emp.id}">${this.escapeHtml(emp.name)}</span>
            <span class="category-badge ${catClass}">${catLabel}</span>
            <button class="btn btn-secondary btn-xs" data-id="${emp.id}" data-action="rename">✎</button>
            <button class="btn btn-secondary btn-xs" data-id="${emp.id}" data-action="changeCat">Кат</button>
            <button class="btn btn-danger btn-xs" data-id="${emp.id}" data-action="remove">✕</button>
          </td>
      `;

      for (let d = 0; d < dayCount; d++) {
        const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
        const isError = errorDays.has(d + 1);
        const titleAttr = getTitleAttr(d + 1);
        let tdClass = '';
        if (isWeekend) tdClass += ' weekend-column';
        if (isError) tdClass += ' error-day';
        tdClass = tdClass.trim();
        const value = emp.days[d] || '';
        const starClass = value === '*' ? ' star-cell' : '';
        tbodyHtml += `<td class="${tdClass}"${titleAttr}><div class="cell-wrapper"><input type="text" value="${this.escapeHtml(value)}" data-emp-id="${emp.id}" data-day="${d}" class="${starClass}" placeholder="..."></div></td>`;
      }

      tbodyHtml += `<td style="background:#f8fafc;">...</td></tr>`;
    });

    // Эндоскопия
    tbodyHtml += `
      <tr class="special-row">
        <td class="row-number"></td>
        <td class="row-header"><span style="font-weight:700; color:#1e40af;">Э</span> <span style="font-size:6px; color:#475569;">(эндоскопия)</span></td>
    `;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const isError = errorDays.has(d + 1);
      const titleAttr = getTitleAttr(d + 1);
      let tdClass = '';
      if (isWeekend) tdClass += ' weekend-column';
      if (isError) tdClass += ' error-day';
      tdClass = tdClass.trim();
      const value = this.model.special.endo[d] || '';
      tbodyHtml += `<td class="${tdClass}"${titleAttr}><div class="cell-wrapper"><input type="text" value="${this.escapeHtml(value)}" data-special="endo" data-day="${d}" placeholder="..."></div></td>`;
    }
    tbodyHtml += `<td style="background:#fefce8;"></td></tr>`;

    // Операционная
    tbodyHtml += `
      <tr class="special-row">
        <td class="row-number"></td>
        <td class="row-header"><span style="font-weight:700; color:#065f46;">О</span> <span style="font-size:6px; color:#475569;">(операционная)</span></td>
    `;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const isError = errorDays.has(d + 1);
      const titleAttr = getTitleAttr(d + 1);
      let tdClass = '';
      if (isWeekend) tdClass += ' weekend-column';
      if (isError) tdClass += ' error-day';
      tdClass = tdClass.trim();
      const value = this.model.special.oper[d] || '';
      tbodyHtml += `<td class="${tdClass}"${titleAttr}><div class="cell-wrapper"><input type="text" value="${this.escapeHtml(value)}" data-special="oper" data-day="${d}" placeholder="..."></div></td>`;
    }
    tbodyHtml += `<td style="background:#fefce8;"></td></tr>`;

    this.tableBody.innerHTML = tbodyHtml;
  }

  bindEvents() {
    // ... (без изменений, оставляем как было)
    this.tableHead.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-clear-day]');
      if (!btn) return;
      const day = parseInt(btn.dataset.clearDay);
      if (!isNaN(day) && this.callbacks.onClearDay) {
        this.callbacks.onClearDay(day);
      }
    });

    this.tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        const empId = parseInt(btn.dataset.id);
        if (isNaN(empId)) return;
        if (action === 'remove' && this.callbacks.onRemoveEmployee) {
          this.callbacks.onRemoveEmployee(empId);
        } else if (action === 'rename' && this.callbacks.onRenameEmployee) {
          const emp = this.model.employees.find(e => e.id === empId);
          if (emp) {
            const newName = prompt('Введите новое имя сотрудника:', emp.name);
            if (newName && newName.trim() !== '') {
              this.callbacks.onRenameEmployee(empId, newName.trim());
            }
          }
        } else if (action === 'changeCat' && this.callbacks.onChangeCategory) {
          this.callbacks.onChangeCategory(empId);
        }
      }
    });

    this.tableBody.addEventListener('dblclick', (e) => {
      const target = e.target.closest('.emp-name');
      if (!target) return;
      const empId = parseInt(target.dataset.id);
      const emp = this.model.employees.find(e => e.id === empId);
      if (emp && this.callbacks.onRenameEmployee) {
        const newName = prompt('Введите новое имя сотрудника:', emp.name);
        if (newName && newName.trim() !== '') {
          this.callbacks.onRenameEmployee(empId, newName.trim());
        }
      }
    });

    this.tableBody.addEventListener('click', (e) => {
      const input = e.target.closest('input[type="text"]');
      if (!input) return;
      e.stopPropagation();
      if (this.callbacks.onCellClick) {
        const empId = input.dataset.empId ? parseInt(input.dataset.empId) : null;
        const specialType = input.dataset.special || null;
        const day = parseInt(input.dataset.day);
        if (!isNaN(day)) {
          this.callbacks.onCellClick({ empId, specialType, day, input });
        }
      }
    });

    this.tableBody.addEventListener('change', (e) => {
      const input = e.target.closest('input[type="text"]');
      if (!input) return;
      const empId = input.dataset.empId ? parseInt(input.dataset.empId) : null;
      const specialType = input.dataset.special || null;
      const day = parseInt(input.dataset.day);
      const newValue = input.value.trim();
      if (!isNaN(day) && this.callbacks.onCellChange) {
        this.callbacks.onCellChange({ empId, specialType, day, newValue, input });
      }
    });

    this.tableBody.addEventListener('paste', (e) => {
      const input = e.target.closest('input[type="text"]');
      if (!input) return;
      e.preventDefault();
      const clipboardData = e.clipboardData || window.clipboardData;
      const pastedText = clipboardData.getData('text');
      if (!pastedText) return;
      const rows = pastedText.split(/\n/).filter(r => r.trim() !== '');
      const values = rows[0].split(/\t|;/).map(v => v.trim());
      const empId = input.dataset.empId ? parseInt(input.dataset.empId) : null;
      const specialType = input.dataset.special || null;
      const day = parseInt(input.dataset.day);
      if (!isNaN(day) && this.callbacks.onPaste) {
        this.callbacks.onPaste({ empId, specialType, day, values });
      }
    });
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}