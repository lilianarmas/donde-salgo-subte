import {
    searchAddress,
    getColorLine,
    processData,
    drawSubwayLines
} from './helpers.js';
import {
    getSearchForm,
    getSearchValue,
    getLineButtonsContainer
} from './ui.js';
import { state } from './state.js';

state.map = L.map('map').setView([-34.6037, -58.3816], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(state.map);

state.linesLayer = L.layerGroup().addTo(state.map);
state.markerLayer = L.layerGroup().addTo(state.map);
state.bocasLayer = L.layerGroup().addTo(state.map);

drawSubwayLines();

getSearchForm().addEventListener('submit', function (e) {
    e.preventDefault();
    const address = getSearchValue();
    searchAddress(address);
});

// Cargar líneas en los botones visibles.
const availableLines = ['A', 'B', 'C', 'D', 'E', 'H'];
availableLines.forEach(line => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'line-button';
    button.dataset.line = line;
    button.textContent = line;
    button.setAttribute('aria-pressed', 'false');
    button.style.backgroundColor = getColorLine(line);
    getLineButtonsContainer().appendChild(button);
});

processData();
