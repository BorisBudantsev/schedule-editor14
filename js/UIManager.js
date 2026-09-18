// UIManager.js
import { MONTH_NAMES } from './constants.js';
import { AnalysisEngine } from './AnalysisEngine.js';
import { ScheduleModel } from './ScheduleModel.js';

export class UIManager {
  constructor(dom, model, view) {
    this.dom = dom;
    this.model = model;
    this.view = view;
    this.toastTimeout = null;
  }

  refreshTable() {
    const errors = AnalysisEngine.checkSchedule(this.model);
    this.view.render(errors);
    this.updateEmployeeCount();
    this.updateDocumentTitle();
    // Автосохранение
    ScheduleModel.saveToLocalStorage(this.model);
    // Скрываем подсказку, если она была
    this.hideEmptyState();
  }

  updateEmployeeCount() {
    this.dom.empCountSpan.textContent = this.model.employees.length;
  }

  updateDocumentTitle() {
    const monthName = MONTH_NAMES[this.model.currentMonth];
    document.title = `Редактор графика ОАР - ${monthName} ${this.model.currentYear}`;
  }

  showEmptyState() {
    if (this.model.employees.length === 0) {
      this.dom.emptyState.style.display = 'block';
    }
  }

  hideEmptyState() {
    this.dom.emptyState.style.display = 'none';
  }

  /**
   * Синхронизирует элементы управления датой с текущей моделью.
   */
  updateDateControls() {
    this.dom.monthSelect.value = this.model.currentMonth;
    this.dom.yearInput.value = this.model.currentYear;
  }

  showAnalysis(violations) {
    let html = '<h3>🔍 Результаты проверки ошибок</h3>';
    if (violations.length === 0) {
      html += '<div class="ok">✅ Все проверки пройдены! Нарушений не найдено.</div>';
    } else {
      html += `<div style="color:#991b1b; font-weight:600;">❌ Найдено нарушений: ${violations.length}</div>`;
      violations.forEach(v => {
        let typeLabel = '';
        switch (v.type) {
          case 'total': typeLabel = 'Общее количество'; break;
          case 'dezh': typeLabel = 'Дежурный'; break;
          case 'oper_missing':
          case 'oper_duplicate': typeLabel = 'Операционная'; break;
          case 'endo_missing':
          case 'endo_duplicate': typeLabel = 'Эндоскопия'; break;
          case 'extra': typeLabel = 'Лишний сотрудник'; break;
          default: typeLabel = 'Некорректное значение';
        }
        html += `<div class="violation"><span class="day">День ${v.day}:</span> [${typeLabel}] ${v.message}</div>`;
      });
    }
    this.dom.analysisResult.innerHTML = html;
    this.dom.analysisResult.style.display = 'block';
  }

  showLoadAnalysis(statsResult) {
    const { stats, totals, all } = statsResult;
    let html = '<h3>📊 Анализ загруженности сотрудников</h3>';
    html += '<table class="stats-table"><thead><tr>';
    html += '<th>Категория</th><th>Сотрудник</th>';
    html += '<th><span class="category-tag tag-endo">ЭНД*</span></th>';
    html += '<th><span class="category-tag tag-dezh">Д</span></th>';
    html += '<th><span class="category-tag tag-oper">З,Б,К,Ж</span></th>';
    html += '<th><span class="category-tag tag-other">прочее</span></th>';
    html += '<th>Всего рабочих</th><th>Выходные</th><th>Резервные</th><th>Всего дней</th>';
    html += '</tr></thead><tbody>';

    const catLabels = { permanent: 'Постоянный', parttime: 'Совместитель' };
    stats.forEach(s => {
      html += `<tr><td>${catLabels[s.category]}</td><td><strong>${this.escapeHtml(s.name)}</strong></td>`;
      html += `<td>${s.endo}</td><td>${s.dezh}</td><td>${s.oper}</td><td>${s.other}</td>`;
      html += `<td>${s.workDays}</td><td>${s.weekends}</td><td>${s.reserve}</td><td>${s.totalDays}</td></tr>`;
    });

    ['permanent', 'parttime'].forEach(cat => {
      const t = totals[cat];
      if (t.count > 0) {
        html += `<tr class="total-row"><td colspan="2"><strong>ИТОГО (${catLabels[cat]})</strong></td>`;
        html += `<td>${t.endo}</td><td>${t.dezh}</td><td>${t.oper}</td><td>${t.other}</td>`;
        html += `<td>${t.workDays}</td><td>${t.weekends}</td><td>${t.reserve}</td><td>${t.totalDays}</td></tr>`;
        const avg = (t.workDays / t.count).toFixed(1);
        html += `<tr><td colspan="2" style="font-size:12px; color:#475569;">Среднее рабочих дней: ${avg}</td><td colspan="8"></td></tr>`;
      }
    });

    html += `<tr class="total-row"><td colspan="2"><strong>ВСЕГО</strong></td>`;
    html += `<td>${all.endo}</td><td>${all.dezh}</td><td>${all.oper}</td><td>${all.other}</td>`;
    html += `<td>${all.workDays}</td><td>${all.weekends}</td><td>${all.reserve}</td><td>${all.totalDays}</td></tr>`;
    if (all.count > 0) {
      const avgAll = (all.workDays / all.count).toFixed(1);
      html += `<tr><td colspan="2" style="font-size:12px; color:#475569;">Среднее рабочих дней (все): ${avgAll}</td><td colspan="8"></td></tr>`;
    }
    html += '</tbody></table>';

    this.dom.analysisResult.innerHTML = html;
    this.dom.analysisResult.style.display = 'block';
  }

  hideAnalysis() {
    this.dom.analysisResult.style.display = 'none';
  }

  showToast(message, duration = 2000) {
    const toast = this.dom.toast;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => toast.classList.remove('show'), duration);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}