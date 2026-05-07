import { renderSidebar } from '../components/sidebar.js';

/**
 * RENDER: TARJETA INDIVIDUAL (Diseño Stitch)
 */
function renderPlantCard(plant) {
    // Función para extraer datos del formato Schema.org
    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '';
    
    const familia = getProp('Família') || 'Botànica';
    const status = getProp('Estat de conservació');
    const illa = getProp('Illa');

    // Lógica de Etiquetas (Badges)
    let tagsHTML = '';
    if (status) {
        const color = status.includes('Perill') ? 'red' : 'amber';
        tagsHTML += `<span class="px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${color}-500/30">${status}</span>`;
    }
    if (illa) {
        tagsHTML += `<span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-blue-500/30 ml-1">${illa}</span>`;
    }

    // Badge de "Visto"
    const vistBadge = plant.subjectOf ? `
        <div class="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 z-10">
            <span class="material-symbols-outlined text-lg font-bold">check</span>
        </div>` : '';

    return `
    <div onclick="window.navigateSPA('fitxa', '${plant["@id"]}')"
        class="group bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] block">
        <div class="relative aspect-[4/3] overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="${plant.name}" src="${plant.image}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-2">${tagsHTML}</div>
            ${vistBadge}
            <button onclick="event.stopPropagation(); this.classList.toggle('!bg-white'); this.classList.toggle('!text-primary');" 
                class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all z-20 shadow-lg">
                <span class="material-symbols-outlined text-[20px]">favorite</span>
            </button>
        </div>
        <div class="p-6">
            <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-2">${familia}</p>
            <h3 class="text-2xl font-bold text-white mb-0.5">${plant.alternateName || plant.name}</h3>
            <p class="text-slate-500 text-sm italic mb-6">${plant.name}</p>
            <div class="flex items-center justify-between pt-5 border-t border-white/10">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="material-symbols-outlined text-base">location_on</span>
                    <span class="text-xs font-medium">${plant.subjectOf?.location?.name || illa || 'Illes Balears'}</span>
                </div>
            </div>
        </div>
    </div>`;
}

/**
 * RENDER: VISTA HERBARIO COMPLETA (Con Paginación de 6)
 */
export function renderHerbarium(allPlants) {
    // 1. Obtener estado de paginación
    const currentPage = window.AppState.currentPage || 1;
    const itemsPerPage = window.AppState.itemsPerPage || 6;

    // 2. Lógica de Slicing (Cortar 6 plantas)
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const plantsToShow = allPlants.slice(startIndex, endIndex);

    // 3. Cálculo de páginas
    const totalPages = Math.ceil(allPlants.length / itemsPerPage);

    // 4. Generar Grid de Tarjetas
    const cardsHTML = plantsToShow.length > 0 
        ? plantsToShow.map(p => renderPlantCard(p)).join('')
        : `<div class="col-span-full py-20 text-center text-slate-500 font-bold">No hi ha plantes que coincideixin amb la cerca.</div>`;

    // 5. Generar Menú de Números
    let pageButtons = '';
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        pageButtons += `
            <button onclick="window.changePage(${i})" 
                class="w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all 
                ${isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'border border-white/10 text-slate-500 hover:border-primary-light hover:text-primary-light'}">
                ${i}
            </button>`;
    }

    return `
        <div id="herbarium-view" class="view-container flex h-full items-start">
            ${renderSidebar()}
            
            <main class="flex-1 p-6 lg:p-10 overflow-y-auto h-full">
                <div class="max-w-6xl mx-auto">
                    <header class="mb-12">
                        <h2 class="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Herbari de les Illes Balears</h2>
                        <p class="text-slate-500 text-lg">Explora la riquesa botànica (Pàgina ${currentPage} de ${totalPages})</p>
                    </header>

                    <div id="herbari-grid" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
                        ${cardsHTML}
                    </div>

                    <div class="mt-16 flex items-center justify-center gap-2 pb-10">
                        <button onclick="window.changePage(${currentPage - 1})" 
                            ${currentPage === 1 ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>

                        ${pageButtons}

                        <button onclick="window.changePage(${currentPage + 1})" 
                            ${currentPage === totalPages ? 'disabled class="opacity-20"' : 'class="hover:border-primary-light hover:text-primary-light"'}
                            class="w-12 h-12 flex items-center justify-center rounded-xl border border-white/10 text-slate-500 transition-all">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    `;
}