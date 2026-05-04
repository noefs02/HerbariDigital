export function renderMap() {
    // Esqueleto mínimo para la vista Mapa
    return `
        <div id="map-view" class="view-container h-full relative">
            <aside id="map-sidebar" class="absolute z-10">
                <!-- Filtros del mapa -->
            </aside>
            <div id="map-container" class="w-full h-full">
                <!-- Leaflet map -->
            </div>
        </div>
    `;
}

export function initMap(plants) {
    // Lógica vacía por ahora
}