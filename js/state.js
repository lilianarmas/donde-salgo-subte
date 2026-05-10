export const state = {
    map: null,
    stationsData: {},
    selectedLine: '',
    isLineManuallySelected: false,
    filters: {
        escalator: false,
        elevator: false
    },
    addressMarker: null,
    currentHighlightedExit: null,
    markerLayer: null,
    bocasLayer: null,
    linesLayer: null
};
