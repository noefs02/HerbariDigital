import { renderHome } from './views/home.js';
import { renderHerbarium, applyFilters, refreshGrid } from './views/herbarium.js';
import { renderMap, initMap, initMapFilterListeners } from './views/map.js';
import { renderDiary } from './views/diary.js';
// ACTUALIZACIÓN: Importamos initDetailMap junto a renderPlantDetail
import { renderPlantDetail, initDetailMap } from './views/plantDetail.js';

// Estado global de la aplicación
export const AppState = {
    plants: [],
    currentRoute: 'home',
    diaries: [],
    currentPage: 1,
    itemsPerPage: 6
};

// --- DATA PARA EL HEADER ---
const PROFILE_IMG = 'https://ui-avatars.com/api/?name=Usuario&background=2d7a2d&color=fff';
const NAV_ITEMS = [
    { route: 'home', label: 'Inici' },
    { route: 'herbarium', label: 'Herbari' },
    { route: 'map', label: 'Mapa' },
    { route: 'diary', label: 'Diari' }
];

export const SEASONS = [
    { id: 'primavera', label: 'Primavera', icon: 'local_florist', months: [3, 4, 5] },
    { id: 'estiu', label: 'Estiu', icon: 'wb_sunny', months: [6, 7, 8] },
    { id: 'tardor', label: 'Tardor', icon: 'eco', months: [9, 10, 11] },
    { id: 'hivern', label: 'Hivern', icon: 'ac_unit', months: [12, 1, 2] }
];

// --- SEASONS LOGIC ---
function detectSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    return SEASONS.find(s => s.months.includes(month))?.id || 'primavera';
}

function getCurrentSeason() {
    return localStorage.getItem('herbari-season') || detectSeason();
}

export function setSeason(seasonId) {
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
    // Mantengo tu estructura original
    setSeason(getCurrentSeason());
}

