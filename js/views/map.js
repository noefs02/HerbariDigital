// --- views/map.js ---
import { renderSidebar, initSidebarEvents } from '../components/sidebar.js';
import { AppState } from '../app.js';
import { applyFilters, getCheckedValues, renderPlantTags } from './herbarium.js';

// Importamos las utilidades centralizadas: diseño consistente en toda la app
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, LayerSwitcherControl, injectMapStyles } from '../components/mapUtils.js';
import { loadAndRenderBolets } from './bolets.js';

let mapInstance = null;
let markerGroup = null;
let boletsCargadosOnce = false; // RENDIMIENTO: Evita llamadas fetch duplicadas al filtrar

export function renderMap() {
    const extraContent = `
        <div class="mt-4 pt-4 border-t border-white/10">
             <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Capa de Micologia</h2>
             <div class="flex items-center justify-between p-2 rounded-lg bg-surface border border-white/5 mt-2">
                 <div class="flex items-center gap-2">
                     <span class="text-lg">🍄</span>
                     <label for="toggle-bolets-checkbox" class="text-sm font-semibold text-slate-200 cursor-pointer">Mostrar Bolets</label>
                 </div>
                 <div class="relative inline-flex items-center">
                     <input id="toggle-bolets-checkbox" type="checkbox" checked class="sr-only peer" aria-label="Mostrar o ocultar la capa de bolets al mapa">
                     <div onclick="document.getElementById('toggle-bolets-checkbox').click();" class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600 peer-checked:after:bg-white peer-checked:after:border-white cursor-pointer"></div>
                 </div>
             </div>
        </div>
    `;

    return `
        <div id="map-view" class="view-container flex flex-1 relative w-full items-stretch">
            ${renderSidebar(extraContent)}
            
            <main class="flex-1 relative bg-forest-neutral-900 overflow-hidden h-[calc(100vh-121px)]">
                <div id="global-map" class="absolute inset-0 w-full h-full z-0 bg-[#0b0e0b]"></div>
                
                <div class="absolute top-6 left-6 right-6 lg:right-auto z-10 pointer-events-none flex flex-col items-start gap-2">
                    <div class="bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl pointer-events-auto w-full max-w-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h2 class="text-xl font-black text-white flex items-center gap-2">
                                    <span class="material-icons text-primary">public</span>
                                    Mapa de Biodiversitat
                                </h2>
                                <p class="text-sm text-slate-400 mt-1"><span id="map-marker-count">0</span> localitzacions cartografiades</p>
                            </div>
                            <button class="open-sidebar-btn lg:hidden p-2 bg-surface border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors shadow-lg pointer-events-auto flex-shrink-0">
                                <span class="material-icons text-primary-light text-xl">filter_list</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export function initMap(plants) {
    const mapEl = document.getElementById('global-map');
    if (!mapEl || typeof L === 'undefined') return;

    // 1. Inyectamos estilos base desde las utilidades centralizadas
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
                flex-direction: column; 
                gap: 10px;              
                align-items: center;    
            }
            .custom-popup-container .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        `;
        document.head.appendChild(style);
    }

    // 3. Inicialización de la instancia del mapa (Patrón Singleton)
    let esPrimeraCarga = false;
    if (!mapEl._leaflet_id) {
        esPrimeraCarga = true;
        boletsCargadosOnce = false; // Reset de la caché de red al reconstruir
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }

        mapInstance = L.map('global-map', {
            zoomControl: false,
            // Habilitamos arrastre con un solo dedo en móviles ya que esta vista es a pantalla completa sin scroll
            dragging: true,
            tap: true
        }).setView([39.6105, 2.9463], 8);

        const layerSwitcher = new LayerSwitcherControl({ position: 'bottomright' });
        mapInstance.addControl(layerSwitcher);
        mapInstance.addControl(new LocationControl({ position: 'bottomright' }));
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        const initialTileLayer = L.tileLayer(TILE_LAYER_CONFIG.url, TILE_LAYER_CONFIG.options).addTo(mapInstance);
        layerSwitcher.setInitialLayer(initialTileLayer);

        markerGroup = L.layerGroup().addTo(mapInstance);
        setTimeout(() => mapInstance.invalidateSize(), 300);
    } else {
        setTimeout(() => mapInstance.invalidateSize(), 100);
    }

    // 4. Lógica de Marcadores Locales (Plantas) y Filtrado Semántico
    markerGroup.clearLayers();
    let markerCount = 0;
    const checkedIlles = getCheckedValues('illa');

    plants.forEach(p => {
        const item = p.item || p;
        const coordsProp = item.additionalProperty?.find(prop => prop.name === 'Coordenades');

        if (coordsProp && Array.isArray(coordsProp.value)) {
            coordsProp.value.forEach(coord => {
                if (checkedIlles.length > 0) {
                    const coordEsDaquestaIlla = checkedIlles.some(illa =>
                        coord.name && coord.name.toLowerCase().includes(illa.toLowerCase())
                    );
                    if (!coordEsDaquestaIlla) return;
                }

                markerCount++;
                const plantIcon = createPlantIcon(32);
                const originalUrl = item.image && item.image[0] ? item.image[0].contentUrl : '';
                const popupImageUrl = originalUrl ? originalUrl.replace('_2000.webp', '_400.webp') : 'img/fallback.webp';

                // CORRECCIÓN OPTIMIZACIÓN: Iconos de botones pasados a 'material-icons' nativos
                const popupContent = `
    <div class="rounded-xl overflow-hidden group">
        <div class="relative h-32 overflow-hidden bg-black">
            <img src="${popupImageUrl}" alt="${item.alternateName || item.name}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy">
            <div class="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[90%] pointer-events-none">
                ${renderPlantTags(item)}
            </div>
        </div>
        <div class="p-4 bg-background-dark/95">
            <h3 class="text-base font-bold text-white leading-tight mb-0.5">${item.alternateName || item.name}</h3>
            <p class="text-xs text-slate-400 italic mb-4">${item.name}</p>
            
            <div class="flex flex-col gap-1 mb-5">
                <div class="flex items-center gap-1.5 text-white">
                    <span class="material-icons text-primary text-[16px]">location_on</span>
                    <span class="font-black text-sm tracking-tight">${coord.name}</span>
                </div>
                <div class="pl-6 text-[12px] text-slate-100 font-mono font-bold tracking-wide">
                    Lat: ${coord.latitude.toFixed(4)} <span class="text-primary/50">/</span> Lng: ${coord.longitude.toFixed(4)}
                </div>
            </div>

            <button onclick="window.navigateSPA('plant-detail', '${item['@id']}')" class="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold py-2.5 rounded-lg hover:bg-primary-dark transition-colors shadow-lg">
                <span class="material-icons text-[16px]">visibility</span>
                Veure Fitxa
            </button>
        </div>
    </div>
`;
                const marker = L.marker([coord.latitude, coord.longitude], { icon: plantIcon })
                    .addTo(markerGroup)
                    .bindPopup(popupContent, { className: 'custom-popup-container', minWidth: 240 });

                marker.on('mouseover', function () { this.openPopup(); });
            });
        }
    });

    // Actualización inicial del contador de posiciones locales
    const countEl = document.getElementById('map-marker-count');
    if (countEl) countEl.textContent = markerCount;

    // 5. Cargar y renderizar marcadores de Bolets de forma eficiente
    // RENDIMIENTO: Solo se invoca si es la carga inicial o si los datos externos no han sido inyectados todavía
    if (esPrimeraCarga || !boletsCargadosOnce) {
        loadAndRenderBolets(markerGroup, markerCount);
        boletsCargadosOnce = true;
    } else {
        // Si ya fueron cacheados por Leaflet, forzamos la renderización respetando el conteo de plantas actual
        const toggleEl = document.getElementById('toggle-bolets-checkbox');
        if (!toggleEl || toggleEl.checked) {
            loadAndRenderBolets(markerGroup, markerCount);
        }
    }
}

// 6. Listeners de los filtros (Sidebar) con control de duplicidad
export function initMapFilterListeners() {
    initSidebarEvents();

    // Checkboxes de islas y otros
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const filtered = applyFilters(window.AppState.plants);
            initMap(filtered);
        });
    });

    const boletsToggle = document.getElementById('toggle-bolets-checkbox');
    if (boletsToggle) {
        boletsToggle.addEventListener('change', () => {
            // Forzamos un refresco limpio del mapa aplicando el estado de filtros actual
            const filtered = applyFilters(window.AppState.plants);
            initMap(filtered);
        });
    }
}