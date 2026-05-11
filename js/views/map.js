import { renderSidebar } from '../components/sidebar.js';
import { AppState } from '../app.js';
import { applyFilters, getCheckedValues } from './herbarium.js';

let mapInstance = null;
let markerGroup = null;

export function renderMap() {
    const extraContent = `
        <div class="mt-8 pt-4 border-t border-white/10">
             <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Mapa de Distribució</h2>
             <p class="text-xs text-slate-400 px-1">Navega pel mapa interactiu per descobrir on es troben les diferents espècies vegetals de les Illes Balears.</p>
        </div>
    `;

    // Retornem el HTML amb el contenidor pel mapa Leaflet
    return `
        <div id="map-view" class="view-container h-[calc(100vh-65px)] relative flex w-full">
            ${renderSidebar(extraContent)}
            
            <main class="flex-1 relative bg-forest-neutral-900 overflow-hidden">
                <div id="global-map" class="absolute inset-0 w-full h-full z-0 bg-[#0b0e0b]"></div>
                
                <!-- Overlay de títol per al mapa -->
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

// Funció que es cridarà per inicialitzar Leaflet
export function initMap(plants) {
    const mapEl = document.getElementById('global-map');
    if (!mapEl || typeof L === 'undefined') return;

    // Afegim estils per sobreescriure el popup blanc de Leaflet i fer-lo dark mode
    if (!document.getElementById('custom-leaflet-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-leaflet-styles';
        style.innerHTML = `
            .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                background: var(--surface-color, #1a1e1a) !important;
                border: 1px solid rgba(255,255,255,0.1);
                color: #fff;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
                padding: 0;
            }
            .leaflet-popup-content {
                margin: 0 !important;
                width: 240px !important;
            }
            .leaflet-popup-close-button {
                color: #fff !important;
                z-index: 10;
            }
        `;
        document.head.appendChild(style);
    }

    // Inicialitzar mapa només si el div DOM és nou
    if (!mapEl._leaflet_id) {
        if (mapInstance) {
            mapInstance.remove();
        }

        // Coordenades centrals de les Illes Balears
        mapInstance = L.map('global-map', {
            zoomControl: false
        }).setView([39.6105, 2.9463], 8);

        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

        // Tile layer d'alta definició (Satèl·lit - Esri World Imagery)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 18
        }).addTo(mapInstance);

        markerGroup = L.layerGroup().addTo(mapInstance);

        // Forçar el recàlcul de la mida perquè no es quedi el mapa gris
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 200);
    } else {
        // Si el mapa ja existeix, també invalidem la mida per si s'ha mogut el layout
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 100);
    }

    // Netejar només els marcadors, conservant la posició de zoom
    markerGroup.clearLayers();

    let markerCount = 0;

    // Obtenim les illes seleccionades actualment al sidebar
    const checkedIlles = getCheckedValues('illa');

    plants.forEach(p => {
        const item = p.item || p;
        const coordsProp = item.additionalProperty?.find(prop => prop.name === 'Coordenades');
        // Utilitzem sempre la icona d'una fulla ('eco') per a totes les plantes sense distingir
        const iconName = 'eco';

        if (coordsProp && Array.isArray(coordsProp.value)) {
            coordsProp.value.forEach(coord => {

                // Si hi ha illes filtrades, comprovem que aquesta coordenada específica pertanyi a una d'elles
                if (checkedIlles.length > 0) {
                    const coordEsDaquestaIlla = checkedIlles.some(illa => coord.label.toLowerCase().includes(illa.toLowerCase()));
                    if (!coordEsDaquestaIlla) return; // Si no, saltem aquest marcador
                }

                markerCount++;

                // Generem la icona dinàmica amb una sola peça usant matemàtiques CSS (border-radius: 50% 50% 50% 0)
                const plantIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `
                        <div class="w-8 h-8 bg-primary flex items-center justify-center text-white border-2 border-white/90 shadow-md transition-transform duration-300 hover:scale-125 cursor-pointer"
                             style="border-radius: 50% 50% 50% 0; transform: rotate(-45deg);">
                            <span class="material-symbols-outlined text-[18px] drop-shadow-md" style="transform: rotate(45deg);">${iconName}</span>
                        </div>
                    `,
                    iconSize: [32, 38],
                    iconAnchor: [16, 38],
                    popupAnchor: [0, -40]
                });

                // Popup amb el disseny exacte d'Stitch (dark theme, variables de color primary)
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
                            
                            <button onclick="window.navigateSPA('plant-detail', '${item['@id']}')" class="w-full flex items-center justify-center gap-2 bg-primary text-white text-xs font-bold py-2.5 rounded-lg hover:bg-primary-light hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(var(--primary-rgb),0.5)] active:scale-95 transition-all duration-300">
                                <span class="material-symbols-outlined text-[16px]">visibility</span>
                                Veure Fitxa
                            </button>
                        </div>
                    </div>
                `;

                const marker = L.marker([coord.lat, coord.lng], { icon: plantIcon })
                    .addTo(markerGroup)
                    .bindPopup(popupContent, {
                        className: 'custom-popup-container',
                        minWidth: 240
                    });

                // Mostrar la targeta automàticament en posar el ratolí a sobre del marcador
                marker.on('mouseover', function (e) {
                    this.openPopup();
                });
            });
        }
    });

    const countEl = document.getElementById('map-marker-count');
    if (countEl) countEl.textContent = markerCount;
}

export function initMapFilterListeners() {
    // Escoltador per les caselles de selecció del sidebar
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            const filtered = applyFilters(window.AppState.plants);
            initMap(filtered); // Re-renderitza només els marcadors
        });
    });

    // Escoltador per l'slider d'altitud
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
