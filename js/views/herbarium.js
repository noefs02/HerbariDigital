// --- js/views/herbarium.js ---
import { renderSidebar } from '../components/sidebar.js';
import { AppState } from '../app.js';
import { AuthService } from '../services/authService.js';

/**
 * GENERACIÓ DE TAGS CONSISTENTS (Estat, Floració, Hàbitat)
 */
export function renderPlantTags(plant, isLarge = false) {
    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '';
    const status = getProp('Estat de conservació');
    const floracio = getProp('Floració');
    const habitat = getProp('Hàbitat');

    // 1. Estat de conservació color
    let statusClasses = 'bg-slate-700/80 text-white border-slate-500/60';
    if (status.includes('Crític') || status.includes('Perill')) {
        statusClasses = 'bg-red-600/85 text-white border-red-500/60';
    } else if (status.includes('Vulnerable')) {
        statusClasses = 'bg-amber-600/85 text-white border-amber-500/60';
    } else if (status.includes('Protegida')) {
        statusClasses = 'bg-orange-600/85 text-white border-orange-500/60';
    } else if (status.includes('Segura')) {
        statusClasses = 'bg-emerald-600/85 text-white border-emerald-500/60';
    }

    // 2. Època de floració color
    let floracioClasses = 'bg-slate-700/80 text-white border-slate-500/60';
    if (floracio === 'Primavera') {
        floracioClasses = 'bg-pink-600/85 text-white border-pink-500/60';
    } else if (floracio === 'Estiu') {
        floracioClasses = 'bg-amber-500/90 text-white border-amber-400/50';
    } else if (floracio === 'Tardor') {
        floracioClasses = 'bg-orange-600/85 text-white border-orange-500/60';
    } else if (floracio === 'Hivern') {
        floracioClasses = 'bg-sky-600/85 text-white border-sky-500/60';
    }

    // 3. Hàbitat color
    let habitatClasses = 'bg-slate-700/80 text-white border-slate-500/60';
    if (habitat === 'Zones Humides') {
        habitatClasses = 'bg-teal-600/85 text-white border-teal-500/60';
    } else if (habitat === 'Bosc') {
        habitatClasses = 'bg-green-600/85 text-white border-green-500/60';
    } else if (habitat === 'Litoral') {
        habitatClasses = 'bg-blue-600/85 text-white border-blue-500/60';
    } else if (habitat === 'Muntanya') {
        habitatClasses = 'bg-slate-600/85 text-white border-slate-500/60';
    }

    const sizeClasses = isLarge
        ? 'px-3 py-1.5 text-xs tracking-wider'
        : 'px-2 py-0.5 text-[8px] tracking-widest';

    const tags = [];
    if (status) {
        tags.push(`<span class="rounded-full ${statusClasses} ${sizeClasses} font-black uppercase backdrop-blur-md border">${status}</span>`);
    }
    if (floracio) {
        tags.push(`<span class="rounded-full ${floracioClasses} ${sizeClasses} font-black uppercase backdrop-blur-md border">${floracio}</span>`);
    }
    if (habitat) {
        tags.push(`<span class="rounded-full ${habitatClasses} ${sizeClasses} font-black uppercase backdrop-blur-md border">${habitat}</span>`);
    }

    return tags.join('');
}

/**
 * RENDER: TARJETA INDIVIDUAL
 */