// --- RENDER DEL HEADER ---
function renderHeader() {
    const container = document.getElementById('app-header');
    if (!container) return;

    // Generar enlaces comprobando si es la ruta activa actual
    const navLinks = NAV_ITEMS.map(item => {
        const active = (item.route === AppState.currentRoute);
        const classes = active
            ? 'nav-link text-primary-light font-semibold text-sm border-b-2 border-primary-light pb-1'
            : 'nav-link text-slate-400 hover:text-primary-light transition-colors text-sm font-medium';

        // Fíjate en el uso de data-route en lugar de href real
        return `<a class="${classes}" href="#" data-route="${item.route}">${item.label}</a>`;
    }).join('\n');

    container.className = "sticky top-0 z-50 w-full";

    container.innerHTML = `
    <header class="w-full border-b border-white/10 bg-background-dark/90 backdrop-blur-md px-4 lg:px-20 py-3">
        <div class="flex items-center justify-between gap-4">
            
            <div class="flex items-center gap-8 min-w-max">
                <a href="#" data-route="home" class="flex items-center gap-3 no-underline">
                    <div class="p-2 bg-primary rounded-lg text-white shadow-lg shadow-surface flex-shrink-0">
                        <span class="material-symbols-outlined block">eco</span>
                    </div>
                    <h1 class="text-white text-xl font-bold tracking-tight">Herbari Digital</h1>
                </a>
                <nav class="hidden md:flex items-center gap-8">
                    ${navLinks}
                </nav>
            </div>

            <div class="hidden sm:flex flex-1 justify-center max-w-xl mx-4">
                <div class="relative w-full max-w-md">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                        <span class="material-symbols-outlined text-lg">search</span>
                    </div>
                    <input id="header-search-input" autocomplete="off" class="block w-full rounded-full border-0 py-2 pl-10 bg-surface focus:ring-2 focus:ring-primary-light placeholder:text-slate-600 text-sm text-white" placeholder="Cerca per nom popular o científic..." type="text"/>
                    <div id="search-results" class="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto hidden z-[100]"></div>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 min-w-max">
                <button class="sm:hidden p-2 rounded-full hover:bg-surface text-slate-400 hover:text-white transition-all">
                    <span class="material-symbols-outlined">search</span>
                </button>

                <div class="season-dropdown">
                    <button id="season-toggle-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/10 hover:border-white/10 transition-all cursor-pointer">
                        <span id="season-btn-icon" class="material-symbols-outlined text-primary-light text-lg">local_florist</span>
                        <span id="season-btn-label" class="text-xs font-semibold text-slate-300 hidden sm:inline">Primavera</span>
                        <span class="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
                    </button>
                    <div id="season-menu" class="season-dropdown-menu">
                        ${SEASONS.map(s => `
                            <button class="season-option" data-season="${s.id}">
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

// --- RENDER DEL FOOTER ---
function renderFooter() {
    const container = document.getElementById('app-footer');
    if (!container) return;

    container.className = "sticky bottom-0 z-50 w-full";

    container.innerHTML = `
    <footer class="w-full border-t border-white/10 bg-background-dark/95 backdrop-blur-sm px-4 lg:px-8 py-3 mt-auto">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <div class="flex items-center gap-2">
                <div class="p-1 bg-surface rounded-md">
                    <span class="material-symbols-outlined text-primary-light text-base">eco</span>
                </div>
                <span class="text-slate-500 text-[11px] font-medium tracking-wide">© 2026 Herbari Digital Balear</span>
            </div>
            <div class="flex items-center gap-4 text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                <span>Conservació</span>
                <span class="hidden sm:inline">·</span>
                <span class="hidden sm:inline">Illes Balears</span>
            </div>
            <div class="flex items-center gap-5 text-xs font-semibold">
                <a href="#" data-route="herbarium" class="text-slate-500 hover:text-primary-light transition-colors">Herbari</a>
                <a href="#" data-route="map" class="text-slate-500 hover:text-primary-light transition-colors">Mapa</a>
                <a href="#" data-route="diary" class="text-slate-500 hover:text-primary-light transition-colors">Diari</a>
            </div>
        </div>
    </footer>`;
}

// Nuevo loaddata adaptado a Schema.org
async function loadData() {
    try {
        const response = await fetch('data/plants.json');
        const data = await response.json();

        // Transformamos la estructura de Schema.org a una lista plana para AppState
        AppState.plants = data.itemListElement.map(el => el.item);

        console.log("Dades cargades correctamente (Schema.org):", AppState.plants);

        // RENDIMIENTO: Si el usuario ya está esperando en el herbario o mapa, refrescamos la vista de inmediato con los datos listos
        if (AppState.currentRoute === 'herbarium') {
            refreshGrid(applyFilters(AppState.plants));
        } else if (AppState.currentRoute === 'map') {
            initMap(AppState.plants);
            initMapFilterListeners();
        }
    } catch (error) {
        console.error('Error cargando los datos persistentes:', error);
    }
}

// --- LÓGICA DEL BUSCADOR ---
function initSearchLogic() {
    const input = document.getElementById('header-search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!input || !resultsContainer) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }

        const matches = AppState.plants.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.alternateName && p.alternateName.toLowerCase().includes(query))
        );

        renderSearchMatches(matches, resultsContainer);
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add('hidden');
        }
    });
}

function renderSearchMatches(matches, container) {
    if (matches.length === 0) {
        container.innerHTML = `<div class="p-4 text-xs text-slate-500 italic">No s'han trobat coincidències</div>`;
    } else {
        container.innerHTML = matches.map(p => {
            // Anem directes a buscar l'enllaç de la imatge de 100px que està a la primera posició de l'array
            const imageUrl = p.image[0].contentUrl;

            return `
                <div onclick="window.navigateSPA('plant-detail', '${p['@id']}');" 
                     class="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors group">
                    <img src="${imageUrl}" class="size-10 rounded-lg object-cover border border-white/10" loading="lazy">
                    <div class="flex-1 overflow-hidden">
                        <p class="text-sm font-bold text-slate-100 truncate">${p.alternateName || p.name}</p>
                        <p class="text-[10px] text-slate-500 italic truncate">${p.name}</p>
                    </div>
                    <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm">arrow_forward</span>
                </div>
            `;
        }).join('');
    }
    container.classList.remove('hidden');
}

// Inicialización del DOM
document.addEventListener('DOMContentLoaded', () => {
    // RENDIMIENTO: Renderizamos los contenedores fijos primero
    renderHeader();
    renderFooter();
    initSeason();

    // Vinculamos los listeners iniciales
    setupNavigation();
    setupHeaderEvents();

    // RENDIMIENTO: Cargamos la vista de inmediato en lugar de hacer 'await' de los datos, liberando el hilo principal
    renderView('home');

    // Los datos se descargan de fondo de manera asíncrona no bloqueante
    loadData();
});

