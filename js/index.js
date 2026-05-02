import {
    searchAddress,
    getColorLine,
    processData
} from './helpers.js';
import {
    getSearchForm,
    getSearchValue,
    getLineSelect,
    getLineButtonsContainer,
    setLineButtonsActive
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

// Cargar líneas en el select oculto y en los botones visibles.
const availableLines = ['A', 'B', 'C', 'D', 'E', 'H'];
availableLines.forEach(line => {
    const option = document.createElement('option');
    option.value = line;
    option.textContent = `Línea ${line}`;
    option.style = `background-color: ${getColorLine(line)}; color: #fff;`;
    getLineSelect().appendChild(option);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'line-button';
    button.dataset.line = line;
    button.textContent = line;
    button.setAttribute('aria-pressed', 'false');
    button.style.backgroundColor = getColorLine(line);
    button.addEventListener('click', () => {
        getLineSelect().value = line;
        setLineButtonsActive(line);
        getLineSelect().dispatchEvent(new Event('change'));
    });
    getLineButtonsContainer().appendChild(button);
});

processData();