function renderPlantCard(entry) {
    const plant = entry.item || entry;
    const id = plant["@id"];
    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '';

    const familia = getProp('Família');
    const illa = getProp('Illa');
    const tagsHTML = renderPlantTags(plant);

    let imageUrl = '';
    if (Array.isArray(plant.image) && plant.image.length > 0) {
        imageUrl = plant.image[0].contentUrl || '';
    } else if (typeof plant.image === 'string') {
        imageUrl = plant.image;
    }

    const thumbUrl = imageUrl ? imageUrl.replace('_2000.webp', '_400.webp') : 'img/fallback.webp';

    let srcset = '';
    if (imageUrl && imageUrl.endsWith('_2000.webp')) {
        const base = imageUrl.replace('_2000.webp', '');
        srcset = `${base}_400.webp 400w, ${base}_800.webp 800w`;
    }

    const isFav = AuthService.isFavorite(id);
    const favClasses = isFav ? '!bg-white !text-primary' : '';

    // CORRECCIÓN: Adaptadas las fuentes de iconos fijas a 'material-icons'
    return `
    <div onclick="window.navigateSPA('plant-detail', '${id}')"
        class="group bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] block">
        <div class="relative aspect-[4/3] overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="Fotografia de ${plant.alternateName || plant.name}" 
                src="${thumbUrl}" 
                ${srcset ? `srcset="${srcset}" sizes="(max-width: 768px) 400px, 800px"` : ''}
                loading="lazy" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-2">${tagsHTML}</div>
            <button onclick="window.toggleFav(event, '${id}', this)"
                aria-label="Afegir ${plant.alternateName || plant.name} a preferits"
                class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all z-20 shadow-lg ${favClasses}">
                <span class="material-icons text-[20px]">favorite</span>
            </button>
        </div>
        <div class="p-6">
            <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-2">${familia}</p>
            <h3 class="text-2xl font-bold text-white mb-0.5">${plant.alternateName}</h3>
            <p class="text-slate-500 text-sm italic mb-6">${plant.name}</p>
            <div class="flex items-center justify-between pt-5 border-t border-white/10">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="material-icons text-base">location_on</span>
                    <span class="text-xs font-medium">${illa}</span>
                </div>
            </div>
        </div>
    </div>`;
}

/**
 * LÒGICA DE FILTRAT
 */
export function applyFilters(allPlants) {
    const checkedIlles = getCheckedValues('illa');
    const checkedConservacio = getCheckedValues('conservacio');
    const checkedFloracio = getCheckedValues('floracio');
    const checkedHabitat = getCheckedValues('habitat');
    const checkedForma = getCheckedValues('forma');
    const checkedSubstrat = getCheckedValues('substrat');
    const checkedAltitud = getCheckedValues('altitud');

    return allPlants.filter(entry => {
        const plant = entry.item || entry;
        const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value;

        const illesPlanta = getProp('Illes') || [];
        const conservacio = getProp('Estat de conservació') || '';
        const floracio = getProp('Floració') || '';
        const habitat = getProp('Hàbitat') || '';
        const forma = getProp('Forma vital') || '';
        const substrat = getProp('Substrat') || '';
        const altitud = getProp('Altitud') ?? 9999;

        if (checkedIlles.length > 0 && !checkedIlles.some(i => illesPlanta.includes(i))) return false;
        if (checkedConservacio.length > 0 && !checkedConservacio.some(c => conservacio.includes(c))) return false;
        if (checkedFloracio.length > 0 && !checkedFloracio.includes(floracio)) return false;
        if (checkedHabitat.length > 0 && !checkedHabitat.includes(habitat)) return false;
        if (checkedForma.length > 0 && !checkedForma.includes(forma)) return false;
        if (checkedSubstrat.length > 0 && !checkedSubstrat.includes(substrat)) return false;

        if (checkedAltitud.length > 0) {
            const matchesRange = checkedAltitud.some(range => {
                if (range === '0 - 50m') return altitud >= 0 && altitud <= 50;
                if (range === '50 - 200m') return altitud > 50 && altitud <= 200;
                if (range === '200 - 500m') return altitud > 200 && altitud <= 500;
                if (range === '500 - 800m') return altitud > 500 && altitud <= 800;
                if (range === '800 - 1100m') return altitud > 800 && altitud <= 1100;
                if (range === 'Més de 1100m') return altitud > 1100;
                return false;
            });
            if (!matchesRange) return false;
        }

        return true;
    });
}

export function getCheckedValues(filterId) {
    const container = document.getElementById(`filter-group-${filterId}`);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
}

/**
 * Re-renderitza només el grid de targetes i la paginació de forma accessible
 */
