import { geojsonDataExits } from '../data/bocas-de-subte.js';
import { geojsonDataStations } from '../data/estaciones-de-subte.js';
import { geojsonDataRed } from '../data/red-subte.js';
import {
    getLineButtonsContainer,
    getStationSelect,
    getSelectedExitDiv,
    getExitList,
    getSearchValue,
    getSelectedLineValue,
    isLineManuallySelected,
    setSelectedLineValue,
    getStationSelectValue,
    setStationSelectValue,
    getEscalatorFilterInput,
    getElevatorFilterInput,
    getAccessibilityFilters,
    setAccessibilityFilters
} from './ui.js';
import { state } from './state.js';

// Obtiene color de linea
export const getColorLine = line => {
    const colores = {
        'A': '#1E88E5',
        'B': '#D32F2F',
        'C': '#303F9F',
        'D': '#388E3C',
        'E': '#8E24AA',
        'H': '#FFC107'
    };
    return colores[line] || 'gray';
}

const lineNameMap = {
    'Linea A': 'A',
    'Linea B': 'B',
    'Linea C': 'C',
    'Linea D': 'D',
    'Linea E': 'E',
    'Linea H': 'H'
};

const drawnSegmentKeys = new Set();
const markerById = new Map();

const getSegmentKey = coords => {
    return coords.map(c => `${parseFloat(c[0]).toFixed(5)},${parseFloat(c[1]).toFixed(5)}`).join(';');
};

export const drawSubwayLines = () => {
    if (!state.linesLayer) return;

    drawnSegmentKeys.clear();

    geojsonDataRed.features.forEach(feature => {
        const letter = lineNameMap[feature.properties.nombre];
        if (!letter) return;

        const coords = feature.geometry.coordinates;
        const key = getSegmentKey(coords);
        if (drawnSegmentKeys.has(key)) return;
        drawnSegmentKeys.add(key);

        const latLngs = coords.map(c => [c[1], c[0]]);
        const color = getColorLine(letter);

        L.polyline(latLngs, {
            color,
            weight: 4,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
            interactive: false,
            bubblingMouseEvents: false
        }).addTo(state.linesLayer);
    });
};

const updateStations = () => {
    let lineSelected = getSelectedLineValue();
    let stationSelect = getStationSelect();
    stationSelect.innerHTML = '<option value="">Seleccione una estación</option>';
    stationSelect.disabled = !lineSelected;

    if (lineSelected && state.stationsData[lineSelected]) {
        state.stationsData[lineSelected].forEach(station => {
            let option = document.createElement('option');
            option.value = station;
            option.textContent = station;
            stationSelect.appendChild(option);
        });
    }
}

// Función para crear iconos de diferentes colores
const createIcon = (lat, lng, color, popupText, number, accessibility, layer, highlight = false) => {
    let accessibilityIcon = '';

    if (accessibility.escalator === 'True') {
        accessibilityIcon = '<i class="material-icons accessibility-icon">escalator</i>';
    } else
    if (accessibility.elevator === 'True') {
        accessibilityIcon = '<i class="material-icons accessibility-icon">elevator</i>';
    } else
    if (accessibility.ramp === 'True') {
        accessibilityIcon = '<i class="material-icons accessibility-icon">accessible</i>';
    }

    let highlightedStyle = highlight ? 'border: 3px solid #fff; box-shadow: 0 0 12px #FFD700; transform: scale(1.25);' : '';

    // Crear un icono con el número dentro de un círculo
    let exitIcon = L.divIcon({
        className: 'icon-exit',
        html: `<div class='exit' style='background-color:${color}; ${highlightedStyle}'><b>${number}${accessibilityIcon}</b></div>`,
        iconSize: [24, 24], // Tamaño del icono
        iconAnchor: [12, 12] // Centro del icono
    });

    // Crear el marcador con el icono y el popup
    let marker = L.marker([lat, lng], { icon: exitIcon }).bindPopup(popupText);

    // Agregar al layer correspondiente
    layer.addLayer(marker);
    return marker;
}

