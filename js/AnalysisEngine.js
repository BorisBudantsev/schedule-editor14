// AnalysisEngine.js

import { RESERVE_PATTERN } from './constants.js';

export class AnalysisEngine {
  /**
   * Проверяет расписание на ошибки.
   * @param {ScheduleModel} model
   * @returns {Array<object>} массив нарушений
   */
  static checkSchedule(model) {
    const violations = [];
    const dayCount = model.dayCount;
    const employees = model.employees;
    const special = model.special;

    for (let d = 0; d < dayCount; d++) {
      const endoVal = (special.endo[d] || '').trim();
      const operVal = (special.oper[d] || '').trim();

      // Определяем разрешённые коды для операционной
      let operAllowed = [];
      if (operVal === '' || operVal === '3') operAllowed = ['З', 'Б', 'К'];
      else if (operVal === '4') operAllowed = ['З', 'Б', 'К', 'Ж'];
      else if (operVal === '2') operAllowed = ['З', 'Б'];
      else if (operVal === '1') operAllowed = ['З'];
      else operAllowed = ['З', 'Б', 'К']; // fallback

      // Определяем разрешённые коды для эндоскопии
      let endoAllowed = [];
      if (endoVal === '' || endoVal === '3') endoAllowed = ['ЭНД1', 'ЭНД2', 'ЭНД3'];
      else if (endoVal === '2') endoAllowed = ['ЭНД1', 'ЭНД2'];
      else if (endoVal === '1') endoAllowed = ['ЭНД1'];
      else endoAllowed = ['ЭНД1', 'ЭНД2', 'ЭНД3'];

      const allowedCodes = [...operAllowed, ...endoAllowed];

      // Обязательные коды
      let operRequiredCodes = [];
      if (operVal === '' || operVal === '3') operRequiredCodes = ['З', 'Б', 'К'];
      else if (operVal === '4') operRequiredCodes = ['З', 'Б', 'К', 'Ж'];
      else if (operVal === '2') operRequiredCodes = ['З', 'Б'];
      else if (operVal === '1') operRequiredCodes = ['З'];
      else operRequiredCodes = ['З', 'Б', 'К'];

      let endoRequiredCodes = [];
      if (endoVal === '' || endoVal === '3') endoRequiredCodes = ['ЭНД1', 'ЭНД2', 'ЭНД3'];
      else if (endoVal === '2') endoRequiredCodes = ['ЭНД1', 'ЭНД2'];
      else if (endoVal === '1') endoRequiredCodes = ['ЭНД1'];
      else endoRequiredCodes = ['ЭНД1', 'ЭНД2', 'ЭНД3'];

      // Сбор назначений
      const dayAssignments = {};
      let totalWorking = 0;
      let dezhCount = 0;
      const workingNames = [];

      employees.forEach(emp => {
        const val = (emp.days[d] || '').trim();
        const lower = val.toLowerCase();
        if (val === '' || lower === 'вых') return;
        if (lower === '*' || RESERVE_PATTERN.test(lower)) return;

        totalWorking++;
        workingNames.push(emp.name);

        const code = val.toUpperCase();
        if (code === 'Д') {
          dezhCount++;
        } else {
          if (!allowedCodes.includes(code)) {
            violations.push({
              day: d + 1,
              type: 'extra',
              code: code,
              name: emp.name,
              message: `Лишний сотрудник ${emp.name} на месте ${code} (не разрешено в этот день)`
            });
          } else {
            if (!dayAssignments[code]) dayAssignments[code] = [];
            dayAssignments[code].push(emp.name);
          }
        }
      });

      // Проверка дежурного
      if (dezhCount !== 1) {
        violations.push({
          day: d + 1,
          type: 'dezh',
          message: `Должен быть ровно один дежурный (Д), фактически: ${dezhCount}`
        });
      }

      // Проверка общего числа работающих
      const expectedTotal = operRequiredCodes.length + endoRequiredCodes.length + 1;
      if (expectedTotal !== totalWorking) {
        violations.push({
          day: d + 1,
          type: 'total',
          expected: expectedTotal,
          actual: totalWorking,
          message: `Общее число работающих не соответствует ожидаемому (ожидалось ${expectedTotal}, фактически ${totalWorking}). Работают: ${workingNames.join(', ') || 'нет'}`
        });
      }

      // Проверка наличия обязательных операционных мест
      operRequiredCodes.forEach(code => {
        const assigned = dayAssignments[code] || [];
        if (assigned.length === 0) {
          violations.push({
            day: d + 1,
            type: 'oper_missing',
            code: code,
            message: `Отсутствует сотрудник на месте ${code}`
          });
        } else if (assigned.length > 1) {
          violations.push({
            day: d + 1,
            type: 'oper_duplicate',
            code: code,
            names: assigned,
            message: `На место ${code} назначено более одного сотрудника: ${assigned.join(', ')}`
          });
        }
      });

      // Проверка наличия обязательных эндоскопических мест
      endoRequiredCodes.forEach(code => {
        const assigned = dayAssignments[code] || [];
        if (assigned.length === 0) {
          violations.push({
            day: d + 1,
            type: 'endo_missing',
            code: code,
            message: `Отсутствует сотрудник на месте ${code}`
          });
        } else if (assigned.length > 1) {
          violations.push({
            day: d + 1,
            type: 'endo_duplicate',
            code: code,
            names: assigned,
            message: `На место ${code} назначено более одного сотрудника: ${assigned.join(', ')}`
          });
        }
      });
    }

    return violations;
  }

