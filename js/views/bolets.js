// --- views/bolets.js ---
// Mòdul dedicat a la càrrega i renderització dels bolets al mapa

const BOLETS_URL = 'https://www.boletsdemallorca.online/bolets.json';

let boletsData = null; // Cache de les dades de bolets

/**
 * Crea un icono de marcador amb forma de seta (🍄)
 */
function createMushroomIcon(size = 28) {
    const emojiSize = size === 28 ? 14 : 12;
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="width: ${size}px; height: ${size}px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #7c2d12; border: 2px solid rgba(255,255,255,0.95); box-shadow: 0 2px 10px rgba(0,0,0,0.6);"
                 class="flex items-center justify-center transition-transform duration-300 hover:scale-125 cursor-pointer">
                <span style="font-size: ${emojiSize}px; transform: rotate(45deg); line-height: 1;">🍄</span>
            </div>
        `,
        iconSize: [size, size + 6],
        iconAnchor: [size / 2, size + 6],
        popupAnchor: [0, -(size + 8)]
    });
}

/**
 * Genera el HTML del popup d'un bolet
 */
function buildBoletPopup(bolet, geo) {
    const nomComu = Array.isArray(bolet.alternateName)
        ? bolet.alternateName[0]
        : (bolet.alternateName || bolet.name);

    const locationName = bolet.contentLocation?.name || 'Desconegut';

    // CORRECCIÓ CONSISTÈNCIA: Unificades les icones a la font nativa 'material-icons'
    return `
    <div class="rounded-xl overflow-hidden" style="min-width: 200px;">
        <div class="p-4 bg-background-dark/95">
            <div class="flex items-center gap-2 mb-2">
                <span style="font-size: 18px; line-height: 1;">🍄</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest" style="background: rgba(217,119,6,0.15); color: #fbbf24; border: 1px solid rgba(217,119,6,0.3);">Bolet</span>
            </div>
            <h3 class="text-base font-bold text-white leading-tight mb-0.5">${nomComu}</h3>
            <p class="text-xs text-slate-400 italic mb-3">${bolet.name}</p>
            
            <div class="flex flex-col gap-1 mb-4">
                <div class="flex items-center gap-1.5 text-white">
                    <span class="material-icons text-[16px]" style="color: #d97706;">location_on</span>
                    <span class="font-semibold text-sm text-slate-200">${locationName}</span>
                </div>
                <div class="pl-6 text-[11px] text-slate-400 font-mono tracking-wide">
                    ${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}
                </div>
            </div>

            <a href="https://www.boletsdemallorca.online" target="_blank" rel="noopener noreferrer"
               class="w-full flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-lg transition-all shadow-lg no-underline"
               style="background: #d97706; color: white;">
                <span class="material-icons text-[16px]">open_in_new</span>
                Veure a Bolets de Mallorca
            </a>
        </div>
    </div>
`;
}

/**
 * Fa fetch de les dades de bolets des de boletsdemallorca.online i les renderitza al mapa
 */
export async function loadAndRenderBolets(markerGroup, currentPlantCount) {
    if (!markerGroup) return;

    // Comprovar si s'han de mostrar els bolets segons el toggle del sidebar
    const toggleEl = document.getElementById('toggle-bolets-checkbox');
    if (toggleEl && !toggleEl.checked) {
        const countEl = document.getElementById('map-marker-count');
        if (countEl) countEl.textContent = currentPlantCount;
        return;
    }

    try {
        // Cache: només feim fetch directe una vegada a la xarxa
        if (!boletsData) {
            console.log("⏳ Sol·licitant dades de bolets de forma directa i asíncrona...");

            const response = await fetch(BOLETS_URL);
            if (!response.ok) throw new Error(`HTTP error fúngic! Status: ${response.status}`);

            const json = await response.json();

            // Estructura nativa de Schema.org: @graph > ItemList > itemListElement
            const itemList = json['@graph']?.find(g => g['@type'] === 'ItemList');
            boletsData = itemList?.itemListElement || [];
        }

        let boletCount = 0;

        boletsData.forEach(entry => {
            const bolet = entry.item || entry;
            const geo = bolet.contentLocation?.geo;

            if (!geo || !geo.latitude || !geo.longitude) return;

            boletCount++;
            const mushroomIcon = createMushroomIcon(28);
            const popupContent = buildBoletPopup(bolet, geo);

            // Asseguram que les coordenades es passin com a números flotants nets
            const marker = L.marker([parseFloat(geo.latitude), parseFloat(geo.longitude)], { icon: mushroomIcon })
                .addTo(markerGroup)
                .bindPopup(popupContent, { className: 'custom-popup-container', minWidth: 200 });

            marker.on('mouseover', function () { this.openPopup(); });
        });

        // Actualitzar marcador global del comptador de la vista mapa
        const countEl = document.getElementById('map-marker-count');
        if (countEl) countEl.textContent = currentPlantCount + boletCount;

        console.log(`🍄 Bolets carregats de forma directa: ${boletCount} marcadors afegits.`);
    } catch (error) {
        console.warn('No s\'han pogut carregar els bolets de la font externa:', error);

        // Control de recuperació: si la font externa cau, mantenim el comptador de plantes locals intacte
        const countEl = document.getElementById('map-marker-count');
        if (countEl) countEl.textContent = currentPlantCount;
    }
}