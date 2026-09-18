// DragDropHandler.js
export class DragDropHandler {
  constructor(container, exportManager) {
    this.container = container;
    this.exportManager = exportManager;
    this.bindEvents();
  }

  bindEvents() {
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.container.classList.add('drag-over');
    });
    this.container.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.container.classList.add('drag-over');
    });
    this.container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.container.contains(e.relatedTarget)) {
        this.container.classList.remove('drag-over');
      }
    });
    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.container.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length === 0) {
        alert('Файл не найден.');
        return;
      }
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.json')) {
        alert('Пожалуйста, перетащите JSON-файл.');
        return;
      }
      this.exportManager.handleLoadFile(file);
    });
  }
}