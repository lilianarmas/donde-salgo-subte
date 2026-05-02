export const getSearchForm = () => document.getElementById('searchForm');
export const getSearchInput = () => document.getElementById('search');
export const getLineSelect = () => document.getElementById('line');
export const getLineButtonsContainer = () => document.getElementById('lineButtons');
export const getStationSelect = () => document.getElementById('station');
export const getSelectedExitDiv = () => document.getElementById('selected-exit');
export const getAlertDiv = () => document.getElementById('alert');

export const getSearchValue = () => getSearchInput().value.trim();
export const setSearchValue = value => { getSearchInput().value = value; };

export const getLineSelectValue = () => getLineSelect().value;
export const setLineButtonsActive = line => {
    getLineButtonsContainer().querySelectorAll('.line-button').forEach(button => {
        const isActive = button.dataset.line === line;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
};

export const setLineSelectValue = line => {
    getLineSelect().value = line;
    setLineButtonsActive(line);
};

export const getStationSelectValue = () => getStationSelect().value;
export const setStationSelectValue = station => { getStationSelect().value = station; };