// Configurar los enlaces del menú del Header
export function setupNavigation() {
    const navLinks = document.querySelectorAll('a[data-route]');

    navLinks.forEach(link => {
        // Clonamos el nodo o quitamos listeners viejos para evitar duplicados en la SPA
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const route = newLink.dataset.route;
            window.navigateSPA(route);
        });
    });
}

export function setupHeaderEvents() {
    const toggleBtn = document.getElementById('season-toggle-btn');
    const menu = document.getElementById('season-menu');

    // Abrir/cerrar dropdown
    if (toggleBtn && menu) {
        // Limpieza de eventos previos clonando el botón
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

        newToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        document.removeEventListener('click', handleOutsideClick);
        document.addEventListener('click', handleOutsideClick);

        function handleOutsideClick(e) {
            if (!menu.contains(e.target) && !newToggleBtn.contains(e.target)) {
                menu.classList.remove('open');
            }
        }
    }

    // Funcionalidad 'setSeason' al pulsar una opción
    const seasonOptions = document.querySelectorAll('.season-option');
    seasonOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const seasonId = btn.dataset.season;
            setSeason(seasonId);
            if (menu) menu.classList.remove('open');
        });
    });

    // Iniciar lógica del buscador
    initSearchLogic();
}

// Router principal para manejador de vistas
export function renderView(route, params = {}) {
    AppState.currentRoute = route;
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    switch (route) {
        case 'home':
            contentDiv.innerHTML = renderHome();
            break;
        case 'herbarium':
            contentDiv.innerHTML = renderHerbarium(AppState.plants);
            break;
        case 'map':
            contentDiv.innerHTML = renderMap();
            // Invoquem la lògica de Leaflet després de renderitzar el DOM
            setTimeout(() => {
                initMap(AppState.plants);
                initMapFilterListeners(); // Activa els filtres a la vista mapa
            }, 50);
            break;
        case 'diary':
            contentDiv.innerHTML = renderDiary(AppState.diaries);
            setTimeout(async () => {
                const { initDiaryEvents } = await import('./views/diary.js');
                await initDiaryEvents();
            }, 50);
            break;
        case 'plant-detail':
            // Busquem la planta comparant l'ID de Schema.org
            const plantEntry = AppState.plants.find(p => {
                const idToCheck = p.item ? p.item["@id"] : p["@id"];
                return idToCheck === params.id;
            });

            if (plantEntry) {
                const plantData = plantEntry.item ? plantEntry.item : plantEntry;
                contentDiv.innerHTML = renderPlantDetail(plantData);

                // ACTUALIZACIÓN: Inicializamos el mapa específico de la planta detallada
                setTimeout(() => {
                    initDetailMap(plantData);
                }, 100);
            }
            break;
        default:
            contentDiv.innerHTML = '<h2>Pàgina no trobada</h2>';
    }
}

window.changePage = (pageNumber) => {
    if (AppState.currentRoute === 'herbarium') {
        const filtered = applyFilters(AppState.plants);
        const totalPages = Math.ceil(filtered.length / AppState.itemsPerPage);

        if (pageNumber < 1 || pageNumber > totalPages) return;

        AppState.currentPage = pageNumber;
        refreshGrid(filtered);
    } else {
        const totalPages = Math.ceil(AppState.plants.length / AppState.itemsPerPage);
        if (pageNumber < 1 || pageNumber > totalPages) return;
        AppState.currentPage = pageNumber;
        renderView('herbarium');
    }

    // Scroll suave cap a dalt per veure les noves targetes
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Función global de navegación para que los onclick la detecten
window.navigateSPA = (route, id = null) => {
    if (typeof renderView === 'function') {
        renderView(route, { id: id });

        // Actualitzar la capçalera i components
        renderHeader();
        renderFooter();
        setupNavigation();
        setupHeaderEvents();
        initSeason();

        // Fer scroll a dalt de tot suaument
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Hacemos que AppState sea accesible globalmente para la vista
window.AppState = AppState;