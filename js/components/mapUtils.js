// --- components/mapUtils.js ---

export const TILE_LAYER_CONFIG = {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 18
    }
};

/**
 * Inicializa los estilos y asegura la alineación de los controles
 */
export function injectMapStyles() {
    if (document.getElementById('shared-map-styles')) return;

    const style = document.createElement('style');
    style.id = 'shared-map-styles';
    style.innerHTML = `
        /* --- PARCHE DE ALINEACIÓN --- */
        /* Forzamos a los contenedores de Leaflet a alinear sus hijos (Zoom y GPS) al centro */
        .leaflet-top.leaflet-left,
        .leaflet-bottom.leaflet-right,
        .leaflet-top.leaflet-right,
        .leaflet-bottom.leaflet-left {
            display: flex !important;
            flex-direction: column;
            align-items: center; /* Centra los botones aunque tengan anchos distintos */
            gap: 10px;           /* Espacio uniforme entre el bloque de Zoom y el GPS */
        }

        /* Quitamos los márgenes por defecto de Leaflet para que el Flexbox controle el espacio */
        .leaflet-control {
            margin: 0 !important;
        }

        /* --- TUS ESTILOS EXISTENTES (SIN CAMBIOS) --- */
        .leaflet-control-locate {
            background: #262a26 !important; 
            border: 1.5px solid rgba(255,255,255,0.2) !important;
            border-radius: 10px !important; 
            width: 38px !important;
            height: 38px !important;
            display: flex !important;
            align-items: center;
            justify-content: center;
            color: white !important;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            text-decoration: none !important;
        }
        
        .leaflet-control-locate:hover {
            background: #313631 !important;
            transform: scale(1.05);
            border-color: rgba(255,255,255,0.4) !important;
        }

        .leaflet-control-locate.active {
            background: #4CAF50 !important;
            border-color: #fff !important;
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.5) !important;
        }

        .leaflet-control-locate.loading { animation: pulse-geo 1s infinite; }
        @keyframes pulse-geo { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

        .leaflet-popup-content-wrapper { background: #1a1e1a !important; color: #fff; border-radius: 12px; }
        .leaflet-popup-tip { background: #1a1e1a !important; }
    `;
    document.head.appendChild(style);
}

export const LocationControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function (map) {
        // Creamos un contenedor limpio para el control
        const container = L.DomUtil.create('div', 'leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-locate', container);
        button.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px;">my_location</span>';
        button.title = "La meva ubicació";

        L.DomEvent.disableClickPropagation(button);

        button.onclick = function (e) {
            e.preventDefault();
            if (button.classList.contains('active') || button.classList.contains('loading')) {
                if (window.userMarker) { map.removeLayer(window.userMarker); window.userMarker = null; }
                map.off('locationfound').off('locationerror');
                button.classList.remove('active', 'loading');
                return;
            }
            button.classList.add('loading');
            map.locate({ setView: true, maxZoom: 9, enableHighAccuracy: true });
            map.once('locationfound', (ev) => {
                button.classList.remove('loading'); button.classList.add('active');
                if (window.userMarker) map.removeLayer(window.userMarker);
                window.userMarker = L.circleMarker(ev.latlng, { radius: 7, fillColor: '#3b82f6', color: '#fff', weight: 2, fillOpacity: 1 }).addTo(map);
            });
            map.once('locationerror', () => { button.classList.remove('loading', 'active'); });
        };
        return container;
    }
});

export function createPlantIcon(size = 32) {
    const iconInnerSize = size === 32 ? 18 : 14;
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="bg-primary flex items-center justify-center text-white border-2 border-white/90 shadow-md transition-transform duration-300 hover:scale-125 cursor-pointer"
                 style="width: ${size}px; height: ${size}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg);">
                <span class="material-symbols-outlined drop-shadow-md" style="font-size: ${iconInnerSize}px; transform: rotate(45deg);">eco</span>
            </div>
        `,
        iconSize: [size, size + 6],
        iconAnchor: [size / 2, size + 6],
        popupAnchor: [0, -(size + 8)]
    });
}