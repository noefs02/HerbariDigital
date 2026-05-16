import { AppState } from '../app.js';
import { YouTubeHandler } from '../components/youtube.js'; // IMPORTACIÓN DEL SERVICIO
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, LayerSwitcherControl, injectMapStyles } from '../components/mapUtils.js';

let detailMapInstance = null;
const ytHandler = new YouTubeHandler(); // INSTANCIA DEL GESTOR GLOBAL

export async function initDetailMap(plant) {
    const mapContainer = document.getElementById('detail-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // --- LIMPIEZA ---
    if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
    if (window._detailMapOutsideClick) {
        document.removeEventListener('click', window._detailMapOutsideClick);
        window._detailMapOutsideClick = null;
    }

    // --- ESTILOS CENTRALIZADOS ---
    injectMapStyles();

    const coordsProp = plant.additionalProperty?.find(prop => prop.name === 'Coordenades');
    const coords = coordsProp ? coordsProp.value : [];

    if (coords.length === 0) {
        mapContainer.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-forest-neutral-900 text-slate-500 text-xs italic">No hi ha dades de localització.</div>`;
    } else {
        // --- INICIALIZACIÓN ---
        detailMapInstance = L.map('detail-map', {
            zoomControl: false, // DESACTIVAMOS el nativo para controlarlo nosotros
            scrollWheelZoom: false
        }).setView([coords[0].latitude, coords[0].longitude], 8);

        // --- GESTIÓN DE ENFOQUE Y SCROLL DE RUEDA ---
        // Al hacer clic dentro del mapa, se activa el zoom de la rueda del ratón (sin línea verde)
        detailMapInstance.on('click', () => {
            detailMapInstance.scrollWheelZoom.enable();
        });

        // Al hacer clic fuera del contenedor del mapa, se desactiva el zoom de la rueda
        window._detailMapOutsideClick = (e) => {
            if (mapContainer && !mapContainer.contains(e.target)) {
                if (detailMapInstance) {
                    detailMapInstance.scrollWheelZoom.disable();
                }
            }
        };
        document.addEventListener('click', window._detailMapOutsideClick);

        // --- CONTROLES ALINEADOS (de dalt a baix a topleft) ---
        const layerSwitcher = new LayerSwitcherControl({ position: 'topleft' });
        detailMapInstance.addControl(layerSwitcher);
        L.control.zoom({ position: 'topleft' }).addTo(detailMapInstance);
        detailMapInstance.addControl(new LocationControl({ position: 'topleft' }));

        const initialTileLayer = L.tileLayer(TILE_LAYER_CONFIG.url, TILE_LAYER_CONFIG.options).addTo(detailMapInstance);
        layerSwitcher.setInitialLayer(initialTileLayer);

        // Marcadores con texto de coordenadas resaltado
        coords.forEach(coord => {
            const icon = createPlantIcon(24);
            const detailPopupContent = `
                <div class="flex flex-col gap-1.5 px-1 py-1">
                    <div class="flex items-center gap-1.5 text-white">
                        <span class="material-symbols-outlined text-primary text-[16px]">location_on</span>
                        <span class="font-black text-sm tracking-tight">${coord.name}</span>
                    </div>
                    <div class="pl-6 text-[12px] text-slate-100 font-mono font-bold tracking-wide">
                        Lat: ${coord.latitude.toFixed(4)} <span class="text-primary/50">/</span> Lng: ${coord.longitude.toFixed(4)}
                    </div>
                </div>
            `;

            L.marker([coord.latitude, coord.longitude], { icon: icon })
                .addTo(detailMapInstance)
                .bindPopup(detailPopupContent, {
                    className: 'detail-popup',
                    closeButton: false,
                    offset: [0, -5]
                })
                .on('mouseover', function () { this.openPopup(); })
                .on('mouseout', function () { this.closePopup(); });
        });

        setTimeout(() => detailMapInstance.invalidateSize(), 300);
    }

    // --- INICIALIZACIÓN VIDEO 
    const videoContainer = document.getElementById('youtube-player-api');
    const videoUrl = plant.subjectOf?.embedUrl; // Extraemos la URL

    if (videoContainer && videoUrl) {
        await ytHandler.loadAPI(); // Carga asíncrona de la biblioteca externa
        ytHandler.loadVideo(videoUrl, videoContainer); // Inserción del reproductor funcional
    }
}

/**
 * Lògica de Stitch: Presència a les Illes
 */
function renderIslandPresence(illaString = "") {
    const illes = [
        { key: 'mallorca', nom: 'Mallorca' },
        { key: 'cabrera', nom: 'Cabrera' },
        { key: 'menorca', nom: 'Menorca' },
        { key: 'eivissa', nom: 'Eivissa' },
        { key: 'formentera', nom: 'Formentera' }
    ];
    return illes.map(illa => {
        const present = illaString.toLowerCase().includes(illa.key.toLowerCase())
            || illaString.toLowerCase().includes('totes');

        const bg = present ? 'bg-forest-neutral-900 border-forest-neutral-700' : 'bg-background-dark border-white/10 opacity-40';
        const textCls = present ? 'text-white' : 'text-forest-neutral-500';
        const icon = present
            ? '<span class="material-symbols-outlined text-primary text-xl" style=\'font-variation-settings: "FILL" 1;\'>check_circle</span>'
            : '<span class="material-symbols-outlined text-forest-neutral-600 text-xl">cancel</span>';

        return `
        <div class="flex flex-col items-center justify-center py-3 px-2 rounded-lg ${bg} border transition-colors">
            <span class="text-[9px] font-bold uppercase tracking-wider ${textCls} mb-1.5">${illa.nom}</span>
            ${icon}
        </div>`;
    }).join('');
}

/**
 * Lògica de Stitch: Targeta de Conservació
 */
function renderConservationCard(status = "") {
    let color = 'emerald', label = 'Segura', percent = 20, desc = 'Poblacions estables.';

    if (status.includes('Crític')) {
        color = 'red'; label = 'En Perill Crític'; percent = 95; desc = 'Risc extrem d\'extinció en estat silvestre.';
    } else if (status.includes('Perill')) {
        color = 'red'; label = 'En Perill'; percent = 85; desc = 'Risc elevat d\'extinció en estat silvestre.';
    } else if (status.includes('Vulnerable')) {
        color = 'amber'; label = 'Vulnerable'; percent = 65; desc = 'Vulnerable a l\'extinció si no es prenen mesures.';
    } else if (status.includes('Protegida')) {
        color = 'orange'; label = 'Protegida'; percent = 50; desc = 'Sota regulació especial per evitar el seu declivi.';
    }

    return `
    <div class="bg-${color}-500/10 rounded-xl border border-${color}-500/20 p-6">
        <div class="flex items-center gap-2 text-${color}-400 mb-3">
            <span class="material-symbols-outlined">warning</span>
            <h4 class="font-bold text-lg">Estat de conservació</h4>
        </div>
        <p class="text-sm text-forest-neutral-300 mb-4 italic leading-relaxed">"${desc}"</p>
        <div class="w-full bg-forest-neutral-800 h-2 rounded-full overflow-hidden">
            <div class="bg-${color}-600 h-full" style="width:${percent}%"></div>
        </div>
        <p class="text-[10px] mt-2 text-right uppercase font-bold text-${color}-600">${status || label}</p>
    </div>`;
}

/**
 * Renderitza les targetes de plantes relacionades
 */
function renderRelatedCards(currentId) {
    const others = AppState.plants
        .filter(p => {
            const id = p.item ? p.item['@id'] : p['@id'];
            return id !== currentId;
        })
        .slice(0, 4);

    if (others.length === 0) return '';

    const cards = others.map(entry => {
        const p = entry.item || entry;
        const pid = p['@id'];
        const getProp = (name) => p.additionalProperty?.find(prop => prop.name === name)?.value || '';
        const familia = getProp('Família');
        const status = getProp('Estat de conservació');
        const statusColor = status.includes('Perill') ? 'red' : status.includes('Protegida') ? 'orange' : 'amber';

        return `
        <div onclick="window.navigateSPA('plant-detail', '${pid}')"
            class="group flex flex-col bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] aspect-[4/5]">
            <div class="relative flex-1 overflow-hidden">
                <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="${p.alternateName || p.name}" src="${p.image}" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span class="px-2 py-0.5 rounded-full bg-${statusColor}-500/20 text-${statusColor}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${statusColor}-500/30">${status}</span>
                </div>
            </div>
            <div class="p-5 shrink-0 bg-surface">
                <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-1">${familia}</p>
                <h4 class="text-lg font-bold text-white leading-tight">${p.alternateName || p.name}</h4>
            </div>
        </div>`;
    }).join('');

    return `
    <section class="mt-20 border-t border-white/10 pt-12">
        <div class="mb-8">
            <h2 class="text-3xl font-black text-white mb-2 tracking-tight">Explora més a l'Herbari</h2>
            <p class="text-forest-neutral-500">Espècies amb requeriments o hàbitats similars</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            ${cards}
        </div>
    </section>`;
}

export function renderPlantDetail(plant) {
    if (!plant) return `<div class="p-20 text-center">Planta no trobada</div>`;

    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '—';

    const familia = getProp('Família');
    const status = getProp('Estat de conservació');
    const illa = getProp('Illa');
    const floracio = getProp('FloracióDesc');
    const sol = getProp('Hàbitat') !== '—' ? getProp('Hàbitat') : getProp('Requeriments de sòl');
    const plantId = plant['@id'];

    // GESTIÓN DE MEMORIA 
    ytHandler.cleanupPlayer();

    const heroTagsHTML = `
        <span class="px-3 py-1 bg-surface border border-primary text-slate-100 text-xs font-bold rounded-full uppercase tracking-wider">${familia}</span>
        <span class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">${status}</span>`;

    return `
    <div class="animate-in fade-in duration-500">

        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <nav class="flex items-center gap-2 text-sm font-medium text-slate-500">
                <a class="hover:text-primary cursor-pointer" onclick="window.navigateSPA('herbarium')">Herbari Digital</a>
                <span class="material-symbols-outlined text-xs">chevron_right</span>
                <span class="text-slate-100">${plant.alternateName || plant.name}</span>
            </nav>
            <button onclick="window.navigateSPA('herbarium')" class="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg border border-forest-neutral-700 text-slate-300 hover:bg-forest-neutral-800 transition-colors">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                Tornar a l'Herbari
            </button>
        </div>

        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div class="relative group aspect-[21/9] rounded-2xl overflow-hidden bg-forest-neutral-900 shadow-2xl">
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${plant.image}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div class="absolute inset-y-0 left-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="size-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-primary backdrop-blur-sm transition-colors">
                        <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                </div>
                <div class="absolute inset-y-0 right-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="size-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-primary backdrop-blur-sm transition-colors">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div class="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                    <div>
                        <div class="flex items-center gap-3 mb-2">
                            ${heroTagsHTML}
                        </div>
                        <h2 class="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">${plant.alternateName}</h2>
                    </div>
                    <div class="flex gap-2 pb-2">
                        <div class="size-2 rounded-full bg-white"></div>
                        <div class="size-2 rounded-full bg-white/30"></div>
                        <div class="size-2 rounded-full bg-white/30"></div>
                    </div>
                </div>
            </div>
        </section>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div class="lg:col-span-2 space-y-8">

                    <div class="bg-surface rounded-2xl border border-white/10 p-8 space-y-10 shadow-xl">
                        <section>
                            <h3 class="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <span class="material-symbols-outlined text-primary">info</span>
                                Fitxa tècnica
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Nom científic</p>
                                    <p class="text-lg font-medium italic text-slate-200">${plant.name}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Nom comú</p>
                                    <p class="text-lg font-medium text-slate-200">${plant.alternateName || '—'}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Requeriments de sòl</p>
                                    <p class="text-lg font-medium text-slate-200">${sol}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Floració</p>
                                    <p class="text-lg font-medium text-slate-200">${floracio}</p>
                                </div>
                            </div>
                        </section>
                        <hr class="border-white/10" />
                        <section>
                            <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                                <span class="material-symbols-outlined text-primary">description</span>
                                Descripció
                            </h3>
                            <div class="prose prose-invert max-w-none text-forest-neutral-300 leading-relaxed space-y-4">
                                ${plant.description}
                            </div>
                        </section>
                    </div>

                    <div class="bg-surface border border-white/10 rounded-2xl p-8 flex items-center justify-between shadow-lg">
                        <div class="flex items-center gap-5">
                            <div class="size-14 rounded-full bg-primary flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(48,137,48,0.4)]">
                                <span class="material-symbols-outlined text-white text-3xl">graphic_eq</span>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-slate-100">Ambient de l'hàbitat</h4>
                                <p class="text-sm text-forest-neutral-400">Enregistrat a les Illes Balears</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-6">
                            <button class="size-12 rounded-full border border-forest-neutral-700 flex items-center justify-center hover:bg-primary transition-colors text-slate-100">
                                <span class="material-symbols-outlined text-3xl">play_arrow</span>
                            </button>
                            <div class="hidden sm:block w-48 h-1.5 bg-forest-neutral-800 rounded-full overflow-hidden">
                                <div class="w-1/3 h-full bg-primary"></div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-surface rounded-2xl border border-white/10 p-8 shadow-xl">
                        <h4 class="text-xl font-bold mb-8 flex items-center gap-2 text-white">
                            <span class="material-symbols-outlined text-primary">library_books</span>
                            Recursos addicionals
                        </h4>
                        <div class="flex flex-col gap-10">
                            <div class="space-y-5">
                                <p class="text-xs font-bold text-forest-neutral-500 uppercase tracking-widest">Documental Botànic</p>
                                <div class="relative overflow-hidden rounded-2xl aspect-video bg-black ring-1 ring-white/10 shadow-2xl">
                                    <div id="youtube-player-api" class="w-full h-full">
                                        <div class="flex items-center justify-center h-full text-slate-500 italic text-sm">
                                            Carregant reproductor multimèdia...
                                        </div>
                                    </div>
                                </div>
                                <p class="text-xl font-bold text-slate-100">Documental botànic de l'espècie</p>
                            </div>
                            <div class="space-y-4">
                                <p class="text-xs font-bold text-forest-neutral-500 uppercase tracking-widest">Documentació de referència</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <a class="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-white/10 hover:border-primary transition-all group" href="#">
                                        <div class="flex items-center gap-3">
                                            <span class="material-symbols-outlined text-2xl text-red-500">picture_as_pdf</span>
                                            <div>
                                                <p class="font-bold text-sm">Fitxa de protecció (PDF)</p>
                                                <p class="text-[10px] text-forest-neutral-500">1.8 MB · Generalitat Balear</p>
                                            </div>
                                        </div>
                                        <span class="material-symbols-outlined text-sm text-forest-neutral-500 group-hover:text-primary transition-colors">download</span>
                                    </a>
                                    <a class="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-white/10 hover:border-primary transition-all group" href="#">
                                        <div class="flex items-center gap-3">
                                            <span class="material-symbols-outlined text-2xl text-blue-400">language</span>
                                            <div>
                                                <p class="font-bold text-sm">Herbari Virtual UIB</p>
                                                <p class="text-[10px] text-forest-neutral-500">Referència acadèmica</p>
                                            </div>
                                        </div>
                                        <span class="material-symbols-outlined text-sm text-forest-neutral-500 group-hover:text-primary transition-colors">open_in_new</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    <button class="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-surface flex items-center justify-center gap-3 transition-all group active:scale-[0.98]">
                        <span class="material-symbols-outlined group-hover:fill-1 transition-all">bookmark_add</span>
                        Afegir a la llista de desitjos
                    </button>

                    <div class="bg-surface rounded-xl border border-white/10 p-6 shadow-xl">
                        <h4 class="font-bold text-lg mb-4 text-white">Presència a les Illes</h4>
                        <div class="grid grid-cols-3 gap-2">
                            ${renderIslandPresence(illa)}
                        </div>
                    </div>

                    ${renderConservationCard(status)}

                    <section class="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-xl">
                        <div class="p-6 border-b border-white/10">
                            <h3 class="font-bold flex items-center gap-2 text-white">
                                <span class="material-symbols-outlined text-primary">location_on</span>
                                Distribució Geogràfica
                            </h3>
                        </div>
                        
                        <div id="detail-map" class="w-full aspect-square bg-forest-neutral-800 relative z-0">
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="flex flex-col items-center gap-2">
                                    <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Carregant mapa...</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 bg-surface/50 border-t border-white/5">
                            <p class="text-[10px] text-forest-neutral-400 text-center leading-relaxed italic">
                                Localitzacions documentades a <span class="text-slate-200">${illa}</span>
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            ${renderRelatedCards(plantId)}
        </main>
    </div>
    `;
}