// EmployeeManagerUI.js
export class EmployeeManagerUI {
  constructor(model, employeeManager, view, uiManager) {
    this.model = model;
    this.employeeManager = employeeManager;
    this.view = view;
    this.uiManager = uiManager;
  }

  addEmployee() {
    const name = prompt('Введите имя нового сотрудника:', '');
    if (name === null) return;
    const trimmed = name.trim();
    if (!trimmed) {
      alert('Имя не может быть пустым.');
      return;
    }
    const catInput = prompt('Введите категорию (пост – постоянный, совм – совместитель):', 'пост');
    if (catInput === null) return;
    const category = (catInput.trim().toLowerCase() === 'совм' || catInput.trim().toLowerCase() === 'с') 
      ? 'parttime' : 'permanent';
    const newEmp = this.employeeManager.add(trimmed, category);
    if (newEmp) {
      const days = new Array(this.model.dayCount).fill('');
      const empObj = {
        id: newEmp.id,
        name: trimmed,
        category: category,
        days: days
      };
      this.model.employees.push(empObj);
      const maxId = this.model.employees.reduce((max, e) => Math.max(max, e.id), 0);
      this.model.nextId = Math.max(this.model.nextId, maxId + 1);
      this.uiManager.refreshTable();
      this.uiManager.showToast(`Сотрудник "${trimmed}" добавлен`);
    } else {
      alert(`Сотрудник с именем "${trimmed}" уже существует.`);
    }
  }

  removeEmployee(id) {
    if (this.model.employees.length <= 1) {
      alert('Нельзя удалить последнего сотрудника.');
      return;
    }
    const emp = this.model.employees.find(e => e.id === id);
    if (!emp) return;
    if (!confirm(`Удалить сотрудника "${emp.name}"?`)) return;
    this.employeeManager.remove(id);
    this.model.removeEmployee(id);
    this.uiManager.refreshTable();
  }

   renameEmployee(id, newName) {
    const success = this.employeeManager.update(id, newName);
    if (!success) {
      this.uiManager.showToast('Не удалось переименовать: имя пустое или уже занято в справочнике.');
      return;
    }
    this.model.renameEmployee(id, newName);
    this.uiManager.refreshTable();
  }

  changeCategory(id) {
    const emp = this.model.employees.find(e => e.id === id);
    if (!emp) return;
    const newCat = emp.category === 'permanent' ? 'parttime' : 'permanent';
    const catLabel = newCat === 'permanent' ? 'постоянный' : 'совместитель';
    if (!confirm(`Сменить категорию на "${catLabel}"? Все назначения сотрудника будут сброшены.`)) return;
    this.employeeManager.update(id, emp.name, newCat);
    this.model.changeCategory(id);
    this.uiManager.refreshTable();
  }
}