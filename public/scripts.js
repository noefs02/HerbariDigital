/* ============================================
   HERBARI DIGITAL BALEAR — Scripts Compartits
   ============================================ */

// ─── CONFIGURACIÓ TAILWIND (CSS variable-driven) ───
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "var(--primary)",
                "primary-light": "var(--primary-light)",
                "background-light": "var(--surface)",
                "background-dark": "var(--bg-dark)",
                "surface": "var(--surface)",
                "forest-neutral": {
                    "50": "var(--sn-50)", "100": "var(--sn-100)",
                    "200": "var(--sn-200)", "300": "var(--sn-300)",
                    "400": "var(--sn-400)", "500": "var(--sn-500)",
                    "600": "var(--sn-600)", "700": "var(--sn-700)",
                    "800": "var(--sn-800)", "900": "var(--sn-900)",
                    "950": "var(--sn-950)"
                }
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "full": "9999px"
            },
        },
    },
};

// ─── SEASONAL THEMES ───
const SEASONS = [
    { id: 'primavera', label: 'Primavera', icon: 'local_florist', months: [3, 4, 5] },
    { id: 'estiu', label: 'Estiu', icon: 'wb_sunny', months: [6, 7, 8] },
    { id: 'tardor', label: 'Tardor', icon: 'eco', months: [9, 10, 11] },
    { id: 'hivern', label: 'Hivern', icon: 'ac_unit', months: [12, 1, 2] }
];

function detectSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    return SEASONS.find(s => s.months.includes(month))?.id || 'primavera';
}

function getCurrentSeason() {
    return localStorage.getItem('herbari-season') || detectSeason();
}

function setSeason(seasonId) {
    document.documentElement.setAttribute('data-season', seasonId);
    localStorage.setItem('herbari-season', seasonId);
    // Update the selector button if it exists
    const season = SEASONS.find(s => s.id === seasonId);
    if (!season) return;
    const btnIcon = document.getElementById('season-btn-icon');
    const btnLabel = document.getElementById('season-btn-label');
    if (btnIcon) btnIcon.textContent = season.icon;
    if (btnLabel) btnLabel.textContent = season.label;
    // Update active states in dropdown
    document.querySelectorAll('.season-option').forEach(el => {
        el.classList.toggle('active', el.dataset.season === seasonId);
    });
}

function initSeason() {
    setSeason(getCurrentSeason());
}

// ─── DADES DELS FILTRES ───
const FILTRES = [
    {
        id: 'illa', icon: 'location_on', title: 'Illa',
        type: 'pills',
        options: ['Mallorca', 'Menorca', 'Eivissa', 'Formentera', 'Cabrera'],
        defaultChecked: ['Mallorca'],
        open: true
    },
    {
        id: 'conservacio', icon: 'security', title: 'Estat de conservació',
        type: 'pills',
        options: ['Endèmica', 'Protegida', 'En Perill']
    },
    {
        id: 'floracio', icon: 'calendar_month', title: 'Època de floració',
        type: 'pills',
        options: ['Primavera', 'Estiu', 'Tardor', 'Hivern']
    },
    {
        id: 'habitat', icon: 'landscape', title: 'Hàbitat',
        type: 'pills',
        options: ['Muntanya', 'Litoral', 'Bosc', 'Zones Humides']
    },
    {
        id: 'forma', icon: 'psychology_alt', title: 'Forma vital',
        type: 'pills',
        options: ['Faneròfit', 'Camèfit', 'Hemicriptòfit']
    },
    {
        id: 'substrat', icon: 'layers', title: 'Substrat',
        type: 'pills',
        options: ['Calcari', 'Silícic']
    },
    {
        id: 'exposicio', icon: 'wb_sunny', title: 'Exposició solar',
        type: 'pills',
        options: ['Ple sol', 'Semiombra', 'Ombra']
    },
    {
        id: 'altitud', icon: 'height', title: 'Altitud',
        type: 'range',
        min: 0, max: 1500, unit: 'm'
    },
    {
        id: 'usos', icon: 'medical_services', title: 'Usos i propietats',
        type: 'pills',
        options: ['Medicinal', 'Ornamental', 'Comestible', 'Mel·lífera']
    }
];

