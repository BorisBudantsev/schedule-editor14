// constants.js

export const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const DAY_NAMES_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вск'];

export const DEFAULT_NUMBER = '3';

export const ALLOWED_PERMANENT = [
  'З', 'Б', 'Ж', 'К', 'ЭНД1', 'ЭНД2', 'ЭНД3', 'Д', 'вых', 'до 17', 'до 16'
];

export const ALLOWED_PARTTIME = [
  '*', 'З', 'Б', 'Ж', 'К', 'ЭНД1', 'ЭНД2', 'ЭНД3', 'Д'
];

export const ALLOWED_SPECIAL = ['1', '2', '3', '4'];

export const CATEGORY_LABELS = {
  permanent: 'Постоянный',
  parttime: 'Совместитель'
};

export const CATEGORY_BADGE_CLASS = {
  permanent: 'permanent',
  parttime: 'parttime'
};

export const RESERVE_PATTERN = /до\s*\d+/;

export const EXPORT_SCALE_OPTIONS = [
  { value: '6', label: '6px' },
  { value: '7', label: '7px' },
  { value: '8', label: '8px' },
  { value: '9', label: '9px' },
  { value: '10', label: '10px' }
];

export const SPECIAL_TYPES = ['endo', 'oper'];