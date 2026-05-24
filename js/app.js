import { renderHome } from './views/home.js';
import { renderHerbarium, applyFilters, refreshGrid } from './views/herbarium.js';
import { renderMap, initMap, initMapFilterListeners } from './views/map.js';
import { renderDiary } from './views/diary.js';
// ACTUALIZACIÓN: Importamos initDetailMap y stopPlantTTS junto a renderPlantDetail
import { renderPlantDetail, initDetailMap, stopPlantTTS } from './views/plantDetail.js';
import { AuthService } from './services/authService.js';

// Estado global de la aplicación
export const AppState = {
    plants: [],
    currentRoute: 'home',
    diaries: [],
    currentPage: 1,
    itemsPerPage: 6,
    currentUser: AuthService.getCurrentUser()
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

    // Cambiar dinámicamente la imagen de fondo de la vista home (si existe)
    const homeBg = document.getElementById('home-bg-image');
    if (homeBg) {
        const seasonFileNames = {
            'primavera': 'primavera',
            'estiu': 'verano',
            'tardor': 'otoño',
            'hivern': 'invierno'
        };
        const imgPrefix = seasonFileNames[seasonId] || 'primavera';

        // Hacemos una breve transición bajando la opacidad para que el cambio no sea tan brusco
        homeBg.style.opacity = '0';
        setTimeout(() => {
            homeBg.src = `media/img/inicio/${imgPrefix}_800.webp`;
            homeBg.srcset = `
                media/img/inicio/${imgPrefix}_800.webp 800w,
                media/img/inicio/${imgPrefix}_1200.webp 1200w,
                media/img/inicio/${imgPrefix}_1920.webp 1920w,
                media/img/inicio/${imgPrefix}_2560.webp 2560w
            `;
            homeBg.style.opacity = ''; // Restauramos a la clase definida (opacity-50)
        }, 150); // Le damos tiempo a la transición CSS de Tailwind que añadí
    }
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

    container.className = "sticky top-0 z-50 w-full bg-background-dark/90 backdrop-blur-md";

    // Componente del usuario en el header
    let userComponent = '';
    if (AppState.currentUser) {
        userComponent = `
            <div class="relative">
                <div id="user-profile-btn" class="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-white/20 cursor-pointer">
                    <img alt="Perfil" class="h-full w-full object-cover" src="${AppState.currentUser.avatar}"/>
                </div>
                <!-- Menú desplegable del usuario -->
                <div id="user-profile-menu" class="profile-dropdown-menu absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl opacity-0 invisible transition-all duration-200 z-[110]">
                    <div class="p-3 border-b border-white/10">
                        <p class="text-sm font-bold text-white truncate">${AppState.currentUser.nombre}</p>
                    </div>
                    <div class="p-1">
                        <button id="btn-logout" class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                            <span class="material-symbols-outlined text-sm">logout</span> Tancar Sessió
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        userComponent = `
            <button id="btn-login-modal" class="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1 shadow-md shadow-primary/20">
                <span class="material-symbols-outlined text-[14px]">login</span> <span class="hidden sm:inline">Iniciar Sessió</span>
            </button>
        `;
    }

    container.innerHTML = `
    <header class="w-full border-b border-white/10 px-4 lg:px-20 py-3">
        <div class="flex items-center justify-between gap-4">
            
            <div class="flex items-center gap-8 min-w-max">
                <a href="#" data-route="home" class="flex items-center gap-3 no-underline">
                    <div class="p-2 bg-primary rounded-lg text-white shadow-lg shadow-surface flex-shrink-0">
                        <span class="material-symbols-outlined block">eco</span>
                    </div>
                    <h1 class="text-white text-xl font-bold tracking-tight hidden sm:block">Herbari Digital</h1>
                </a>
                <nav class="hidden md:flex items-center gap-8">
                    ${navLinks}
                </nav>
            </div>

            <div id="mobile-search-container" class="header-search-container">
                <div class="relative w-full max-w-md mx-auto transition-all duration-300 focus-within:max-w-lg lg:focus-within:max-w-xl">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                        <span class="material-symbols-outlined text-lg">search</span>
                    </div>
                    <input id="header-search-input" autocomplete="off" class="block w-full rounded-full border-0 py-2 pl-10 bg-surface focus:ring-2 focus:ring-primary-light placeholder:text-slate-600 text-base sm:text-sm text-white" placeholder="Cerca" type="text"/>
                    <div id="search-results" class="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto hidden z-[100]"></div>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 min-w-max">
                <button id="mobile-search-toggle" class="header-search-toggle p-2 rounded-full hover:bg-surface text-slate-400 hover:text-white transition-all">
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

                ${userComponent}
            </div>
        </div>
    </header>
    `;
}

// --- RENDER DEL FOOTER ---
function renderFooter() {
    const container = document.getElementById('app-footer');
    if (!container) return;

    container.className = "mt-auto w-full bg-background-dark";

    container.innerHTML = `
    <footer class="w-full border-t border-white/10 bg-background-dark/95 backdrop-blur-sm px-4 lg:px-8 pt-3 pb-24 md:py-3">
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
            <div class="hidden md:flex items-center gap-5 text-xs font-semibold">
                <a href="#" data-route="herbarium" class="text-slate-500 hover:text-primary-light transition-colors">Herbari</a>
                <a href="#" data-route="map" class="text-slate-500 hover:text-primary-light transition-colors">Mapa</a>
                <a href="#" data-route="diary" class="text-slate-500 hover:text-primary-light transition-colors">Diari</a>
            </div>
        </div>
    </footer>`;
}

// --- RENDER DEL BOTTOM NAV (MOBILE) ---
function renderBottomNav() {
    let container = document.getElementById('app-bottom-nav');
    if (!container) {
        container = document.createElement('div');
        container.id = 'app-bottom-nav';
        document.body.appendChild(container);
    }

    const navLinks = [
        { route: 'herbarium', label: 'Herbari', icon: 'eco' },
        { route: 'map', label: 'Mapa', icon: 'map' },
        { route: 'diary', label: 'Diari', icon: 'book' }
    ].map(item => {
        const active = (item.route === AppState.currentRoute);
        const classes = active
            ? 'text-primary-light flex flex-col items-center justify-center gap-1 font-bold'
            : 'text-slate-500 hover:text-slate-300 transition-colors flex flex-col items-center justify-center gap-1';
        return `
            <a href="#" data-route="${item.route}" class="${classes} no-underline flex-1 py-2">
                <span class="material-symbols-outlined text-[24px]">${item.icon}</span>
                <span class="text-[10px] uppercase tracking-wider">${item.label}</span>
            </a>
        `;
    }).join('');

    container.className = "fixed bottom-0 left-0 right-0 z-[60] bg-background-dark/95 backdrop-blur-md border-t border-white/10 md:hidden";
    container.innerHTML = `
        <nav class="flex justify-around items-center w-full">
            ${navLinks}
        </nav>
    `;

    // Configurar navegación de los nuevos enlaces (sin duplicar listeners en SPA)
    const newLinks = container.querySelectorAll('a[data-route]');
    newLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.navigateSPA(link.dataset.route);
        });
    });
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
    const mobileToggleBtn = document.getElementById('mobile-search-toggle');
    const searchContainer = document.getElementById('mobile-search-container');

    if (!input || !resultsContainer) return;

    if (mobileToggleBtn && searchContainer) {
        mobileToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchContainer.classList.contains('hidden')) {
                searchContainer.classList.remove('hidden');
                searchContainer.classList.add('flex');
                input.focus();
            } else {
                searchContainer.classList.add('hidden');
                searchContainer.classList.remove('flex');
            }
        });
    }

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
        if (!input.contains(e.target) && !resultsContainer.contains(e.target) && searchContainer && !searchContainer.contains(e.target) && mobileToggleBtn && !mobileToggleBtn.contains(e.target)) {
            resultsContainer.classList.add('hidden');
            if (searchContainer.classList.contains('flex') && window.innerWidth < 1200) { // Ocultar barra movil al clicar fuera
                searchContainer.classList.add('hidden');
                searchContainer.classList.remove('flex');
            }
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
    renderBottomNav();
    initSeason();

    // Vinculamos los listeners iniciales
    setupNavigation();
    setupHeaderEvents();

    // Bloquejar el tancament dels desplegables de filtres si tenen algun checkbox actiu
    document.addEventListener('click', (e) => {
        const summary = e.target.closest('aside details summary');
        if (summary) {
            const details = summary.parentElement;
            if (details && details.open) {
                const checked = details.querySelectorAll('input[type="checkbox"]:checked');
                if (checked.length > 0) {
                    e.preventDefault();
                }
            }
        }
    });

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

    // User Profile Dropdown Logic (for both mobile taps and desktop clicks)
    const userProfileBtn = document.getElementById('user-profile-btn');
    const userProfileMenu = document.getElementById('user-profile-menu');
    if (userProfileBtn && userProfileMenu) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userProfileMenu.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!userProfileMenu.contains(e.target) && !userProfileBtn.contains(e.target)) {
                userProfileMenu.classList.remove('open');
            }
        });
    }

    // Iniciar lógica del buscador
    initSearchLogic();

    // Login Modal Logic
    const btnLoginModal = document.getElementById('btn-login-modal');
    const authModal = document.getElementById('auth-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const authForm = document.getElementById('auth-form');
    const btnLogout = document.getElementById('btn-logout');

    if (btnLoginModal && authModal) {
        btnLoginModal.addEventListener('click', () => {
            authModal.classList.remove('hidden');
        });
    }

    if (btnCloseModal && authModal) {
        btnCloseModal.addEventListener('click', () => {
            authModal.classList.add('hidden');
        });
    }

    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('auth-username').value;
            if (usernameInput.trim()) {
                const user = AuthService.login(usernameInput);
                if (user) {
                    AppState.currentUser = user;
                    authModal.classList.add('hidden');
                    window.navigateSPA(AppState.currentRoute); // Re-render vista actual
                }
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            AuthService.logout();
            AppState.currentUser = null;
            window.navigateSPA('home'); // Go home on logout
        });
    }
}

// Helper global para alternar favoritos
window.toggleFav = (event, plantaId, btnElement) => {
    if (event) event.stopPropagation();

    if (!AppState.currentUser) {
        // Require login to add favorite
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.classList.remove('hidden');
        return;
    }

    const isFav = AuthService.toggleFavorite(plantaId);

    // Sincronizar usuario en memoria
    AppState.currentUser = AuthService.getCurrentUser();

    if (btnElement) {
        if (isFav) {
            btnElement.classList.add('!bg-white', '!text-primary');
        } else {
            btnElement.classList.remove('!bg-white', '!text-primary');
        }
    }
};

// Router principal para manejador de vistas
export function renderView(route, params = {}) {
    // Aturem qualsevol síntesi de veu activa quan l'usuari canvia de vista
    if (typeof stopPlantTTS === 'function') {
        stopPlantTTS();
    }

    AppState.currentRoute = route;
    const contentDiv = document.getElementById('app-content');
    if (!contentDiv) return;
    contentDiv.innerHTML = '';

    // El padding inferior para móviles ahora se aplica directamente al footer
    contentDiv.className = "flex-1 flex flex-col w-full relative";

    // Gestionamos clases especiales en el body para vistas a pantalla completa
    if (route === 'map') {
        document.body.classList.add('map-active');
    } else {
        document.body.classList.remove('map-active');
    }

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
        renderBottomNav();
        setupNavigation();
        setupHeaderEvents();
        initSeason();

        // Fer scroll a dalt de tot suaument
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// Hacemos que AppState sea accesible globalmente para la vista
window.AppState = AppState;