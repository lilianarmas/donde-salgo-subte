import { state } from './state.js';

export const getSearchForm = () => document.getElementById('searchForm');
export const getSearchInput = () => document.getElementById('search');
export const getLineButtonsContainer = () => document.getElementById('lineButtons');
export const getStationSelect = () => document.getElementById('station');
export const getSelectedExitDiv = () => document.getElementById('selected-exit');
export const getAlertDiv = () => document.getElementById('alert');
export const getEscalatorFilterInput = () => document.getElementById('filterEscalator');
export const getElevatorFilterInput = () => document.getElementById('filterElevator');

export const getSearchValue = () => getSearchInput().value.trim();
export const setSearchValue = value => { getSearchInput().value = value; };

export const getSelectedLineValue = () => state.selectedLine;
export const setLineButtonsActive = line => {
    getLineButtonsContainer().querySelectorAll('.line-button').forEach(button => {
        const isActive = button.dataset.line === line;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
};

export const setSelectedLineValue = line => {
    state.selectedLine = line;
    setLineButtonsActive(line);
};

export const getStationSelectValue = () => getStationSelect().value;
export const setStationSelectValue = station => { getStationSelect().value = station; };

export const getAccessibilityFilters = () => ({
    escalator: getEscalatorFilterInput().checked,
    elevator: getElevatorFilterInput().checked
});

export const setAccessibilityFilters = filters => {
    state.filters = filters;
};
