// --- views/map.js ---
import { renderSidebar } from '../components/sidebar.js';
import { AppState } from '../app.js';
import { applyFilters, getCheckedValues } from './herbarium.js';

// Importamos las utilidades centralizadas: diseño consistente en toda la app
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, injectMapStyles } from '../components/mapUtils.js';

let mapInstance = null;
let markerGroup = null;

export function renderMap() {
    const extraContent = `
        <div class="mt-8 pt-4 border-t border-white/10">
             <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Mapa de Distribució</h2>
             <p class="text-xs text-slate-400 px-1">Navega pel mapa interactiu per descubrir on es troben les diferents espècies vegetals de les Illes Balears.</p>
        </div>
    `;

    return `
        <div id="map-view" class="view-container h-[calc(100vh-115px)] relative flex w-full">
            ${renderSidebar(extraContent)}
            
            <main class="flex-1 relative bg-forest-neutral-900 overflow-hidden">
                <div id="global-map" class="absolute inset-0 w-full h-full z-0 bg-[#0b0e0b]"></div>
                
                <div class="absolute top-6 left-6 z-10 pointer-events-none">
                    <div class="bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-auto">
                        <h2 class="text-xl font-black text-white flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">public</span>
                            Mapa de Biodiversitat
                        </h2>
                        <p class="text-sm text-slate-400 mt-1"><span id="map-marker-count">0</span> localitzacions cartografiades</p>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export function initMap(plants) {
    const mapEl = document.getElementById('global-map');
    if (!mapEl || typeof L === 'undefined') return;

    // 1. Inyectamos estilos base (Popups, Botón premium) desde mapUtils
    injectMapStyles();

    // 2. Inyectamos estilos de posicionamiento específicos para el mapa global
    if (!document.getElementById('map-position-styles')) {
        const style = document.createElement('style');
        style.id = 'map-position-styles';
        style.innerHTML = `
            .leaflet-bottom.leaflet-right { 
                bottom: 25px !important; 
                right: 15px !important; 
                display: flex !important;
                flex-direction: column; /* Apilado vertical */
                gap: 10px;              /* Espacio entre GPS y Zoom */
                align-items: center;    /* Centrado perfecto uno sobre otro */
            }
            .custom-popup-container .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        `;
        document.head.appendChild(style);
    }

    // 3. Inicialización de la instancia (Singleton)
    if (!mapEl._leaflet_id) {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('global-map', { zoomControl: false }).setView([39.6105, 2.9463], 8);

        // --- ORDEN DE CONTROLES ---
        // Al usar flex-direction: column, el primero añadido aparece arriba
        mapInstance.addControl(new LocationControl({ position: 'bottomright' }));
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        L.tileLayer(TILE_LAYER_CONFIG.url, TILE_LAYER_CONFIG.options).addTo(mapInstance);
        markerGroup = L.layerGroup().addTo(mapInstance);

        setTimeout(() => mapInstance.invalidateSize(), 300);
    } else {
        setTimeout(() => mapInstance.invalidateSize(), 100);
    }

    // 4. Lógica de Marcadores y Filtrado
    markerGroup.clearLayers();
    let markerCount = 0;
    const checkedIlles = getCheckedValues('illa');

    plants.forEach(p => {
        const item = p.item || p;
        const coordsProp = item.additionalProperty?.find(prop => prop.name === 'Coordenades');

        if (coordsProp && Array.isArray(coordsProp.value)) {
            coordsProp.value.forEach(coord => {
                // Filtro de Islas
                if (checkedIlles.length > 0) {
                    const coordEsDaquestaIlla = checkedIlles.some(illa =>
                        coord.label.toLowerCase().includes(illa.toLowerCase())
                    );
                    if (!coordEsDaquestaIlla) return;
                }

                markerCount++;
                const plantIcon = createPlantIcon(32);

                const popupContent = `
                    <div class="rounded-xl overflow-hidden group">
                        <div class="relative h-32 overflow-hidden bg-black">
                            <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                            <div class="absolute top-2 left-2 flex gap-1">
                                ${item.additionalProperty?.find(prop => prop.name === 'Etiquetes')?.value.map(tag =>
                    `<span class="px-2 py-0.5 rounded-full bg-surface/80 backdrop-blur text-white text-[8px] font-black uppercase tracking-widest border border-white/20">${tag.text}</span>`
                ).join('') || ''}
                            </div>
                        </div>
                        <div class="p-4 bg-background-dark/95">
                            <h3 class="text-base font-bold text-white leading-tight mb-0.5">${item.alternateName || item.name}</h3>
                            <p class="text-xs text-slate-400 italic mb-3">${item.name}</p>
                            <div class="flex items-center gap-1.5 mb-4 text-xs text-slate-300">
                                <span class="material-symbols-outlined text-primary text-[14px]">location_on</span>
                                <span class="truncate">${coord.label}</span>
                            </div>
                            <button onclick="window.navigateSPA('plant-detail', '${item['@id']}')" class="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold py-2.5 rounded-lg hover:bg-primary-light transition-all">
                                <span class="material-symbols-outlined text-[16px]">visibility</span>
                                Veure Fitxa
                            </button>
                        </div>
                    </div>
                `;

                const marker = L.marker([coord.lat, coord.lng], { icon: plantIcon })
                    .addTo(markerGroup)
                    .bindPopup(popupContent, { className: 'custom-popup-container', minWidth: 240 });

                marker.on('mouseover', function () { this.openPopup(); });
            });
        }
    });

    const countEl = document.getElementById('map-marker-count');
    if (countEl) countEl.textContent = markerCount;
}

// 5. Listeners de los filtros (Sidebar)
export function initMapFilterListeners() {
    // Checkboxes de islas y otros
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const filtered = applyFilters(window.AppState.plants);
            initMap(filtered);
        });
    });

    // Slider de Altitud
    const altitudeInput = document.getElementById('filter-altitud-range');
    if (altitudeInput) {
        altitudeInput.addEventListener('input', (e) => {
            const label = document.getElementById('filter-altitud-value');
            if (label) label.textContent = `${e.target.value}m`;
            const filtered = applyFilters(window.AppState.plants);
            initMap(filtered);
        });
    }
}