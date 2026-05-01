import {
    searchAddress,
    getColorLine,
    processData
} from './helpers.js';
import {
    getSearchForm,
    getSearchValue,
    getLineSelect
} from './ui.js';
import { state } from './state.js';

state.map = L.map('map').setView([-34.6037, -58.3816], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(state.map);

state.markerLayer = L.layerGroup().addTo(state.map);
state.bocasLayer = L.layerGroup().addTo(state.map);

getSearchForm().addEventListener('submit', function (e) {
    e.preventDefault();
    const address = getSearchValue();
    searchAddress(address);
});

// Cargar líneas en el primer select
const availableLines = ['A', 'B', 'C', 'D', 'E', 'H'];
availableLines.forEach(line => {
    let option = document.createElement('option');
    option.value = line;
    option.textContent = `Línea ${line}`;
    option.style = `background-color: ${getColorLine(line)}; color: #fff;`;
    getLineSelect().appendChild(option);
});

processData();