// ─── NAVEGACIÓ ───
const NAV_ITEMS = [
    { label: 'Herbari', href: 'herbari.html', icon: 'local_florist' },
    { label: 'Mapa', href: 'mapa.html', icon: 'map' },
    { label: 'Diari', href: 'diari.html', icon: 'auto_stories' }
];

const PROFILE_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCn6mb9daHdIjxUN-J0yzHwVJ6Alm7au4j7lwtDZIyM61EdXV8tpBmthHXZxWTQ60dqIQrGmfaN0lB1VxFiSqHeUASnIKZ7zXNkUkN44e-msDocARgB0CiVoO6Px0KNEqcaSOkXtzsPkTb32fR6J23WC35b_vepq13QSlJsdJnacWh8gJ1WOTz0WwPSMwYapFHNI4lAaS3JJXnVnw_eUZ7F-QZDW5IaEYpZgGMbN7olY35ZemCwZAHybymh316kcXefZs0tqC8IksE';

// ─── HELPERS ───
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1) || 'herbari.html';
    return filename;
}

function isActive(href) {
    return getCurrentPage() === href;
}

// ─── COMPONENT: HEADER ───
function renderHeader() {
    const container = document.getElementById('app-header');
    if (!container) return;

    const currentPage = getCurrentPage();

    const navLinks = NAV_ITEMS.map(item => {
        const active = isActive(item.href);
        const classes = active
            ? 'text-primary-light font-semibold text-sm border-b-2 border-primary-light pb-1'
            : 'text-slate-400 hover:text-primary-light transition-colors text-sm font-medium';
        return `<a class="${classes}" href="${item.href}">${item.label}</a>`;
    }).join('\n');

    // Aplica les classes sticky al propi contenidor perquè no faci scroll amb la pàgina
    container.className = "sticky top-0 z-50 w-full";

    container.innerHTML = `
    <header class="w-full border-b border-white/10 bg-background-dark/90 backdrop-blur-md px-4 lg:px-20 py-3">
        <div class="flex items-center justify-between gap-4">
            <!-- Left: Logo & Nav -->
            <div class="flex items-center gap-8 min-w-max">
                <a href="herbari.html" class="flex items-center gap-3 no-underline">
                    <div class="p-2 bg-primary rounded-lg text-white shadow-lg shadow-surface">
                        <span class="material-symbols-outlined block">eco</span>
                    </div>
                    <h1 class="text-white text-xl font-bold tracking-tight">Herbari Digital</h1>
                </a>
                <nav class="hidden md:flex items-center gap-8">
                    ${navLinks}
                </nav>
            </div>

            <!-- Center: Search (Visible on SM and up) -->
            <div class="hidden sm:flex flex-1 justify-center max-w-xl mx-4">
                <div class="relative w-full max-w-md">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                        <span class="material-symbols-outlined text-lg">search</span>
                    </div>
                    <input class="block w-full rounded-full border-0 py-2 pl-10 bg-surface focus:ring-2 focus:ring-primary-light placeholder:text-slate-600 text-sm text-white" placeholder="Cerca per nom popular o científic..." type="text"/>
                </div>
            </div>

            <!-- Right: Season Selector, Profile & Mobile Search -->
            <div class="flex items-center justify-end gap-3 min-w-max">
                <button class="sm:hidden p-2 rounded-full hover:bg-surface text-slate-400 hover:text-white transition-all">
                    <span class="material-symbols-outlined">search</span>
                </button>

                <!-- Season Selector -->
                <div class="season-dropdown">
                    <button id="season-toggle-btn" onclick="document.getElementById('season-menu').classList.toggle('open')" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/10 hover:border-white/10 transition-all cursor-pointer">
                        <span id="season-btn-icon" class="material-symbols-outlined text-primary-light text-lg">local_florist</span>
                        <span id="season-btn-label" class="text-xs font-semibold text-slate-300 hidden sm:inline">Primavera</span>
                        <span class="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
                    </button>
                    <div id="season-menu" class="season-dropdown-menu">
                        ${SEASONS.map(s => `
                            <button class="season-option" data-season="${s.id}" onclick="setSeason('${s.id}'); document.getElementById('season-menu').classList.remove('open');">
                                <span class="material-symbols-outlined text-lg">${s.icon}</span>
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-white/20 cursor-pointer">
                    <img alt="Perfil" class="h-full w-full object-cover" src="${PROFILE_IMG}"/>
                </div>
            </div>
        </div>
    </header>`;
}

// ─── COMPONENT: SIDEBAR FILTRES ───
function renderFilterPill(option, checked = false) {
    const checkedAttr = checked ? 'checked=""' : '';
    return `
    <label class="cursor-pointer">
        <input class="sr-only peer" type="checkbox" ${checkedAttr}/>
        <span class="px-2.5 py-1 text-[10px] font-medium rounded-full border border-slate-800 bg-surface text-slate-400 peer-checked:bg-primary peer-checked:text-white peer-checked:border-primary transition-all inline-block">${option}</span>
    </label>`;
}

function renderFilterRange(filter) {
    return `
    <div class="p-3 mt-1">
        <input class="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-light" max="${filter.max}" min="${filter.min}" type="range"/>
        <div class="flex justify-between mt-2 text-[10px] text-slate-500 font-medium">
            <span>${filter.min}${filter.unit}</span>
            <span>${filter.max}${filter.unit}</span>
        </div>
    </div>`;
}

function renderFilter(filter) {
    const openAttr = filter.open ? 'open=""' : '';
    let content = '';

    if (filter.type === 'pills') {
        const pills = filter.options.map(opt => {
            const checked = filter.defaultChecked && filter.defaultChecked.includes(opt);
            return renderFilterPill(opt, checked);
        }).join('\n');
        content = `<div class="flex flex-wrap gap-2 p-2 mt-1">${pills}</div>`;
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

function renderSidebar() {
    const container = document.getElementById('app-sidebar');
    if (!container) return;

    const filters = FILTRES.map(f => renderFilter(f)).join('\n');

    // Recollir contingut extra específic de la pàgina (e.g., Punts d'Interès al mapa)
    const extraEl = document.getElementById('sidebar-extra-content');
    const extraHTML = extraEl ? extraEl.innerHTML : '';
    if (extraEl) extraEl.remove();

    container.innerHTML = `
    <aside class="hidden lg:flex w-72 flex-col border-r border-white/10 bg-background-dark p-6 space-y-4 h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto custom-scrollbar">
        <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Filtres Botànics</h2>
        <div class="space-y-2">
            ${filters}
        </div>
        ${extraHTML}
    </aside>`;
}

// ─── COMPONENT: FOOTER ───
function renderFooter() {
    const container = document.getElementById('app-footer');
    if (!container) return;

    container.innerHTML = `
    <footer class="w-full border-t border-white/10 bg-background-dark/95 backdrop-blur-sm px-4 lg:px-8 py-3 mt-auto">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-2">
                <div class="p-1 bg-surface rounded-md">
                    <span class="material-symbols-outlined text-primary-light text-base">eco</span>
                </div>
                <span class="text-slate-500 text-[11px] font-medium tracking-wide">© 2024 Herbari Digital Balear</span>
            </div>
            <div class="flex items-center gap-4 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                <span>Conservació</span>
                <span class="hidden sm:inline">·</span>
                <span class="hidden sm:inline">Illes Balears</span>
            </div>
            <div class="flex items-center gap-5 text-xs font-semibold">
                <a href="herbari.html" class="text-slate-500 hover:text-primary-light transition-colors">Herbari</a>
                <a href="mapa.html" class="text-slate-500 hover:text-primary-light transition-colors">Mapa</a>
                <a href="diari.html" class="text-slate-500 hover:text-primary-light transition-colors">Diari</a>
            </div>
        </div>
    </footer>`;
}

// ─── COMPONENT: MOBILE BOTTOM NAV ───
function renderMobileNav() {
    const container = document.getElementById('app-mobile-nav');
    if (!container) return;

    const items = NAV_ITEMS.map(item => {
        const active = isActive(item.href);
        const textColor = active ? 'text-primary-light' : 'text-slate-500';
        const bgClass = active ? 'bg-surface' : '';
        return `
        <a href="${item.href}" class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${bgClass} transition-colors">
            <span class="material-symbols-outlined ${textColor} text-xl">${item.icon}</span>
            <span class="${textColor} text-[10px] font-semibold">${item.label}</span>
        </a>`;
    }).join('\n');

    container.innerHTML = `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-dark/95 backdrop-blur-md border-t border-white/10 px-6 py-2 flex justify-around items-center">
        ${items}
    </nav>`;
}

// ─── DADES: CARREGADOR JSON ───
let _plantesCache = null;

async function loadPlantes() {
    if (_plantesCache) return _plantesCache;
    try {
        const res = await fetch('plantes.json');
        const data = await res.json();
        _plantesCache = data.plantes;
        return _plantesCache;
    } catch (e) {
        console.error('Error carregant plantes.json:', e);
        return [];
    }
}

function getPlantaById(plantes, id) {
    return plantes.find(p => p.id === id);
}

// ─── RENDERITZADOR: TARGETA HERBARI ───
function renderPlantCard(planta) {
    const tags = planta.etiquetes.map(t => `
        <span class="px-2 py-0.5 rounded-full bg-${t.color}-500/20 text-${t.color}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${t.color}-500/30">${t.text}</span>
    `).join('');

    const vistBadge = planta.vist ? `
        <div class="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 z-10" title="Planta ja vista">
            <span class="material-symbols-outlined text-lg font-bold">check</span>
        </div>` : '';

    const favButton = `
        <button onclick="event.preventDefault(); this.classList.toggle('!bg-white'); this.classList.toggle('!text-primary'); const s = this.querySelector('span'); s.style.fontVariationSettings = s.style.fontVariationSettings === '\\'FILL\\' 1' ? 'normal' : '\\'FILL\\' 1';" 
            class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all z-20 shadow-lg" title="Llista de seguiment">
            <span class="material-symbols-outlined text-[20px]">favorite</span>
        </button>`;

    return `
    <a href="fitxa.html?id=${planta.id}"
        class="group bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] block">
        <div class="relative aspect-[4/3] overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="${planta.imatgeAlt}" src="${planta.imatge}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-2">${tags}</div>
            ${vistBadge}
            ${favButton}
        </div>
        <div class="p-6">
            <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-2">${planta.familia}</p>
            <h3 class="text-2xl font-bold text-white mb-0.5">${planta.nomComu}</h3>
            <p class="text-slate-500 text-sm italic mb-6">${planta.nomCientific}</p>
            <div class="flex items-center justify-between pt-5 border-t border-white/10">
                <div class="flex items-center gap-2 text-slate-500">
                    <span class="material-symbols-outlined text-base">${planta.ubicacioIcona}</span>
                    <span class="text-xs font-medium">${planta.ubicacio}</span>
                </div>
            </div>
        </div>
    </a>`;
}

async function renderHerbariCards() {
    const container = document.getElementById('herbari-grid');
    if (!container) return;
    const plantes = await loadPlantes();
    container.innerHTML = plantes.map(p => renderPlantCard(p)).join('');
}

// ─── RENDERITZADOR: FITXA DETALL ───
function renderIslandPresence(presencia) {
    const illes = [
        { key: 'mallorca', nom: 'Mallorca' },
        { key: 'cabrera', nom: 'Cabrera' },
        { key: 'menorca', nom: 'Menorca' },
        { key: 'eivissa', nom: 'Eivissa' },
        { key: 'formentera', nom: 'Formentera' }
    ];
    return illes.map(illa => {
        const present = presencia[illa.key];
        const bg = present ? 'bg-forest-neutral-900 border-forest-neutral-700' : 'bg-background-dark border-white/10';
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

function renderConservationCard(estat) {
    const colorMap = { red: 'red', orange: 'orange', amber: 'amber', emerald: 'emerald' };
    const c = colorMap[estat.colorRisc] || 'slate';
    return `
    <div class="bg-${c}-500/10 rounded-xl border border-${c}-500/20 p-6">
        <div class="flex items-center gap-2 text-${c}-400 mb-3">
            <span class="material-symbols-outlined">warning</span>
            <h4 class="font-bold text-lg">Estat de conservació</h4>
        </div>
        <p class="text-sm text-forest-neutral-300 mb-4 italic leading-relaxed">"${estat.descripcioRisc}"</p>
        <div class="w-full bg-forest-neutral-800 h-2 rounded-full overflow-hidden">
            <div class="bg-${c}-600 h-full" style="width:${estat.percentatgeRisc}%"></div>
        </div>
        <p class="text-[10px] mt-2 text-right uppercase font-bold text-${c}-600">${estat.etiquetaRisc}</p>
    </div>`;
}

function renderRelatedCard(planta) {
    const tags = planta.etiquetes.map(t => `
        <span class="px-2 py-0.5 rounded-full bg-${t.color}-500/20 text-${t.color}-400 text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-${t.color}-500/30">${t.text}</span>
    `).join('');

    const vistBadge = planta.vist ? `
        <div class="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border border-white/10 z-10" title="Planta ja vista">
            <span class="material-symbols-outlined text-lg font-bold">check</span>
        </div>` : '';

    const favButton = `
        <button onclick="event.preventDefault(); this.classList.toggle('!bg-white'); this.classList.toggle('!text-primary'); const s = this.querySelector('span'); s.style.fontVariationSettings = s.style.fontVariationSettings === '\\'FILL\\' 1' ? 'normal' : '\\'FILL\\' 1';" 
            class="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-primary transition-all z-20 shadow-lg" title="Llista de seguiment">
            <span class="material-symbols-outlined text-[20px]">favorite</span>
        </button>`;

    return `
    <a href="fitxa.html?id=${planta.id}"
        class="group flex flex-col bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] aspect-[4/5]">
        <div class="relative flex-1 overflow-hidden">
            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="${planta.imatgeAlt}" src="${planta.imatge}" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="absolute top-4 left-4 flex flex-wrap gap-2 w-2/3">${tags}</div>
            ${vistBadge}
            ${favButton}
        </div>
        <div class="p-5 shrink-0 bg-surface">
            <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-1">${planta.familia}</p>
            <h4 class="text-lg font-bold text-white leading-tight">${planta.nomComu}</h4>
        </div>
    </a>`;
}

function loadMapPopup() {
    const container = document.getElementById('map-popup');
    if (!container) return;

    fetch('plantes.json')
        .then(response => response.json())
        .then(data => {
            if (data && data.plantes && data.plantes.length > 0) {
                const planta = data.plantes[0];
                container.style.display = 'block';
                container.innerHTML = `
                    <div class="relative group">
                        <button class="absolute top-2 right-2 text-white/70 hover:text-white z-30 bg-black/40 hover:bg-black/80 rounded-full p-1 leading-none shadow-xl transition-colors backdrop-blur-md focus:outline-none"
                            onclick="document.getElementById('map-popup').style.display='none'">
                            <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                        ${renderRelatedCard(planta)}
                    </div>
                `;
            }
        })
        .catch(console.error);
}

async function renderFitxaPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const plantes = await loadPlantes();
    const p = getPlantaById(plantes, id);
    if (!p || !p.fitxa) return;
    const f = p.fitxa;

    // Breadcrumb
    const breadcrumb = document.getElementById('fitxa-breadcrumb');
    if (breadcrumb) breadcrumb.textContent = p.nomComu;

    // Title
    document.title = `${p.nomComu} — Herbari Digital Balear`;

    // Hero image
    const heroEl = document.getElementById('fitxa-hero');
    if (heroEl) {
        const carouselImg = f.imatgeCarrusel || p.imatge;
        heroEl.style.backgroundImage = `linear-gradient(0deg, rgba(20, 30, 20, 0.9) 0%, rgba(20, 30, 20, 0.2) 50%, rgba(0, 0, 0, 0) 100%), url("${carouselImg}")`;
    }

    // Hero tags + title
    const heroTags = document.getElementById('fitxa-hero-tags');
    if (heroTags) {
        heroTags.innerHTML = p.etiquetes.slice(0, 2).map(t => {
            const isRed = t.color === 'red';
            const cls = isRed
                ? 'bg-red-600 text-white'
                : 'bg-surface border border-primary text-slate-100';
            return `<span class="px-3 py-1 ${cls} text-xs font-bold rounded-full uppercase tracking-wider">${t.text}</span>`;
        }).join('');
    }
    const heroTitle = document.getElementById('fitxa-hero-title');
    if (heroTitle) heroTitle.textContent = p.nomComu;

    // Fitxa tècnica
    const nomCientific = document.getElementById('fitxa-nom-cientific');
    if (nomCientific) nomCientific.textContent = f.nomCientificComplet;
    const nomComu = document.getElementById('fitxa-nom-comu');
    if (nomComu) nomComu.textContent = p.nomComu;
    const sol = document.getElementById('fitxa-sol');
    if (sol) sol.textContent = f.sol;
    const floracio = document.getElementById('fitxa-floracio');
    if (floracio) floracio.textContent = f.floracio;

    // Description
    const desc = document.getElementById('fitxa-descripcio');
    if (desc) desc.innerHTML = f.descripcio.map(d => `<p>${d}</p>`).join('');

    // Island presence
    const illes = document.getElementById('fitxa-illes');
    if (illes) illes.innerHTML = renderIslandPresence(p.presencia);

    // Conservation
    const conservacio = document.getElementById('fitxa-conservacio');
    if (conservacio) conservacio.innerHTML = renderConservationCard(f.estatConservacio);

    // Map
    const mapaImg = document.getElementById('fitxa-mapa-img');
    if (mapaImg && f.imatgeMapa) {
        mapaImg.style.backgroundImage = `url("${f.imatgeMapa}")`;
    }
    const mapaText = document.getElementById('fitxa-mapa-text');
    if (mapaText) mapaText.textContent = f.distribucioGeografica;

    // Related plants (4 random, excluding current)
    const relatedContainer = document.getElementById('fitxa-related');
    if (relatedContainer) {
        const others = plantes.filter(pl => pl.id !== id);
        const shuffled = others.sort(() => 0.5 - Math.random()).slice(0, 4);
        relatedContainer.innerHTML = shuffled.map(pl => renderRelatedCard(pl)).join('');
    }
}

// ─── RENDERITZADOR: DIARI ───
function renderChecklistItem(planta) {
    const isVist = planta.vist;
    const wrapperCls = isVist
        ? 'bg-surface border-white/10' : 'bg-slate-900/40 border-slate-800';
    const imgCls = isVist
        ? 'border-white/10'
        : 'border-slate-800';
    const imgExtraCls = isVist ? '' : 'opacity-60 grayscale';
    const nameCls = isVist ? '' : 'text-slate-500';
    const subtitleCls = isVist ? 'text-slate-400' : 'text-slate-500';

    const btnVist = isVist
        ? `<button class="p-1.5 bg-forest-neutral-900 text-primary rounded-lg shadow-sm" title="Vist">
                <span class="material-symbols-outlined text-lg">check_circle</span>
           </button>`
        : `<button class="p-1.5 bg-slate-800 text-slate-500 rounded-lg hover:bg-primary hover:text-white transition-colors" title="Pendents">
                <span class="material-symbols-outlined text-lg">radio_button_unchecked</span>
           </button>`;

    return `
    <div class="${wrapperCls} border rounded-xl p-3 flex items-center gap-4 group hover:border-primary transition-all">
        <div class="size-14 rounded-lg overflow-hidden shrink-0 border ${imgCls}">
            <img alt="${planta.nomComu}" class="w-full h-full object-cover ${imgExtraCls}" src="${planta.imatge}" />
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-bold text-sm truncate ${nameCls}">${planta.nomComu}</h4>
            <p class="text-[10px] italic ${subtitleCls} truncate">${planta.nomCientific}</p>
        </div>
        <div class="flex gap-1.5">
            ${btnVist}
            <button class="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors" title="Mapa">
                <span class="material-symbols-outlined text-lg">location_on</span>
            </button>
            <button class="p-1.5 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Eliminar">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    </div>`;
}

function renderDiaryEntry(planta) {
    if (!planta.diari || !planta.diari.data) return '';

    const d = planta.diari;
    const condicions = d.condicions.map(c => `
        <span class="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
            <span class="material-symbols-outlined text-sm">${c.icona}</span> ${c.text}
        </span>
    `).join('');

    const imgSrc = d.imatgeDiari || planta.imatge;

    return `
    <article class="flex flex-col md:flex-row gap-4 bg-surface rounded-xl border border-white/10 overflow-hidden p-4">
        <div class="md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
            <img alt="${planta.nomComu}" class="w-full h-full object-cover" src="${imgSrc}" />
        </div>
        <div class="flex-1 flex flex-col justify-between">
            <div class="space-y-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-lg text-white">${planta.nomComu}</h4>
                        <p class="text-xs italic text-primary -mt-1 mb-1 font-medium">${planta.nomCientific}</p>
                        <div class="flex items-center gap-2 text-xs text-forest-neutral-700 font-medium">
                            <span class="material-symbols-outlined text-xs">calendar_today</span> ${d.data}
                            <span class="material-symbols-outlined text-xs ml-2">location_on</span> ${d.coordenades}
                        </div>
                    </div>
                    <button class="text-slate-400 hover:text-primary">
                        <span class="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
                <div class="p-3 bg-slate-900/30 rounded-lg text-sm text-slate-400">
                    <p>${d.notes}</p>
                </div>
            </div>
            <div class="flex gap-4 mt-2">${condicions}</div>
        </div>
    </article>`;
}

async function renderDiariPage() {
    const plantes = await loadPlantes();

    // Render checklist
    const checklistContainer = document.getElementById('diari-checklist');
    if (checklistContainer) {
        checklistContainer.innerHTML = plantes.map(p => renderChecklistItem(p)).join('');
    }

    // Render diary entries (only plants with diary data, sorted by date desc)
    const diaryContainer = document.getElementById('diari-entries');
    if (diaryContainer) {
        const withDiary = plantes.filter(p => p.diari && p.diari.data);
        diaryContainer.innerHTML = withDiary.map(p => renderDiaryEntry(p)).join('');
    }
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
    initSeason();
    renderHeader();
    // Update season selector state after header is rendered
    setSeason(getCurrentSeason());
    renderSidebar();
    renderFooter();
    renderMobileNav();

    // Close season dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('season-menu');
        const btn = document.getElementById('season-toggle-btn');
        if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    // Page-specific renderers
    const page = getCurrentPage();
    if (page === 'herbari.html' || page === '') {
        await renderHerbariCards();
    } else if (page === 'fitxa.html') {
        await renderFitxaPage();
    } else if (page === 'diari.html') {
        await renderDiariPage();
    }
});
