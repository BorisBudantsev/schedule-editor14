// PopupManager.js
import { ALLOWED_PERMANENT, ALLOWED_PARTTIME } from './constants.js';

export class PopupManager {
  constructor(dom, model, view, uiManager) {
    this.dom = dom;
    this.model = model;
    this.view = view;
    this.uiManager = uiManager;
    this.activePopup = null;
    this.activeInput = null;
    this.bindPopupMenus();
  }

  bindPopupMenus() {
    const menus = [
      { type: 'employee', element: this.dom.popupMenuEmployee },
      { type: 'parttime', element: this.dom.popupMenuParttime },
      { type: 'endo', element: this.dom.popupMenuEndo },
      { type: 'oper', element: this.dom.popupMenuOper }
    ];

    menus.forEach(({ type, element }) => {
      element.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || !this.activeInput) return;
        const value = btn.dataset.value;
        this.handlePopupSelection(value);
        this.hidePopup();
      });
    });

    document.addEventListener('click', (e) => {
      if (this.activePopup && !this.activePopup.contains(e.target) && !e.target.closest('input[type="text"]')) {
        this.hidePopup();
      }
    });

    document.querySelectorAll('.popup-menu').forEach(menu => {
      menu.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  showPopup(input, menuType) {
    this.hidePopup();
    const menuMap = {
      employee: this.dom.popupMenuEmployee,
      parttime: this.dom.popupMenuParttime,
      endo: this.dom.popupMenuEndo,
      oper: this.dom.popupMenuOper
    };
    const menu = menuMap[menuType];
    if (!menu) return;

    this.activeInput = input;
    this.activePopup = menu;

    menu.style.display = 'block';
    menu.style.visibility = 'hidden';
    menu.style.left = '0px';
    menu.style.top = '0px';
    const rect = input.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();

    let top = rect.bottom + window.scrollY + 4;
    let left = rect.left + window.scrollX;

    if (top + menuRect.height > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - menuRect.height - 4;
    }
    if (left + menuRect.width > window.innerWidth + window.scrollX) {
      left = window.innerWidth + window.scrollX - menuRect.width - 4;
    }
    if (left < window.scrollX) left = window.scrollX + 4;

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.visibility = 'visible';
    menu.classList.add('show');
  }

  hidePopup() {
    if (this.activePopup) {
      this.activePopup.classList.remove('show');
      this.activePopup.style.display = '';
      this.activePopup.style.visibility = '';
      this.activePopup = null;
    }
    this.activeInput = null;
  }

  handlePopupSelection(value) {
    if (!this.activeInput) return;
    const input = this.activeInput;
    const empId = input.dataset.empId ? parseInt(input.dataset.empId) : null;
    const specialType = input.dataset.special || null;
    const day = parseInt(input.dataset.day);

    if (specialType) {
      if (value === '') {
        this.model.setSpecialDay(specialType, day, '');
      } else {
        this.model.setSpecialDay(specialType, day, value);
      }
      this.uiManager.refreshTable();
      return;
    }

    if (empId === null) return;
    const emp = this.model.employees.find(e => e.id === empId);
    if (!emp) return;

    if (value === '') {
      const currentValue = emp.days[day] || '';
      if (emp.category === 'parttime') {
        if (currentValue === '*') {
          if (confirm('Удалить доступность (*) для этого дня?')) {
            this.model.setEmployeeDay(empId, day, '');
          }
        } else if (currentValue !== '') {
          this.model.setEmployeeDay(empId, day, '*');
        } else {
          this.uiManager.showToast('Ячейка уже пуста.');
          return;
        }
      } else {
        this.model.setEmployeeDay(empId, day, '');
      }
      this.uiManager.refreshTable();
      return;
    }

    if (emp.category === 'parttime') {
      const currentValue = emp.days[day] || '';
      if (value !== '*' && !currentValue && value !== '') {
        this.uiManager.showToast('Для совместителя сначала необходимо установить символ "*" (доступность), затем можно выбрать рабочее место.');
        return;
      }
      if (value === 'вых' || value === 'до 17' || value === 'до 16') {
        this.uiManager.showToast('Для совместителей недопустимы "вых", "до 17", "до 16".');
        return;
      }
    } else if (emp.category === 'permanent' && value === '*') {
      this.uiManager.showToast('Для постоянных сотрудников символ "*" не используется.');
      return;
    }

    this.model.setEmployeeDay(empId, day, value);
    this.uiManager.refreshTable();
  }
}