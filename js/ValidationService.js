import { ALLOWED_PERMANENT, ALLOWED_PARTTIME } from './constants.js';

/**
 * Сервис для валидации значений ячеек.
 */
export class ValidationService {
  /**
   * Проверяет, допустимо ли значение для сотрудника указанной категории.
   * @param {string} value - значение для проверки
   * @param {string} category - 'permanent' или 'parttime'
   * @returns {boolean}
   */
  static isValidForEmployee(value, category) {
    const trimmed = value.trim().toUpperCase();
    if (trimmed === '') return true;
    if (category === 'permanent') {
      return ALLOWED_PERMANENT.includes(trimmed);
    } else {
      return ALLOWED_PARTTIME.includes(trimmed);
    }
  }

  /**
   * Проверяет допустимость значения для специальных строк (Э и О).
   * @param {string} value
   * @returns {boolean}
   */
  static isValidSpecial(value) {
    const trimmed = value.trim();
    if (trimmed === '') return true;
    return ['1', '2', '3', '4'].includes(trimmed);
  }
}