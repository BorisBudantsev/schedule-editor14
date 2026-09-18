// main.js
import { ScheduleController } from './ScheduleController.js';

document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        container: document.getElementById('app'),
        tableHead: document.getElementById('tableHead'),
        tableBody: document.getElementById('tableBody'),
        tableWrapper: document.getElementById('tableWrapper'),
        addEmployeeBtn: document.getElementById('addEmployeeBtn'),
        newGraphBtn: document.getElementById('newGraphBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        loadAnalysisBtn: document.getElementById('loadAnalysisBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        exportHtmlBtn: document.getElementById('exportHtmlBtn'),
        exportExcelBtn: document.getElementById('exportExcelBtn'),
        exportWordBtn: document.getElementById('exportWordBtn'),
        saveGraphBtn: document.getElementById('saveGraphBtn'),
        loadGraphBtn: document.getElementById('loadGraphBtn'),
        loadFileInput: document.getElementById('loadFileInput'),
        empCountSpan: document.getElementById('empCount'),
        monthSelect: document.getElementById('monthSelect'),
        yearInput: document.getElementById('yearInput'),
        applyDateBtn: document.getElementById('applyDateBtn'),
        analysisResult: document.getElementById('analysisResult'),
        emptyState: document.getElementById('emptyState'),
        popupMenuEmployee: document.getElementById('popupMenuEmployee'),
        popupMenuParttime: document.getElementById('popupMenuParttime'),
        popupMenuEndo: document.getElementById('popupMenuEndo'),
        popupMenuOper: document.getElementById('popupMenuOper'),
        toast: document.getElementById('toast'),
        exportScaleSelect: document.getElementById('exportScaleSelect'),

        mainTitle: document.getElementById('mainTitle'),
        mainControls: document.getElementById('mainControls'),
        mainFooter: document.getElementById('mainFooter'),

        // Элементы мастера
        wizardModal: document.getElementById('wizardModal'),
        wizardCloseBtn: document.getElementById('wizardCloseBtn'),
        wizardPrevBtn: document.getElementById('wizardPrevBtn'),
        wizardNextBtn: document.getElementById('wizardNextBtn'),
        wizardFinishBtn: document.getElementById('wizardFinishBtn'),
        wizardAddEmployeeBtn: document.getElementById('wizardAddEmployeeBtn'),
        wizardDeleteEmployeeBtn: document.getElementById('wizardDeleteEmployeeBtn'),
        wizardSelectAll: document.getElementById('wizardSelectAll'),
        wizardEmployeeName: document.getElementById('wizardEmployeeName'),
        wizardEmployeeCategory: document.getElementById('wizardEmployeeCategory'),
        wizardMonthSelect: document.getElementById('wizardMonthSelect'),
        wizardYearInput: document.getElementById('wizardYearInput'),
        wizardEmployeeList: document.getElementById('wizardEmployeeList'),
        wizardMessage: document.getElementById('wizardMessage'),
        wizardStep1: document.getElementById('wizardStep1'),
        wizardStep2: document.getElementById('wizardStep2'),
        wizardTitle: document.getElementById('wizardTitle'),

        // Выпадающие меню
        toolsDropdown: document.getElementById('toolsDropdown'),
        exportDropdown: document.getElementById('exportDropdown'),
    };

    new ScheduleController(dom);
});