const updateMap = (highlightedExit = state.currentHighlightedExit, referencePoint = null) => {
    let line = getSelectedLineValue();
    let station = getStationSelectValue();
    state.markerLayer.clearLayers();
    state.bocasLayer.clearLayers();
    markerById.clear();

    if (!line || !station) {
        updateExitList();
        return;
    }

    // Mostrar la estación principal
    let stationSelected = geojsonDataStations.features.find(f =>
        f.properties.LINEA === line && f.properties.ESTACION === station
    );

    if (stationSelected) {
        let [lng, lat] = stationSelected.geometry.coordinates;
        let coords = [lat, lng];
        state.map.setView(coords, 50);
    }

    let lineColor = getColorLine(line);
    const stationExits = getExitsByLineAndStation(line, station);

    // Mostrar las salidas del subte asociadas
    stationExits.forEach(feature => {
        let [lng, lat] = feature.geometry.coordinates;
        let numeroSalida = feature.properties.numero_de_;
        let calle = feature.properties.calle || 'Calle desconocida';
        let altura = feature.properties.altura || '';
        let destino = feature.properties.destino_bo && !feature.properties.destino_bo.includes('Salida') ? `<br>${feature.properties.destino_bo}` : '';

        let accessibility = { escalator: feature.properties.escalera_m, elevator: feature.properties.ascensor, ramp: feature.properties.rampa };
        let accessibilityInfo = '';

        if (accessibility.escalator === 'True') {
            accessibilityInfo += '<br><i class="material-icons accessibility-icon-info">escalator</i> Escalera mecánica';
        }
        if (accessibility.elevator === 'True') {
            accessibilityInfo += '<br><i class="material-icons accessibility-icon-info">elevator</i> Ascensor';
        }
        if (accessibility.ramp === 'True') {
            accessibilityInfo += '<br><i class="material-icons accessibility-icon-info">accessible</i> Rampa';
        }

        let observacion = feature.properties.observacio ? `<br>${feature.properties.observacio}` : '';
        let connections = feature.properties.lineas_de_ ? `<br><i class="material-icons accessibility-icon-info">sync_alt</i> Conexiones: ${feature.properties.lineas_de_}` : ''; 
        let popupContent = `<b>Salida ${numeroSalida}</b><br>${calle} ${altura}${destino}${accessibilityInfo}${observacion}${connections}`;

        const highlight = highlightedExit === feature;
        const marker = createIcon(lat, lng, lineColor, popupContent, numeroSalida, accessibility, state.bocasLayer, highlight);
        markerById.set(feature.properties.id, marker);

        if (highlight) {
            marker.openPopup();
        }
    });

    if (referencePoint && highlightedExit) {
        let [lngSalida, latSalida] = highlightedExit.geometry.coordinates;
        state.map.fitBounds([
            [referencePoint.lat, referencePoint.lon],
            [latSalida, lngSalida]
        ], { padding: [40, 40], maxZoom: 17 });
    }

    updateExitList();
}

const updateExitList = () => {
    const sidebar = getExitList();
    if (!sidebar) return;

    const line = getSelectedLineValue();
    const station = getStationSelectValue();

    if (!line || !station || !state.map) {
        sidebar.innerHTML = '';
        sidebar.classList.remove('has-exits');
        return;
    }

    const stationExits = getExitsByLineAndStation(line, station);
    const filteredExits = filterExitsByAccessibility(stationExits);

    if (!filteredExits.length) {
        sidebar.innerHTML = '';
        sidebar.classList.remove('has-exits');
        return;
    }

    let html = '<div class=\'exit-list-header\'>Salidas disponibles</div>';

    filteredExits.forEach(feature => {
        let numero = feature.properties.numero_de_;
        let calle = feature.properties.calle || '';
        let altura = feature.properties.altura || '';
        let destino = feature.properties.destino_bo || '';
        let observacio = feature.properties.observacio || '';
        let connections = feature.properties.lineas_de_ || '';
        let escalator = feature.properties.escalera_m === 'True';
        let elevator = feature.properties.ascensor === 'True';
        let ramp = feature.properties.rampa === 'True';

        let isHighlighted = feature === state.currentHighlightedExit;

        let distanceText = '';
        if (state.addressMarker && state.map) {
            const addrLatLng = state.addressMarker.getLatLng();
            const [lng, lat] = feature.geometry.coordinates;
            const dist = state.map.distance(addrLatLng, L.latLng(lat, lng));
            distanceText = dist >= 1000
                ? (dist / 1000).toFixed(1) + ' km'
                : Math.round(dist) + ' m';
        }

        let destinoLine = (destino && !destino.includes('Salida'))
            ? `<div class='exit-list-destino'>${destino}</div>`
            : '';

        let platformLine = observacio
            ? `<div class='exit-list-platform'>${observacio}</div>`
            : '';

        let connectionsLine = connections
            ? `<div class='exit-list-connections'><i class='material-icons'>sync_alt</i> ${connections}</div>`
            : '';

        let accHtml = '';
        if (escalator) accHtml += '<i class=\'material-icons\'>escalator</i>';
        if (elevator) accHtml += '<i class=\'material-icons\'>elevator</i>';
        if (ramp) accHtml += '<i class=\'material-icons\'>accessible</i>';
        let accLine = accHtml
            ? `<div class='exit-list-accessibility'>${accHtml}</div>`
            : '';

        html += `
            <div class='exit-list-item${isHighlighted ? ' is-highlighted' : ''}' data-exit-id='${feature.properties.id}'>
                <div class='exit-list-item-header'>
                    <span class='exit-list-number'>Salida ${numero}</span>
                    ${distanceText ? `<span class='exit-list-distance'>${distanceText}</span>` : ''}
                </div>
                <div class='exit-list-address'>${calle} ${altura}</div>
                ${destinoLine}
                ${platformLine}
                ${connectionsLine}
                ${accLine}
            </div>
        `;
    });

    sidebar.innerHTML = html;
    sidebar.classList.add('has-exits');

    Array.from(sidebar.querySelectorAll('.exit-list-item')).forEach(item => {
        item.addEventListener('click', () => {
            const exitId = Number(item.dataset.exitId);
            const feature = filteredExits.find(f => f.properties.id === exitId);
            if (!feature) return;

            const [lng, lat] = feature.geometry.coordinates;
            state.map.setView([lat, lng], 17);

            const marker = markerById.get(exitId);
            if (marker) {
                marker.openPopup();
            }

            state.currentHighlightedExit = feature;
            getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + feature.properties.numero_de_;
            updateExitList();
        });
    });
};

