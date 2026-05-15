// --- components/mapUtils.js ---

export const TILE_LAYERS = {
    satellite: {
        label: 'Satèl·lit',
        icon: 'satellite_alt',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        options: { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
    },
    streets: {
        label: 'Mapa',
        icon: 'map',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
    }
};

// Mantenim la compatibilitat amb l'import existent a map.js
export const TILE_LAYER_CONFIG = {
    url: TILE_LAYERS.satellite.url,
    options: TILE_LAYERS.satellite.options
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

        /* --- LAYER SWITCHER --- */
        .layer-switcher-control {
            background: rgba(26, 30, 26, 0.92) !important;
            border: 1.5px solid rgba(255,255,255,0.15) !important;
            border-radius: 10px !important;
            backdrop-filter: blur(8px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
            overflow: hidden;
            display: flex !important;
            flex-direction: column;
            width: 38px;
            transition: all 0.3s ease;
        }
        .layer-switcher-control.expanded {
            width: 160px;
        }
        .layer-switcher-toggle {
            width: 38px;
            height: 38px;
            min-height: 38px;
            background: transparent;
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
            transition: color 0.2s;
        }
        .layer-switcher-toggle:hover { color: var(--primary-light, #3da63d); }
        .layer-switcher-options {
            display: none;
            flex-direction: column;
            gap: 2px;
            padding: 4px 6px 6px 6px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .layer-switcher-control.expanded .layer-switcher-options { display: flex; }
        .layer-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 6px;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s;
            text-align: left;
            width: 100%;
        }
        .layer-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .layer-btn.active { color: var(--primary-light, #3da63d); background: rgba(61,166,61,0.12); }
        .layer-btn .material-symbols-outlined { font-size: 16px; }
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

/**
 * Control per canviar la capa del mapa (Satèl·lit / Mapa de carrers)
 */
export const LayerSwitcherControl = L.Control.extend({
    options: { position: 'bottomright' },
    _currentLayer: null,
    _currentKey: 'satellite',

    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-control layer-switcher-control');
        L.DomEvent.disableClickPropagation(container);

        const toggle = L.DomUtil.create('button', 'layer-switcher-toggle', container);
        toggle.innerHTML = '<span class="material-symbols-outlined" style="font-size:22px;">layers</span>';
        toggle.title = 'Canviar capa del mapa';

        const optionsDiv = L.DomUtil.create('div', 'layer-switcher-options', container);

        // Afegim un botó per cada capa disponible
        Object.entries(TILE_LAYERS).forEach(([key, config]) => {
            const btn = L.DomUtil.create('button', `layer-btn${key === this._currentKey ? ' active' : ''}`, optionsDiv);
            btn.dataset.key = key;
            btn.innerHTML = `<span class="material-symbols-outlined">${config.icon}</span>${config.label}`;

            btn.onclick = (e) => {
                e.stopPropagation();

                if (this._currentLayer) map.removeLayer(this._currentLayer);

                this._currentLayer = L.tileLayer(config.url, config.options).addTo(map);
                this._currentKey = key;

                // Actualitzar botons actius
                optionsDiv.querySelectorAll('.layer-btn').forEach(b => b.classList.toggle('active', b.dataset.key === key));

                container.classList.remove('expanded');
            };
        });

        toggle.onclick = (e) => {
            e.stopPropagation();
            container.classList.toggle('expanded');
        };

        // Tancar si es fa clic fora
        map.getContainer().addEventListener('click', () => container.classList.remove('expanded'));

        return container;
    },

    // Guarda la referència a la capa inicial perquè el control pugui eliminar-la en canviar
    setInitialLayer: function (layer) {
        this._currentLayer = layer;
    }
});