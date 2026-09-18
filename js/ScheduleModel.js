// ScheduleModel.js
import {
  MONTH_NAMES,
  DAY_NAMES_SHORT,
  DEFAULT_NUMBER,
  ALLOWED_PERMANENT,
  ALLOWED_PARTTIME,
  ALLOWED_SPECIAL,
  CATEGORY_LABELS,
  CATEGORY_BADGE_CLASS,
  RESERVE_PATTERN,
  SPECIAL_TYPES
} from './constants.js';

/**
 * Класс сотрудника
 */
export class Employee {
  constructor(id, name, category = 'permanent', days = []) {
    this.id = id;
    this.name = name;
    this.category = category; // 'permanent' | 'parttime'
    this.days = days; // массив строк
  }

  get isPermanent() {
    return this.category === 'permanent';
  }

  get isParttime() {
    return this.category === 'parttime';
  }
}

/**
 * Основная модель расписания
 */
export class ScheduleModel {
  constructor() {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
    this.dayCount = this.getDaysInMonth(this.currentMonth, this.currentYear);
    this.employees = [];
    this.special = {
      endo: new Array(this.dayCount).fill(DEFAULT_NUMBER),
      oper: new Array(this.dayCount).fill(DEFAULT_NUMBER)
    };
    this.nextId = 0;
    this.dirty = false;
    this.listeners = new Set();
  }