const showAddressOnMap = point => {
    if (state.addressMarker) {
        state.addressMarker.setLatLng([point.lat, point.lon]);
    } else {
       state.addressMarker = L.marker([point.lat, point.lon]).addTo(state.map);
    }

    state.map.setView([point.lat, point.lon], 16);
}

const getExitsByLineAndStation = (line, station) => geojsonDataExits.features.filter(feature =>
    feature.properties.linea === line &&
    feature.properties.estacion === station
);

const getExitsByLine = line => geojsonDataExits.features.filter(feature =>
    feature.properties.linea === line
);

const hasActiveFilters = () => state.filters.escalator || state.filters.elevator;

const matchesAccessibilityFilters = feature => {
    if (state.filters.escalator && feature.properties.escalera_m !== 'True') return false;
    if (state.filters.elevator && feature.properties.ascensor !== 'True') return false;
    return true;
}

const filterExitsByAccessibility = features => features.filter(matchesAccessibilityFilters);

const getNoFilteredExitsMessage = () => {
    if (!hasActiveFilters()) return 'No hay salidas cargadas para esta estación';
    if (state.filters.escalator && state.filters.elevator) {
        return 'No hay salidas con escaleras mecánicas y ascensor para esta selección';
    }
    if (state.filters.escalator) return 'No hay salidas con escaleras mecánicas para esta selección';
    return 'No hay salidas con ascensor para esta selección';
}

const geocodeAddress = async address => {
    const query = address.trim();

    if (!query) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'App/1.0'
            }
        });
        const results = await response.json();

        if (!results.length) return null;

        const result = results[0];
        return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
    } catch (error) {
        console.error('Error geocodificando dirección:', error);
        return null;
    }
}

const searchNearbyBoca = (point, features) => {
    let minDistance = Infinity;
    let nearbyBoca = null;

    features.forEach(feature => {
        const [lng, lat] = feature.geometry.coordinates;
        const distance = state.map.distance([point.lat, point.lon], [lat, lng]);

        if (distance < minDistance) {
            minDistance = distance;
            nearbyBoca = feature;
        }
    });

    return nearbyBoca;
}

const selectNearbyStationAndExit = (point, line) => {
    if (hasActiveFilters()) {
        selectNearbyExitForLine(point, line);
        return;
    }

    const lineStations = geojsonDataStations.features.filter(feature =>
        feature.properties.LINEA === line
    );
    const nearbyStation = searchNearbyBoca(point, lineStations);

    if (!nearbyStation) {
        getSelectedExitDiv().innerHTML = '';
        return;
    }

    setStationSelectValue(nearbyStation.properties.ESTACION);
    selectNearbyExitForStation(point, line, nearbyStation.properties.ESTACION);
}

const selectNearbyExitForLine = (point, line) => {
    const lineExits = getExitsByLine(line);
    const filteredExits = filterExitsByAccessibility(lineExits);

    if (!filteredExits.length) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        getSelectedExitDiv().innerHTML = getNoFilteredExitsMessage();
        return;
    }

    const nearbyExit = searchNearbyBoca(point, filteredExits);

    setStationSelectValue(nearbyExit.properties.estacion);
    state.currentHighlightedExit = nearbyExit;
    updateMap(nearbyExit, point);
    getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + nearbyExit.properties.numero_de_;
}

