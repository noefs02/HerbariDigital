import { renderSidebar } from '../components/sidebar.js';
import { AppState } from '../app.js';

/**
 * RENDER: TARJETA INDIVIDUAL
 */
function renderPlantCard(entry) {
    const plant = entry.item || entry;
    const id = plant["@id"];

    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '';

    const familia = getProp('Família');
    const status = getProp('Estat de conservació');
    const illa = getProp('Illa');
    const etiquetes = getProp('Etiquetes') || [];

    // Tags HTML: les etiquetes ara són strings simples (Schema.org compatible)
    let tagsHTML = '';
    if (Array.isArray(etiquetes) && etiquetes.length > 0) {
        tagsHTML = etiquetes.map(t => {
            // Derivem el color a partir del text de l'etiqueta
            const color = t.toLowerCase().includes('perill') || t.toLowerCase().includes('crític') ? 'red'
                : t.toLowerCase().includes('proteg') ? 'orange'
                    : t.toLowerCase().includes('vulnerable') ? 'amber'
                        : t.toLowerCase().includes('endèm') ? 'blue'
                            : 'slate';
            return `<span class="px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${color}-500/30">${t}</span>`;
        }).join('');
    } else {
        const statusColor = status.includes('Perill') ? 'red' : 'amber';
        tagsHTML = `
            <span class="px-2 py-0.5 rounded-full bg-${statusColor}-500/20 text-${statusColor}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${statusColor}-500/30">${status}</span>
            <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-blue-500/30">${illa}</span>
        `;
    }

    // Extraiem una imatge vàlida, reemplaçant _2000 per _400.webp
    let imageUrl = '';
    if (Array.isArray(plant.image) && plant.image.length > 0) {
        imageUrl = plant.image[0].contentUrl || '';
    } else if (typeof plant.image === 'string') {
        imageUrl = plant.image;
    }

    const thumbUrl = imageUrl ? imageUrl.replace('_2000.webp', '_400.webp') : '';
    
    // Auto generació del srcset tal com es fa a plantDetail.js
    let srcset = '';
    if (imageUrl && imageUrl.endsWith('_2000.webp')) {
        const base = imageUrl.replace('_2000.webp', '');
        srcset = `${base}_400.webp 400w, ${base}_800.webp 800w`;
    }

    return `
    <div onclick="window.navigateSPA('plant-detail', '${id}')"
        class="group bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] block">
        <div class="relative aspect-[4/3] overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="${plant.alternateName || plant.name}" 
                src="${thumbUrl}" 
                ${srcset ? `srcset="${srcset}" sizes="(max-width: 768px) 400px, 800px"` : ''}
                loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-2">${tagsHTML}</div>
            <button onclick="event.stopPropagation(); this.classList.toggle('!bg-white'); this.classList.toggle('!text-primary');"
                class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all z-20 shadow-lg">
                <span class="material-symbols-outlined text-[20px]">favorite</span>
            </button>
        </div>
        <div class="p-6">
            <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-2">${familia}</p>
            <h3 class="text-2xl font-bold text-white mb-0.5">${plant.alternateName}</h3>
            <p class="text-slate-500 text-sm italic mb-6">${plant.name}</p>
            <div class="flex items-center justify-between pt-5 border-t border-white/10">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    <span class="text-xs font-medium">${illa}</span>
                </div>
            </div>
        </div>
    </div>`;
}

/**
 * LÒGICA DE FILTRAT
 * Llegeix l'estat actiu dels filtres des del DOM i filtra les plantes
 */
export function applyFilters(allPlants) {
    const checkedIlles = getCheckedValues('illa');
    const checkedConservacio = getCheckedValues('conservacio');
    const checkedFloracio = getCheckedValues('floracio');
    const checkedHabitat = getCheckedValues('habitat');
    const checkedForma = getCheckedValues('forma');
    const checkedSubstrat = getCheckedValues('substrat');
    const checkedExposicio = getCheckedValues('exposicio');
    const checkedUsos = getCheckedValues('usos');
    const altitudMax = getAltitudValue();

    return allPlants.filter(entry => {
        const plant = entry.item || entry;
        const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value;

        const illesPlanta = getProp('Illes') || [];
        const conservacio = getProp('Estat de conservació') || '';
        const floracio = getProp('Floració') || '';
        const habitat = getProp('Hàbitat') || '';
        const forma = getProp('Forma vital') || '';
        const substrat = getProp('Substrat') || '';
        const exposicio = getProp('Exposició solar') || '';
        const altitud = getProp('Altitud') ?? 9999;
        const usos = getProp('Usos') || [];

        if (checkedIlles.length > 0 && !checkedIlles.some(i => illesPlanta.includes(i))) return false;
        if (checkedConservacio.length > 0 && !checkedConservacio.some(c => conservacio.includes(c))) return false;
        if (checkedFloracio.length > 0 && !checkedFloracio.includes(floracio)) return false;
        if (checkedHabitat.length > 0 && !checkedHabitat.includes(habitat)) return false;
        if (checkedForma.length > 0 && !checkedForma.includes(forma)) return false;
        if (checkedSubstrat.length > 0 && !checkedSubstrat.includes(substrat)) return false;
        if (checkedExposicio.length > 0 && !checkedExposicio.includes(exposicio)) return false;
        if (altitudMax !== null && altitud > altitudMax) return false;
        if (checkedUsos.length > 0 && !checkedUsos.some(u => usos.includes(u))) return false;

        return true;
    });
}

