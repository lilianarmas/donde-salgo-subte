import { geojsonDataExits } from '../data/bocas-de-subte.js';
import { geojsonDataStations } from '../data/estaciones-de-subte.js';
import {
    getLineButtonsContainer,
    getStationSelect,
    getSelectedExitDiv,
    getAlertDiv,
    getSearchValue,
    getSelectedLineValue,
    setSelectedLineValue,
    getStationSelectValue,
    setStationSelectValue
} from './ui.js';
import { state } from './state.js';

// Obtiene color de linea
export const getColorLine = line => {
    const colores = {
        'A': '#1E88E5', // Azul fuerte
        'B': '#D32F2F', // Rojo oscuro
        'C': '#303F9F', // Azul profundo
        'D': '#388E3C', // Verde fuerte con más azul
        'E': '#8E24AA', // Púrpura más vibrante
        'H': '#FFC107'  // Amarillo anaranjado
    };
    return colores[line] || 'gray';
}

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
const createIcon = (lat, lng, color, popupText, number, escalator, layer, highlight = false) => {
    // Si la salida tiene escalera mecánica, agregar un ícono
    let stairsIcon = escalator === 'True'
        ? '<i class="material-icons stairs-icon">escalator</i>'
        : '';
    let highlightedStyle = highlight ? 'border: 3px solid #fff; box-shadow: 0 0 12px #FFD700; transform: scale(1.25);' : '';

    // Crear un icono con el número dentro de un círculo
    let exitIcon = L.divIcon({
        className: 'icon-exit',
        html: `<div class='exit' style='background-color:${color}; ${highlightedStyle}'><b>${number}${stairsIcon}</b></div>`,
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

    if (!line || !station) return;

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
        let escalera_m = feature.properties.escalera_m === 'True' ? '<br>Escalera mecánica' : '';
        let observacion = feature.properties.observacio ? `<br>${feature.properties.observacio}` : '';
        let popupContent = `<b>Salida ${numeroSalida}</b><br>${calle} ${altura}${destino}${escalera_m}${observacion}`;

        const highlight = highlightedExit === feature;
        const marker = createIcon(lat, lng, lineColor, popupContent, numeroSalida, feature.properties.escalera_m, state.bocasLayer, highlight);

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
}

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

const selectNearbyExitForStation = (point, line, station) => {
    const stationExits = getExitsByLineAndStation(line, station);

    if (!stationExits.length) {
        state.currentHighlightedExit = null;
        updateMap(null, point);
        getSelectedExitDiv().innerHTML = 'No hay salidas cargadas para esta estación';
        return;
    }

    const nearbyExit = searchNearbyBoca(point, stationExits);

    state.currentHighlightedExit = nearbyExit;
    updateMap(nearbyExit, point);
    getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + nearbyExit.properties.numero_de_;
}

export const searchAddress = async address => {
    const point = await geocodeAddress(address);

    if (!point) {
        getAlertDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    showAddressOnMap(point);

    const line = getSelectedLineValue();

    if (line) {
        selectNearbyStationAndExit(point, line);
        getAlertDiv().innerHTML = '';
        return;
    }

    // Si no hay línea elegida, mantener el comportamiento previo: buscar la salida más cercana en toda la red.
    const nearbyBoca = searchNearbyBoca(point, geojsonDataExits.features);

    if (nearbyBoca && nearbyBoca.properties) {
        setSelectedLineValue(nearbyBoca.properties.linea);
        updateStations();

        setStationSelectValue(nearbyBoca.properties.estacion);
        state.currentHighlightedExit = nearbyBoca;
        updateMap(nearbyBoca, point);

        getSelectedExitDiv().innerHTML = 'Salida sugerida: ' + nearbyBoca.properties.numero_de_;
    }

    getAlertDiv().innerHTML = '';
}

const selectByAddressAndLine = async (address, line) => {
    const point = await geocodeAddress(address);

    if (!point) {
        getAlertDiv().innerHTML = 'Dirección no encontrada';
        return;
    }

    if (getSelectedLineValue() !== line) return;

    showAddressOnMap(point);
    selectNearbyStationAndExit(point, line);
    getAlertDiv().innerHTML = '';
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
        getAlertDiv().innerHTML = 'Dirección no encontrada';
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
    getAlertDiv().innerHTML = '';
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

        setSelectedLineValue(lineButton.dataset.line);
        handleLineChange();
    });
    getStationSelect().addEventListener('change', handleStationChange);
}
