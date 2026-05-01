export const getSearchForm = () => document.getElementById('searchForm');
export const getSearchInput = () => document.getElementById('search');
export const getLineSelect = () => document.getElementById('line');
export const getStationSelect = () => document.getElementById('station');
export const getSelectedExitDiv = () => document.getElementById('selected-exit');
export const getAlertDiv = () => document.getElementById('alert');

export const getSearchValue = () => getSearchInput().value.trim();
export const setSearchValue = value => { getSearchInput().value = value; };

export const getLineSelectValue = () => getLineSelect().value;
export const setLineSelectValue = line => { getLineSelect().value = line; };

export const getStationSelectValue = () => getStationSelect().value;
export const setStationSelectValue = station => { getStationSelect().value = station; };
