// StorageService.js

import { MONTH_NAMES, DAY_NAMES_SHORT } from './constants.js';
import { AnalysisEngine } from './AnalysisEngine.js';

// Получаем глобальный XLSX (если загружен)
const XLSX = window.XLSX;
const XLSX_AVAILABLE = !!XLSX;

export class StorageService {
  /**
   * Сохраняет данные в JSON-файл.
   * Использует File System Access API, если доступен, иначе скачивает файл.
   * @param {object} data - сериализованные данные для сохранения
   * @param {string} suggestedName - предлагаемое имя файла
   * @returns {Promise<void>}
   */
  async saveToJson(data, suggestedName) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === 'AbortError' || err.code === 20) {
          throw new Error('aborted');
        }
        console.warn('File System Access API error, falling back to download:', err);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Читает JSON из файла.
   * @param {File} file - объект File из input или drag-and-drop
   * @returns {Promise<object>}
   */
  loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          resolve(data);
        } catch (err) {
          reject(new Error('Ошибка парсинга JSON: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /**
   * Генерирует HTML-код для экспорта графика.
   * @param {ScheduleModel} model - модель расписания
   * @param {number} scale - размер шрифта таблицы в пикселях
   * @returns {string} HTML-строка
   */
  generateHtmlExport(model, scale = 8) {
    const month = model.currentMonth;
    const year = model.currentYear;
    const monthName = MONTH_NAMES[month];
    const dayCount = model.dayCount;
    const title = `График работы ОАР на ${monthName} ${year}`;
    const weekdays = model.getWeekdays();

    const colWidth = `calc((100% - 130px) / ${dayCount})`;

    let html = `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', Roboto, sans-serif; margin:20px; }
      h1 { text-align:center; color:#1e293b; }
      table { border-collapse: collapse; width:100%; table-layout: fixed; font-size:${scale}px; }
      th, td { border:1px solid #999; padding:1px 0px; overflow:hidden; text-overflow:ellipsis; }
      th { background:#e9edf2; font-weight:600; }
      .day-weekday { background:#f1f5f9; font-weight:400; font-size:${Math.max(4, scale - 2)}px; color:#475569; }
      .row-header { font-weight:600; background:#f8fafc; padding:1px 2px; text-align:left; width:70px; }
      .row-number { font-weight:600; color:#64748b; background:#f8fafc; text-align:center; width:16px; }
      .special { background:#fefce8; }
      .special .row-header { background:#fefce8; color:#854d0e; }
      .divider-row td { border-top: 4px solid #1e293b; padding:0; height:0; }
      .footer { margin-top:20px; text-align:center; color:#64748b; font-size:12px; }
      .col-day { width: ${colWidth}; }
      .col-action { width: 30px; }
      td { text-align:center; }
      .row-header { text-align:left; }
      .weekend-column { background: #d4dce8 !important; }
      .weekend-column.day-header { background: #c8d4e0 !important; }
      .weekend-column.day-weekday { background: #c8d4e0 !important; }
    </style>
    </head><body>
    <h1>${title}</h1>
    <table>
      <colgroup>
        <col class="row-number" style="width:16px;">
        <col class="row-header" style="width:70px;">
    `;

    for (let d = 0; d < dayCount; d++) {
      html += `<col class="col-day">`;
    }
    html += `<col class="col-action" style="width:30px;">
      </colgroup>
      <thead><tr>
        <th class="row-number">№</th>
        <th class="row-header">Сотрудник</th>`;

    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      html += `<th class="col-day day-header${isWeekend ? ' weekend-column' : ''}">${d + 1}</th>`;
    }
    html += `<th class="col-action">⚙️</th></tr>
        <tr><th class="row-number"></th><th class="row-header" style="background:#f8fafc; font-weight:400;"></th>`;

    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const weekdayName = model.getWeekdayName(weekdays[d]);
      html += `<th class="day-weekday${isWeekend ? ' weekend-column' : ''}">${weekdayName}</th>`;
    }
    html += `<th class="col-action" style="background:#f8fafc;"></th></tr></thead><tbody>`;

    const employees = [...model.employees].sort((a, b) => {
      if (a.category === 'permanent' && b.category === 'parttime') return -1;
      if (a.category === 'parttime' && b.category === 'permanent') return 1;
      return 0;
    });
    const permCount = employees.filter(e => e.category === 'permanent').length;
    const partCount = employees.filter(e => e.category === 'parttime').length;

    employees.forEach((emp, idx) => {
      if (idx === permCount && partCount > 0) {
        html += `<tr class="divider-row"><td colspan="${dayCount + 3}" style="border-top:4px solid #1e293b; padding:0; height:0;"></td></tr>`;
      }
      html += `<tr><td class="row-number">${idx + 1}</td><td class="row-header">${this.escapeHtml(emp.name)}</td>`;
      for (let d = 0; d < dayCount; d++) {
        const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
        const val = emp.days[d] || '';
        html += `<td class="col-day${isWeekend ? ' weekend-column' : ''}">${this.escapeHtml(val)}</td>`;
      }
      html += `<td class="col-action"></td></tr>`;
    });

    html += `<tr class="special"><td></td><td class="row-header">Э</td>`;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const val = model.special.endo[d] || '';
      html += `<td class="col-day${isWeekend ? ' weekend-column' : ''}">${this.escapeHtml(val)}</td>`;
    }
    html += `<td class="col-action"></td></tr>`;

    html += `<tr class="special"><td></td><td class="row-header">О</td>`;
    for (let d = 0; d < dayCount; d++) {
      const isWeekend = weekdays[d] === 0 || weekdays[d] === 6;
      const val = model.special.oper[d] || '';
      html += `<td class="col-day${isWeekend ? ' weekend-column' : ''}">${this.escapeHtml(val)}</td>`;
    }
    html += `<td class="col-action"></td></tr>`;

    html += `</tbody></table>
      <div class="footer">Создано в редакторе графика ОАР. Месяц: ${monthName} ${year}</div>
      </body></html>`;

    return html;
  }

  downloadHtml(htmlContent, filename) {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Скачивает HTML-контент как Word-документ (.doc)
   * @param {string} htmlContent - готовый HTML-код (включая <html>, <head>, <body>)
   * @param {string} filename - имя файла (без расширения или с .doc)
   */
  downloadWord(htmlContent, filename) {
    // Добавляем специальный заголовок для Word, чтобы правильно интерпретировал стили
    const fullHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* Стили для Word (можно оставить как есть) */
    table { border-collapse: collapse; width: 100%; font-size: 10pt; font-family: 'Segoe UI', Arial, sans-serif; }
    th, td { border: 1px solid #999; padding: 2px 4px; text-align: center; }
    th { background: #e9edf2; font-weight: bold; }
    .weekend-column { background: #d4dce8; }
    .special { background: #fefce8; }
    .row-header { font-weight: bold; background: #f8fafc; text-align: left; }
    .row-number { font-weight: bold; background: #f8fafc; text-align: center; }
    .footer { margin-top: 20px; text-align: center; color: #64748b; font-size: 10pt; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.doc') ? filename : filename + '.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ===================== ЭКСПОРТ В EXCEL =====================

  generateExcelExport(model) {
    if (!XLSX_AVAILABLE) {
      throw new Error('Библиотека XLSX не загружена. Проверьте подключение или используйте другой браузер.');
    }
    try {
      const wb = XLSX.utils.book_new();

      const sheet1 = this.createScheduleSheet(model);
      XLSX.utils.book_append_sheet(wb, sheet1, 'График');

      const sheet2 = this.createErrorsSheet(model);
      XLSX.utils.book_append_sheet(wb, sheet2, 'Ошибки');

      const sheet3 = this.createStatsSheet(model);
      XLSX.utils.book_append_sheet(wb, sheet3, 'Статистика');

      return wb;
    } catch (err) {
      console.error('generateExcelExport error:', err);
      throw new Error('Ошибка формирования Excel: ' + err.message);
    }
  }

  downloadExcel(workbook, filename) {
    if (!XLSX_AVAILABLE) {
      throw new Error('Библиотека XLSX не загружена. Невозможно экспортировать Excel.');
    }
    try {
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('downloadExcel error:', err);
      throw new Error('Ошибка скачивания Excel: ' + err.message);
    }
  }

  createScheduleSheet(model) {
    const dayCount = model.dayCount;
    const weekdays = model.getWeekdays();
    const monthName = MONTH_NAMES[model.currentMonth];
    const year = model.currentYear;

    const data = [];
    data.push([`График работы ОАР на ${monthName} ${year}`]);
    const headerRow = ['№', 'Сотрудник'];
    for (let d = 0; d < dayCount; d++) {
      headerRow.push(d + 1);
    }
    data.push(headerRow);

    const weekdayRow = ['', ''];
    for (let d = 0; d < dayCount; d++) {
      weekdayRow.push(this.getWeekdayName(weekdays[d]));
    }
    data.push(weekdayRow);

    const employees = [...model.employees].sort((a, b) => {
      if (a.category === 'permanent' && b.category === 'parttime') return -1;
      if (a.category === 'parttime' && b.category === 'permanent') return 1;
      return 0;
    });

    employees.forEach((emp, idx) => {
      const row = [
        idx + 1,
        `${emp.name} (${emp.category === 'permanent' ? 'П' : 'С'})`
      ];
      for (let d = 0; d < dayCount; d++) {
        row.push(emp.days[d] || '');
      }
      data.push(row);
    });

    const endoRow = ['', 'Э (эндоскопия)'];
    for (let d = 0; d < dayCount; d++) {
      endoRow.push(model.special.endo[d] || '');
    }
    data.push(endoRow);

    const operRow = ['', 'О (операционная)'];
    for (let d = 0; d < dayCount; d++) {
      operRow.push(model.special.oper[d] || '');
    }
    data.push(operRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const totalCols = 2 + dayCount;
    if (totalCols > 1) {
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];
    }
    ws['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      ...Array(dayCount).fill({ wch: 6 })
    ];
    return ws;
  }

  createErrorsSheet(model) {
    const violations = AnalysisEngine.checkSchedule(model);
    const data = [];
    data.push(['День', 'Тип', 'Сообщение']);

    if (violations.length === 0) {
      data.push(['', '✅', 'Ошибок не найдено']);
    } else {
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
        data.push([v.day, typeLabel, v.message]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 60 }];
    return ws;
  }

  createStatsSheet(model) {
    const { stats, totals, all } = AnalysisEngine.computeLoadStats(model);
    const data = [];
    data.push([
      'Категория', 'Сотрудник', 'ЭНД*', 'Д', 'З,Б,К,Ж', 'прочее',
      'Всего рабочих', 'Выходные', 'Резервные', 'Всего дней'
    ]);

    const catLabels = { permanent: 'Постоянный', parttime: 'Совместитель' };
    stats.forEach(s => {
      data.push([
        catLabels[s.category] || s.category,
        s.name,
        s.endo,
        s.dezh,
        s.oper,
        s.other,
        s.workDays,
        s.weekends,
        s.reserve,
        s.totalDays
      ]);
    });

    ['permanent', 'parttime'].forEach(cat => {
      const t = totals[cat];
      if (t.count > 0) {
        data.push([
          `ИТОГО (${catLabels[cat]})`, '',
          t.endo, t.dezh, t.oper, t.other,
          t.workDays, t.weekends, t.reserve, t.totalDays
        ]);
        const avg = (t.workDays / t.count).toFixed(1);
        data.push([`Среднее рабочих дней: ${avg}`, '', '', '', '', '', '', '', '', '']);
      }
    });

    data.push([
      'ВСЕГО', '',
      all.endo, all.dezh, all.oper, all.other,
      all.workDays, all.weekends, all.reserve, all.totalDays
    ]);
    if (all.count > 0) {
      const avgAll = (all.workDays / all.count).toFixed(1);
      data.push([`Среднее рабочих дней (все): ${avgAll}`, '', '', '', '', '', '', '', '', '']);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 20 }, { wch: 25 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
      { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    return ws;
  }

  getWeekdayName(dayIndex) {
    const map = [6, 0, 1, 2, 3, 4, 5];
    return DAY_NAMES_SHORT[map[dayIndex]] || '';
  }
}