export function getCheckedValues(filterId) {
    const container = document.getElementById(`filter-group-${filterId}`);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
}

function getAltitudValue() {
    const input = document.getElementById('filter-altitud-range');
    if (!input) return null;
    return parseInt(input.value, 10);
}

/**
 * Re-renderitza només el grid de targetes i la paginació (sense re-renderitzar el sidebar)
 */
export function refreshGrid(filteredPlants) {
    const currentPage = window.AppState.currentPage || 1;
    const itemsPerPage = window.AppState.itemsPerPage || 6;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const plantsToShow = filteredPlants.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredPlants.length / itemsPerPage);

    // Grid
    const grid = document.getElementById('herbari-grid');
    if (grid) {
        grid.innerHTML = plantsToShow.length > 0
            ? plantsToShow.map(p => renderPlantCard(p)).join('')
            : `<div class="col-span-full py-20 text-center text-slate-500 font-bold">Cap planta coincideix amb els filtres seleccionats.</div>`;
    }

    // Paginació
    const paginationEl = document.getElementById('herbari-pagination');
    if (paginationEl) {
        let pageButtons = `
            <button onclick="window.changePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>`;

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage;
            pageButtons += `
                <button onclick="window.changePage(${i})"
                    class="w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all
                    ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'border border-white/10 text-slate-500 hover:border-primary-light hover:text-primary-light'}">
                    ${i}
                </button>`;
        }

        pageButtons += `
            <button onclick="window.changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
                <span class="material-symbols-outlined">chevron_right</span>
            </button>`;

        paginationEl.innerHTML = pageButtons;
    }

    // Comptador de resultats
    const counter = document.getElementById('herbari-count');
    if (counter) {
        counter.textContent = `${filteredPlants.length} espècie${filteredPlants.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Inicialitza els listeners dels filtres (s'ha de cridar després de renderitzar el DOM)
 */
function initFilterListeners() {
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
            window.AppState.currentPage = 1;
            const filtered = applyFilters(window.AppState.plants);
            refreshGrid(filtered);
        });
    });

    const altitudeInput = document.getElementById('filter-altitud-range');
    if (altitudeInput) {
        altitudeInput.addEventListener('input', (e) => {
            const label = document.getElementById('filter-altitud-value');
            if (label) label.textContent = `${e.target.value}m`;
            window.AppState.currentPage = 1;
            const filtered = applyFilters(window.AppState.plants);
            refreshGrid(filtered);
        });
    }
}

/**
 * RENDER: VISTA HERBARI COMPLETA
 */
export function renderHerbarium(allPlants) {
    const currentPage = window.AppState.currentPage || 1;
    const itemsPerPage = window.AppState.itemsPerPage || 6;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const plantsToShow = allPlants.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(allPlants.length / itemsPerPage);

    const cardsHTML = plantsToShow.length > 0
        ? plantsToShow.map(p => renderPlantCard(p)).join('')
        : `<div class="col-span-full py-20 text-center text-slate-500 font-bold">No hi ha plantes que coincideixin amb la cerca.</div>`;

    let pageButtons = `
        <button onclick="window.changePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
            <span class="material-symbols-outlined">chevron_left</span>
        </button>`;

    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        pageButtons += `
            <button onclick="window.changePage(${i})"
                class="w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all
                ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'border border-white/10 text-slate-500 hover:border-primary-light hover:text-primary-light'}">
                ${i}
            </button>`;
    }

    pageButtons += `
        <button onclick="window.changePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
            <span class="material-symbols-outlined">chevron_right</span>
        </button>`;

    const sidebarHTML = renderSidebar();

    const html = `
        <div id="herbarium-view" class="view-container flex h-full items-start">
            ${sidebarHTML}
            <main class="flex-1 p-6 lg:p-10 overflow-y-auto h-full">
                <div class="max-w-6xl mx-auto">
                    <header class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 class="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Herbari de les Illes Balears</h2>
                            <p class="text-slate-500 text-lg">
                                Explora la riquesa botànica — 
                                <span id="herbari-count">${allPlants.length} espècies</span>
                            </p>
                        </div>
                    </header>

                    <div id="herbari-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
                        ${cardsHTML}
                    </div>

                    <div id="herbari-pagination" class="mt-16 flex items-center justify-center gap-2 pb-10">
                        ${pageButtons}
                    </div>
                </div>
            </main>
        </div>
    `;

    setTimeout(() => initFilterListeners(), 0);

    return html;
}