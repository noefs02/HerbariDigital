export const FILTRES = [
    {
        id: 'illa', icon: 'location_on', title: 'Illa',
        type: 'pills',
        options: ['Mallorca', 'Menorca', 'Eivissa', 'Formentera', 'Cabrera'],
        open: true
    },
    {
        id: 'conservacio', icon: 'security', title: 'Estat de conservació',
        type: 'pills',
        options: ['Segura', 'Vulnerable', 'Protegida', 'En Perill', 'En Perill Crític'],
        open: true
    },
    {
        id: 'floracio', icon: 'calendar_month', title: 'Època de floració',
        type: 'pills',
        options: ['Primavera', 'Estiu', 'Tardor', 'Hivern'],
        open: true
    },
    {
        id: 'habitat', icon: 'landscape', title: 'Hàbitat',
        type: 'pills',
        options: ['Muntanya', 'Litoral', 'Bosc', 'Zones Humides']
    },
    {
        id: 'forma', icon: 'psychology_alt', title: 'Forma vital',
        type: 'pills',
        options: ['Faneròfit', 'Camèfit', 'Hemicriptòfit', 'Nanofaneròfit', 'Geòfit', 'Teròfit']
    },
    {
        id: 'substrat', icon: 'layers', title: 'Substrat',
        type: 'pills',
        options: ['Calcari', 'Silícic', 'Salí', 'Arenós', 'Humid', 'Rocallós']
    },
    {
        id: 'altitud', icon: 'height', title: 'Altitud',
        type: 'pills',
        options: ['0 - 50m', '50 - 200m', '200 - 500m', '500 - 800m', '800 - 1100m', 'Més de 1100m']
    }
];

function renderFilterPill(option, filterId) {
    return `
    <label class="cursor-pointer">
        <input class="sr-only peer filter-checkbox" type="checkbox" value="${option}" data-filter="${filterId}"/>
        <span class="px-2.5 py-1 text-[10px] font-medium rounded-full border border-slate-800 bg-surface text-slate-400 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block cursor-pointer">${option}</span>
    </label>`;
}

function renderFilterRange(filter) {
    return `
    <div class="p-3 mt-1">
        <input id="filter-${filter.id}-range"
            class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-light"
            max="${filter.max}" min="${filter.min}" value="${filter.max}" type="range"/>
        <div class="flex justify-between mt-2 text-[10px] text-slate-500 font-medium">
            <span>${filter.min}${filter.unit}</span>
            <span id="filter-${filter.id}-value">${filter.max}${filter.unit}</span>
        </div>
    </div>`;
}

function renderFilter(filter) {
    const openAttr = filter.open ? 'open=""' : '';
    let content = '';

    if (filter.type === 'pills') {
        const pills = filter.options.map(opt => renderFilterPill(opt, filter.id)).join('\n');
        // Cada grup de pills té un id per llegir-lo des de la lògica de filtrat
        content = `<div id="filter-group-${filter.id}" class="flex flex-wrap gap-2 p-2 mt-1">${pills}</div>`;
    } else if (filter.type === 'range') {
        content = renderFilterRange(filter);
    }

    return `
    <details class="group" ${openAttr}>
        <summary class="flex items-center justify-between cursor-pointer p-1 hover:bg-surface/50 rounded-md transition-colors">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary-light text-xl">${filter.icon}</span>
                <span class="text-sm font-semibold text-slate-200">${filter.title}</span>
            </div>
            <span class="material-symbols-outlined text-slate-500 group-open:rotate-180 transition-transform text-lg">expand_more</span>
        </summary>
        ${content}
    </details>`;
}

export function renderSidebar(extraHTML = '') {
    const filters = FILTRES.map(f => renderFilter(f)).join('\n');

    return `
    <div id="sidebar-backdrop" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] hidden lg:hidden"></div>
    <aside id="filters-sidebar" class="fixed inset-y-0 left-0 z-[80] w-72 flex-col border-r border-white/10 bg-background-dark p-6 space-y-4 h-[100dvh] overflow-y-auto custom-scrollbar transform -translate-x-full transition-transform duration-300 lg:relative lg:h-auto lg:overflow-visible lg:translate-x-0 lg:z-10 flex shadow-2xl lg:shadow-none">
        <div class="flex items-center justify-between mb-2 px-1">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500">Filtres Botànics</h2>
            <button id="close-sidebar-btn" class="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-surface">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
        <div class="space-y-2 flex-1">
            ${filters}
        </div>
        ${extraHTML}
    </aside>`;
}

export function initSidebarEvents() {
    const sidebar = document.getElementById('filters-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const openBtns = document.querySelectorAll('.open-sidebar-btn');
    const closeBtn = document.getElementById('close-sidebar-btn');

    if (!sidebar) return;

    function openSidebar() {
        sidebar.classList.remove('-translate-x-full');
        if (backdrop) backdrop.classList.remove('hidden');
        if (window.innerWidth < 1024) document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        sidebar.classList.add('-translate-x-full');
        if (backdrop) backdrop.classList.add('hidden');
        document.body.style.overflow = '';
    }

    openBtns.forEach(btn => btn.addEventListener('click', openSidebar));
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);
}