  // ---------- Утилиты дат ----------
  getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }

  getWeekday(day, month, year) {
    return new Date(year, month, day).getDay();
  }

  getWeekdayName(dayIndex) {
    const map = [6, 0, 1, 2, 3, 4, 5];
    return DAY_NAMES_SHORT[map[dayIndex]];
  }

  getWeekdays() {
    const arr = [];
    for (let d = 1; d <= this.dayCount; d++) {
      arr.push(this.getWeekday(d, this.currentMonth, this.currentYear));
    }
    return arr;
  }

  // ---------- Управление сотрудниками ----------
  addEmployee(name, category = 'permanent', silent = false) {
    if (!name && !silent) {
      throw new Error('Name is required when silent is false');
    }
    if (!name && silent) {
      name = `Сотрудник ${this.employees.length + 1}`;
    }
    if (category !== 'permanent' && category !== 'parttime') {
      category = 'permanent';
    }
    const days = new Array(this.dayCount).fill('');
    const emp = new Employee(this.nextId++, name, category, days);
    this.employees.push(emp);
    this.markDirty();
    this.emitChange();
    return emp;
  }

  removeEmployee(id) {
    if (this.employees.length <= 1) {
      throw new Error('Нельзя удалить последнего сотрудника');
    }
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return;
    this.employees.splice(index, 1);
    this.markDirty();
    this.emitChange();
  }

  renameEmployee(id, newName) {
    const emp = this.employees.find(e => e.id === id);
    if (emp && newName.trim()) {
      emp.name = newName.trim();
      this.markDirty();
      this.emitChange();
    }
  }

  changeCategory(id) {
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return;
    const newCat = emp.category === 'permanent' ? 'parttime' : 'permanent';
    emp.category = newCat;
    emp.days.fill(''); // сброс назначений
    this.markDirty();
    this.emitChange();
  }

  // ---------- Управление днями ----------
  setEmployeeDay(empId, dayIndex, value) {
    const emp = this.employees.find(e => e.id === empId);
    if (!emp) return;
    if (dayIndex < 0 || dayIndex >= this.dayCount) return;
    emp.days[dayIndex] = value;
    this.markDirty();
    this.emitChange();
  }

  setSpecialDay(type, dayIndex, value) {
    if (!SPECIAL_TYPES.includes(type)) return;
    if (dayIndex < 0 || dayIndex >= this.dayCount) return;
    this.special[type][dayIndex] = value;
    this.markDirty();
    this.emitChange();
  }

  clearDay(dayIndex) {
    if (dayIndex < 0 || dayIndex >= this.dayCount) return;
    this.employees.forEach(emp => {
      emp.days[dayIndex] = '';
    });
    this.special.endo[dayIndex] = DEFAULT_NUMBER;
    this.special.oper[dayIndex] = DEFAULT_NUMBER;
    this.markDirty();
    this.emitChange();
  }

  clearAll() {
    this.employees = [];
    this.special.endo.fill(DEFAULT_NUMBER);
    this.special.oper.fill(DEFAULT_NUMBER);
    this.addEmployee('Сотрудник 1', 'permanent', true);
    this.markDirty();
    this.emitChange();
  }

  // ---------- Изменение месяца/года ----------
  hasDataForDays(startDay, endDay) {
    for (let emp of this.employees) {
      for (let d = startDay; d < endDay; d++) {
        if (emp.days[d] && emp.days[d].trim() !== '') return true;
      }
    }
    for (let d = startDay; d < endDay; d++) {
      if (this.special.endo[d] !== DEFAULT_NUMBER) return true;
      if (this.special.oper[d] !== DEFAULT_NUMBER) return true;
    }
    return false;
  }

  adjustDays(newDayCount, force = false) {
    if (newDayCount === this.dayCount) return true;
    const oldDayCount = this.dayCount;

    if (newDayCount < oldDayCount && !force) {
      if (this.hasDataForDays(newDayCount, oldDayCount)) {
        return false;
      }
    }

    this.employees.forEach(emp => {
      if (emp.days.length > newDayCount) {
        emp.days = emp.days.slice(0, newDayCount);
      } else if (emp.days.length < newDayCount) {
        while (emp.days.length < newDayCount) {
          emp.days.push('');
        }
      }
    });

    SPECIAL_TYPES.forEach(type => {
      if (this.special[type].length > newDayCount) {
        this.special[type] = this.special[type].slice(0, newDayCount);
      } else if (this.special[type].length < newDayCount) {
        while (this.special[type].length < newDayCount) {
          this.special[type].push(DEFAULT_NUMBER);
        }
      }
    });

    this.dayCount = newDayCount;
    this.markDirty();
    this.emitChange();
    return true;
  }

  setMonth(month) {
    if (month < 0 || month > 11) return;
    this.currentMonth = month;
    this.dayCount = this.getDaysInMonth(this.currentMonth, this.currentYear);
    this.adjustDays(this.dayCount, true);
  }

  setYear(year) {
    this.currentYear = year;
    this.dayCount = this.getDaysInMonth(this.currentMonth, this.currentYear);
    this.adjustDays(this.dayCount, true);
  }

  applyDate(month, year) {
    const oldMonth = this.currentMonth;
    const oldYear = this.currentYear;
    this.currentMonth = month;
    this.currentYear = year;
    const newDayCount = this.getDaysInMonth(month, year);
    const success = this.adjustDays(newDayCount, false);
    if (!success) {
      this.currentMonth = oldMonth;
      this.currentYear = oldYear;
      return false;
    }
    this.emitChange();
    return true;
  }

  // ---------- Геттеры ----------
  getEmployees() {
    return [...this.employees];
  }

  getSpecial() {
    return {
      endo: [...this.special.endo],
      oper: [...this.special.oper]
    };
  }

  getDayCount() {
    return this.dayCount;
  }

  getNextId() {
    return this.nextId;
  }

  // ---------- Dirty flag ----------
  markDirty() {
    this.dirty = true;
  }

  resetDirty() {
    this.dirty = false;
  }

  isDirty() {
    return this.dirty;
  }

  // ---------- Сериализация ----------
  toJSON() {
    return {
      version: '1.0',
      month: this.currentMonth,
      year: this.currentYear,
      employees: this.employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        category: emp.category,
        days: [...emp.days]
      })),
      special: {
        endo: [...this.special.endo],
        oper: [...this.special.oper]
      },
      nextId: this.nextId
    };
  }

  static fromJSON(data) {
    const model = new ScheduleModel();
    if (!data || !data.employees || !data.special) {
      throw new Error('Неверный формат данных');
    }

    model.currentMonth = data.month ?? model.currentMonth;
    model.currentYear = data.year ?? model.currentYear;
    model.dayCount = model.getDaysInMonth(model.currentMonth, model.currentYear);

    model.employees = data.employees.map(empData => {
      const emp = new Employee(
        empData.id,
        empData.name,
        empData.category || 'permanent',
        [...empData.days]
      );
      return emp;
    });

    model.adjustDays(model.dayCount, true);

    model.special.endo = data.special.endo || new Array(model.dayCount).fill(DEFAULT_NUMBER);
    model.special.oper = data.special.oper || new Array(model.dayCount).fill(DEFAULT_NUMBER);
    if (model.special.endo.length < model.dayCount) {
      while (model.special.endo.length < model.dayCount) model.special.endo.push(DEFAULT_NUMBER);
    } else if (model.special.endo.length > model.dayCount) {
      model.special.endo = model.special.endo.slice(0, model.dayCount);
    }
    if (model.special.oper.length < model.dayCount) {
      while (model.special.oper.length < model.dayCount) model.special.oper.push(DEFAULT_NUMBER);
    } else if (model.special.oper.length > model.dayCount) {
      model.special.oper = model.special.oper.slice(0, model.dayCount);
    }

    model.nextId = data.nextId || model.employees.reduce((max, e) => Math.max(max, e.id), 0) + 1;
    model.resetDirty();
    return model;
  }

  // ---------- Подписка на изменения ----------
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitChange() {
    this.listeners.forEach(listener => listener(this));
  }

  // ========== НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С LOCALSTORAGE ==========
  static saveToLocalStorage(model) {
    try {
      const data = model.toJSON();
      localStorage.setItem('scheduleData', JSON.stringify(data));
    } catch (e) {
      console.warn('Не удалось сохранить данные в localStorage:', e);
    }
  }

  static loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('scheduleData');
      if (!raw) return null;
      const data = JSON.parse(raw);
      return ScheduleModel.fromJSON(data);
    } catch (e) {
      console.warn('Не удалось загрузить данные из localStorage:', e);
      return null;
    }
  }

  static clearLocalStorage() {
    localStorage.removeItem('scheduleData');
  }
}