const selectNearbyExitForStation = (point, line, station) => {
    const stationExits = getExitsByLineAndStation(line, station);
    const filteredExits = filterExitsByAccessibility(stationExits);

    if (!stationExits.length) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        getSelectedExitDiv().innerHTML = 'No hay salidas cargadas para esta estación';
        return;
    }

    if (!filteredExits.length) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        getSelectedExitDiv().innerHTML = getNoFilteredExitsMessage();
        return;
    }

    const nearbyExit = searchNearbyBoca(point, filteredExits);

    state.currentHighlightedExit = nearbyExit;
    updateMap(nearbyExit, point);
    getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + nearbyExit.properties.numero_de_;
}

export const searchAddress = async address => {
    const point = await geocodeAddress(address);

    if (!point) {
        getSelectedExitDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    showAddressOnMap(point);

    const line = getSelectedLineValue();

    if (line && isLineManuallySelected()) {
        selectNearbyStationAndExit(point, line);
        return;
    }

    // Si no hay línea elegida, mantener el comportamiento previo: buscar la salida más cercana en toda la red.
    const filteredExits = filterExitsByAccessibility(geojsonDataExits.features);

    if (!filteredExits.length) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        getSelectedExitDiv().innerHTML = getNoFilteredExitsMessage();
        return;
    }

    const nearbyBoca = searchNearbyBoca(point, filteredExits);

    if (nearbyBoca && nearbyBoca.properties) {
        setSelectedLineValue(nearbyBoca.properties.linea);
        updateStations();

        setStationSelectValue(nearbyBoca.properties.estacion);
        state.currentHighlightedExit = nearbyBoca;
        updateMap(nearbyBoca, point);

        getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + nearbyBoca.properties.numero_de_;
    }
}

const selectByAddressAndLine = async (address, line) => {
    const point = await geocodeAddress(address);

    if (!point) {
        getSelectedExitDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    if (getSelectedLineValue() !== line) return;

    showAddressOnMap(point);
    selectNearbyStationAndExit(point, line);
}

const handleLineChange = async () => {
    updateStations();

    const address = getSearchValue();
    const line = getSelectedLineValue();

    if (!address || !line) {
        state.currentHighlightedExit = null;
        getSelectedExitDiv().innerHTML = '';
        return;
    }

    await selectByAddressAndLine(address, line);
}

const handleStationChange = async () => {
    const address = getSearchValue();
    const line = getSelectedLineValue();
    const station = getStationSelectValue();

    if (!address) {
        state.currentHighlightedExit = null;
        updateMap();
        getSelectedExitDiv().innerHTML = line && station && !getExitsByLineAndStation(line, station).length
            ? 'No hay salidas cargadas para esta estación'
            : '';
        return;
    }

    const point = await geocodeAddress(address);

    if (!point) {
        getSelectedExitDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    if (getSelectedLineValue() !== line || getStationSelectValue() !== station) return;

    showAddressOnMap(point);

    if (!line || !station) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        return;
    }

    selectNearbyExitForStation(point, line, station);
}

const handleFiltersChange = async () => {
    setAccessibilityFilters(getAccessibilityFilters());

    const address = getSearchValue();
    const line = getSelectedLineValue();
    const station = getStationSelectValue();

    if (!address) {
        state.currentHighlightedExit = null;
        updateMap();
        getSelectedExitDiv().innerHTML = '';
        return;
    }

    const point = await geocodeAddress(address);

    if (!point) {
        getSelectedExitDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    showAddressOnMap(point);

    if (line && station && isLineManuallySelected()) {
        selectNearbyExitForStation(point, line, station);
        return;
    }

    if (line && isLineManuallySelected()) {
        selectNearbyStationAndExit(point, line);
        return;
    }

    searchAddress(address);
}

// Procesar datos del GeoJSON de estaciones
export const processData = () => {
    state.stationsData = {};
    geojsonDataStations.features.forEach(feature => {
        let { LINEA, ESTACION } = feature.properties;
        if (!state.stationsData[LINEA]) state.stationsData[LINEA] = new Set();
        state.stationsData[LINEA].add(ESTACION);
    });

    getLineButtonsContainer().addEventListener('click', event => {
        const lineButton = event.target.closest('.line-button');
        if (!lineButton) return;

        const line = lineButton.dataset.line;
        const shouldReturnToAutomatic = isLineManuallySelected() && getSelectedLineValue() === line;

        setSelectedLineValue(shouldReturnToAutomatic ? '' : line, !shouldReturnToAutomatic);
        handleLineChange();
    });
    getStationSelect().addEventListener('change', handleStationChange);
    getEscalatorFilterInput().addEventListener('change', handleFiltersChange);
    getElevatorFilterInput().addEventListener('change', handleFiltersChange);
}
