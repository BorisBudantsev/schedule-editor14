// EmployeeManager.js
export class EmployeeManager {
  constructor() {
    this.employees = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('employeeDirectory');
      if (data) {
        this.employees = JSON.parse(data);
        this.employees = this.employees.filter(e => e.name && e.name.trim() !== '');
        this.employees.forEach(e => {
          if (!e.id) e.id = Date.now() + Math.floor(Math.random() * 1000);
          if (!e.category) e.category = 'permanent';
        });
      } else {
        this.employees = [
          { id: 1, name: 'Иванов', category: 'permanent' },
          { id: 2, name: 'Петров', category: 'permanent' },
          { id: 3, name: 'Сидоров', category: 'permanent' },
          { id: 4, name: 'Кузнецова', category: 'permanent' },
          { id: 5, name: 'Смирнова', category: 'permanent' },
          { id: 6, name: 'Попов', category: 'parttime' },
          { id: 7, name: 'Васильев', category: 'parttime' },
        ];
      }
      this.saveToStorage();
    } catch (e) {
      console.warn('Не удалось загрузить справочник сотрудников:', e);
      this.employees = [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('employeeDirectory', JSON.stringify(this.employees));
    } catch (e) {
      console.warn('Не удалось сохранить справочник сотрудников:', e);
    }
  }

  getAll() {
    return [...this.employees];
  }

  getById(id) {
    return this.employees.find(e => e.id === id);
  }

  add(name, category = 'permanent') {
    name = name.trim();
    if (!name) return null;
    const exists = this.employees.some(e => e.name.toLowerCase() === name.toLowerCase());
    if (exists) return null;
    const newEmployee = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: name,
      category: category
    };
    this.employees.push(newEmployee);
    this.saveToStorage();
    return newEmployee;
  }

  update(id, newName, newCategory) {
    const emp = this.getById(id);
    if (!emp) return false;
    newName = newName.trim();
    if (!newName) return false;
    const exists = this.employees.some(e => 
      e.id !== id && e.name.toLowerCase() === newName.toLowerCase()
    );
    if (exists) return false;
    emp.name = newName;
    if (newCategory) emp.category = newCategory;
    this.saveToStorage();
    return true;
  }

  remove(id) {
    const index = this.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    this.employees.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getNames() {
    return this.employees.map(e => e.name);
  }

  importFromTemp(tempEmployees) {
    let added = 0;
    tempEmployees.forEach(emp => {
      const result = this.add(emp.name, emp.category);
      if (result) added++;
    });
    return added;
  }
}