  /**
   * Вычисляет статистику загруженности сотрудников.
   * @param {ScheduleModel} model
   * @returns {object} { stats, totals, all }
   */
  static computeLoadStats(model) {
    const stats = model.employees.map(emp => {
      let weekends = 0;
      let reserve = 0;
      let endo = 0;
      let dezh = 0;
      let oper = 0;
      let other = 0;

      emp.days.forEach(val => {
        const trimmed = val.trim();
        const lower = trimmed.toLowerCase();
        if (trimmed === '' || lower === 'вых') {
          weekends++;
        } else if (lower === '*' || RESERVE_PATTERN.test(lower)) {
          reserve++;
        } else if (lower.startsWith('энд')) {
          endo++;
        } else if (lower === 'д') {
          dezh++;
        } else if (['з', 'б', 'к', 'ж'].includes(lower)) {
          oper++;
        } else {
          other++;
        }
      });

      const totalDays = emp.days.length;
      const workDays = endo + dezh + oper + other;

      return {
        name: emp.name,
        category: emp.category,
        endo,
        dezh,
        oper,
        other,
        workDays,
        weekends,
        reserve,
        totalDays
      };
    });

    const categories = ['permanent', 'parttime'];
    const totals = {};
    categories.forEach(cat => {
      const filtered = stats.filter(s => s.category === cat);
      totals[cat] = {
        count: filtered.length,
        endo: filtered.reduce((sum, r) => sum + r.endo, 0),
        dezh: filtered.reduce((sum, r) => sum + r.dezh, 0),
        oper: filtered.reduce((sum, r) => sum + r.oper, 0),
        other: filtered.reduce((sum, r) => sum + r.other, 0),
        workDays: filtered.reduce((sum, r) => sum + r.workDays, 0),
        weekends: filtered.reduce((sum, r) => sum + r.weekends, 0),
        reserve: filtered.reduce((sum, r) => sum + r.reserve, 0),
        totalDays: filtered.reduce((sum, r) => sum + r.totalDays, 0)
      };
    });

    const all = {
      count: stats.length,
      endo: stats.reduce((sum, r) => sum + r.endo, 0),
      dezh: stats.reduce((sum, r) => sum + r.dezh, 0),
      oper: stats.reduce((sum, r) => sum + r.oper, 0),
      other: stats.reduce((sum, r) => sum + r.other, 0),
      workDays: stats.reduce((sum, r) => sum + r.workDays, 0),
      weekends: stats.reduce((sum, r) => sum + r.weekends, 0),
      reserve: stats.reduce((sum, r) => sum + r.reserve, 0),
      totalDays: stats.reduce((sum, r) => sum + r.totalDays, 0)
    };

    return { stats, totals, all };
  }
}