export function refreshGrid(filteredPlants) {
    const currentPage = window.AppState.currentPage || 1;
    const itemsPerPage = window.AppState.itemsPerPage || 6;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const plantsToShow = filteredPlants.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredPlants.length / itemsPerPage) || 1;

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
        // CORRECCIÓN ACCESIBILIDAD: Añadidos aria-label y control semántico de estados deshabilitados
        let pageButtons = `
            <button onclick="window.changePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all"
                aria-label="Pàgina anterior">
                <span class="material-icons">chevron_left</span>
            </button>`;

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage;
            pageButtons += `
                <button onclick="window.changePage(${i})"
                    aria-label="Anar a la pàgina ${i}"
                    aria-current="${isActive ? 'page' : 'false'}"
                    class="w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all
                    ${isActive ? 'bg-primary text-white shadow-lg' : 'border border-white/10 text-slate-500 hover:border-primary-light hover:text-primary-light'}">
                    ${i}
                </button>`;
        }

        pageButtons += `
            <button onclick="window.changePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all"
                aria-label="Pàgina següent">
                <span class="material-icons">chevron_right</span>
            </button>`;

        paginationEl.innerHTML = pageButtons;
    }

    const counter = document.getElementById('herbari-count');
    if (counter) {
        counter.textContent = `${filteredPlants.length} espècie${filteredPlants.length !== 1 ? 's' : ''}`;
    }
}

/**
 * Inicialitza els listeners dels filtres assegurant el cicle de vida de la SPA
 */
export function initFilterListeners() {
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        // CORRECCIÓN RENDIMIENTO: Eliminamos duplicidades de eventos previas limpiando el listener anterior
        cb.removeEventListener('change', handleFilterChange);
        cb.addEventListener('change', handleFilterChange);
    });
}

function handleFilterChange() {
    window.AppState.currentPage = 1;
    const filtered = applyFilters(window.AppState.plants);
    refreshGrid(filtered);
}

/**
 * RENDER: VISTA HERBARI COMPLETA
 */
export function renderHerbarium(allPlants) {
    const currentPage = window.AppState.currentPage || 1;
    const itemsPerPage = window.AppState.itemsPerPage || 6;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const plantsToShow = allPlants.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(allPlants.length / itemsPerPage) || 1;

    const cardsHTML = plantsToShow.length > 0
        ? plantsToShow.map(p => renderPlantCard(p)).join('')
        : `<div class="col-span-full py-20 text-center text-slate-500 font-bold">No hi ha plantes que coincideixin amb la cerca.</div>`;

    let pageButtons = `
        <button onclick="window.changePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:border-primary-light hover:text-primary-light"'}
            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all"
            aria-label="Pàgina anterior">
            <span class="material-icons">chevron_left</span>
        </button>`;

    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        pageButtons += `
            <button onclick="window.changePage(${i})"
                aria-label="Anar a la pàgina ${i}"
                aria-current="${isActive ? 'page' : 'false'}"
                class="w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all
                ${isActive ? 'bg-primary text-white shadow-lg' : 'border border-white/10 text-slate-500 hover:border-primary-light hover:text-primary-light'}">
                ${i}
            </button>`;
    }

    pageButtons += `
        <button onclick="window.changePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled class="opacity-20 cursor-not-allowed"' : 'class="hover:border-primary-light hover:text-primary-light"'}
            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all"
            aria-label="Pàgina següent">
            <span class="material-icons">chevron_right</span>
        </button>`;

    const sidebarHTML = renderSidebar();

    const html = `
        <div id="herbarium-view" class="view-container flex h-full items-start">
            ${sidebarHTML}
            <main class="flex-1 p-6 lg:p-10 overflow-y-auto h-full">
                <div class="max-w-6xl mx-auto">
                    <div class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 class="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Herbari de les Illes Balears</h2>
                            <p class="text-slate-500 text-lg">
                                Explora la riquesa botànica — 
                                <span id="herbari-count">${allPlants.length} espècies</span>
                            </p>
                        </div>
                    </div>

                    <div id="herbari-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
                        ${cardsHTML}
                    </div>

                    <nav aria-label="Paginació de resultats" id="herbari-pagination" class="mt-16 flex items-center justify-center gap-2 pb-10">
                        ${pageButtons}
                    </nav>
                </div>
            </main>
        </div>
    `;

    // CORRECCIÓN CICLO DE VIDA: El setTimeout delega el enganche de listeners justo cuando el hilo del DOM principal de app.js termine de pintar la vista
    setTimeout(() => initFilterListeners(), 50);

    return html;
}