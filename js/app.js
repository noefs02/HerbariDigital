// --- js/app.js ---
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
    const month = new Date().getMonth() + 1;
    return SEASONS.find(s => s.months.includes(month))?.id || 'primavera';
}

function getCurrentSeason() {
    return localStorage.getItem('herbari-season') || detectSeason();
}

export function setSeason(seasonId) {
    document.documentElement.setAttribute('data-season', seasonId);
    localStorage.setItem('herbari-season', seasonId);

    const season = SEASONS.find(s => s.id === seasonId);
    if (!season) return;

    const btnIcon = document.getElementById('season-btn-icon');
    const btnLabel = document.getElementById('season-btn-label');

    if (btnIcon) btnIcon.textContent = season.icon;
    if (btnLabel) btnLabel.textContent = season.label;

    document.querySelectorAll('.season-option').forEach(el => {
        el.classList.toggle('active', el.dataset.season === seasonId);
    });

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
            homeBg.style.opacity = '';
        }, 150);
    }
}

function initSeason() {
    setSeason(getCurrentSeason());
}

// --- RENDER DEL HEADER ---
function renderHeader() {
    const container = document.getElementById('app-header');
    if (!container) return;

    const navLinks = NAV_ITEMS.map(item => {
        const active = (item.route === AppState.currentRoute);
        const classes = active
            ? 'nav-link text-primary-light font-semibold text-sm border-b-2 border-primary-light pb-1'
            : 'nav-link text-slate-400 hover:text-primary-light transition-colors text-sm font-medium';

        return `<a class="${classes}" href="#" data-route="${item.route}">${item.label}</a>`;
    }).join('');

    container.className = "sticky top-0 z-50 w-full border-b border-white/10 bg-background-dark/90 backdrop-blur-md px-4 lg:px-20 py-3";

    // Componente del usuario en el header
    let userComponent = '';
    if (AppState.currentUser) {
        userComponent = `
            <div class="relative">
                <div aria-label="Obrir menú d'usuari" id="user-profile-btn" class="h-8 w-8 rounded-full bg-surface flex items-center justify-center overflow-hidden border border-white/20 cursor-pointer">
                    <img alt="Perfil" class="h-full w-full object-cover" src="${AppState.currentUser.avatar}"/>
                </div>
                <!-- Menú desplegable del usuario -->
                <div id="user-profile-menu" class="profile-dropdown-menu absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-2xl opacity-0 invisible transition-all duration-200 z-[110]">
                    <div class="p-3 border-b border-white/10">
                        <p class="text-sm font-bold text-white truncate">${AppState.currentUser.nombre}</p>
                    </div>
                    <div class="p-1">
                        <button aria-label="Tancar sessió" id="btn-logout" class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                            <span class="material-icons text-sm">logout</span> Tancar Sessió
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        userComponent = `
            <button aria-label="Obrir formulari d'inici de sessió" id="btn-login-modal" class="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors flex items-center gap-1 shadow-md shadow-primary/20">
                <span class="material-icons text-[14px]">login</span> <span class="hidden sm:inline">Iniciar Sessió</span>
            </button>
        `;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-8 min-w-max">
                <a href="#" data-route="home" class="flex items-center gap-3 no-underline">
                    <div class="p-2 bg-primary rounded-lg text-white shadow-lg flex-shrink-0">
                        <span class="material-icons block">eco</span>
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
                        <span class="material-icons text-lg">search</span>
                    </div>
                    <label for="header-search-input" class="sr-only">Cercar plantes per nom científic o popular</label>
                    <input id="header-search-input" autocomplete="off" class="block w-full rounded-full border-0 py-2 pl-10 bg-surface focus:ring-2 focus:ring-primary-light placeholder:text-slate-600 text-base sm:text-sm text-white" placeholder="Cerca" type="text"/>
                    <div id="search-results" class="absolute top-full left-0 right-0 mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto hidden z-[100]"></div>
                </div>
            </div>

            <div class="flex items-center justify-end gap-3 min-w-max">
                <button aria-label="Obrir o tancar el cercador" id="mobile-search-toggle" class="header-search-toggle p-2 rounded-full hover:bg-surface text-slate-400 hover:text-white transition-all">
                    <span class="material-icons">search</span>
                </button>

                <div class="season-dropdown">
                    <button aria-label="Desplegar llista d'estacions" id="season-toggle-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-white/10 hover:border-white/10 transition-all cursor-pointer">
                        <span id="season-btn-icon" class="material-icons text-primary-light text-lg">local_florist</span>
                        <span id="season-btn-label" class="text-xs font-semibold text-slate-300 hidden sm:inline">Primavera</span>
                        <span class="material-icons text-slate-500 text-sm">expand_more</span>
                    </button>
                    <div id="season-menu" class="season-dropdown-menu">
                        ${SEASONS.map(s => `
                            <button class="season-option flex items-center gap-2" data-season="${s.id}">
                                <span class="material-icons text-lg">${s.icon}</span>
                                ${s.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${userComponent}
            </div>
        </div>
    `;
}

// --- RENDER DEL FOOTER ---
function renderFooter() {
    const container = document.getElementById('app-footer');
    if (!container) return;

    container.className = "mt-auto w-full border-t border-white/10 bg-background-dark/95 backdrop-blur-sm px-4 lg:px-8 pt-3 pb-24 md:py-3";

    container.innerHTML = `
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
        <div class="flex items-center gap-2">
            <div class="p-1 bg-surface rounded-md">
                <span class="material-icons text-primary-light text-base">eco</span>
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
    </div>`;
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
            <a aria-label="Anar a la vista de ${item.label}" href="#" data-route="${item.route}" class="${classes} no-underline flex-1 py-2">
                <span class="material-icons text-[24px]">${item.icon}</span>
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

// Carga de datos asíncronos con Banner visible en caso de error adaptado a Schema.org
async function loadData() {
    try {
        const response = await fetch('data/plants.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        AppState.plants = data.itemListElement.map(el => el.item);

        // --- INJECCIÓ JSON-LD ---
        const scriptJSONLD = document.createElement('script');
        scriptJSONLD.type = 'application/ld+json';
        scriptJSONLD.text = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Herbari Digital de les Illes Balears",
            "description": "Catàleg científic de la flora autòctona de l'arxipèlag balear",
            "itemListElement": AppState.plants
        });
        document.head.appendChild(scriptJSONLD);

        console.log("Dades carregades correctament (Schema.org):", AppState.plants);

        if (AppState.currentRoute === 'herbarium' && window._herbariumFns) {
            const { applyFilters, refreshGrid } = window._herbariumFns;
            refreshGrid(applyFilters(AppState.plants));
        } else if (AppState.currentRoute === 'map' && window._mapFns) {
            const { initMap, initMapFilterListeners } = window._mapFns;
            initMap(AppState.plants);
            initMapFilterListeners();
        }
    } catch (error) {
        console.error('Error carregant les dades persistents:', error);
        const contentDiv = document.getElementById('app-content');
        if (contentDiv) {
            contentDiv.innerHTML = `
                <div class="flex-1 flex items-center justify-center p-6">
                    <div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 max-w-md text-center shadow-xl">
                        <span class="material-icons text-red-500 text-4xl mb-3">error_outline</span>
                        <h3 class="text-white font-bold text-lg mb-1">Error de connexió</h3>
                        <p class="text-sm text-slate-400">No s'ha pogut carregar el catàleg botànic. Per favor, torna a intentar-ho d'aquí a uns minuts.</p>
                    </div>
                </div>
            `;
        }
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
            const imageUrl = p.image && p.image[0] ? p.image[0].contentUrl : 'img/fallback.webp';
            return `
                <div onclick="window.navigateSPA('plant-detail', '${p['@id']}');" 
                     class="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-none transition-colors group">
                    <img src="${imageUrl}" alt="${p.alternateName || p.name}" class="size-10 rounded-lg object-cover border border-white/10" loading="lazy">
                    <div class="flex-1 overflow-hidden">
                        <p class="text-sm font-bold text-slate-100 truncate">${p.alternateName || p.name}</p>
                        <p class="text-[10px] text-slate-500 italic truncate">${p.name}</p>
                    </div>
                    <span class="material-icons text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm">arrow_forward</span>
                </div>
            `;
        }).join('');
    }
    container.classList.remove('hidden');
}

// Inicialización del DOM
document.addEventListener('DOMContentLoaded', () => {
    renderHeader();
    renderFooter();
    renderBottomNav();
    initSeason();
    setupNavigation();
    setupHeaderEvents();

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

    renderView('home');
    loadData();
});

export function setupNavigation() {
    const navLinks = document.querySelectorAll('a[data-route]');
    navLinks.forEach(link => {
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

    if (toggleBtn && menu) {
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

    const seasonOptions = document.querySelectorAll('.season-option');
    seasonOptions.forEach(btn => {
        btn.addEventListener('click', () => {
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
                    window.navigateSPA(AppState.currentRoute);
                }
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            AuthService.logout();
            AppState.currentUser = null;
            window.navigateSPA('home');
        });
    }
}

window.toggleFav = (event, plantaId, btnElement) => {
    if (event) event.stopPropagation();

    if (!AppState.currentUser) {
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

export async function renderView(route, params = {}) {
    // Detener TTS si estaba activo en plant-detail
    if (window._stopPlantTTS) window._stopPlantTTS();

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
        case 'home': {
            const { renderHome } = await import('./views/home.js');
            contentDiv.innerHTML = renderHome();
            break;
        }
        case 'herbarium': {
            const { renderHerbarium, applyFilters, refreshGrid } = await import('./views/herbarium.js');
            contentDiv.innerHTML = renderHerbarium(AppState.plants);
            // Guardamos para loadData
            window._herbariumFns = { applyFilters, refreshGrid };
            break;
        }
        case 'map': {
            const { renderMap, initMap, initMapFilterListeners } = await import('./views/map.js');
            contentDiv.innerHTML = renderMap();
            setTimeout(() => {
                initMap(AppState.plants);
                initMapFilterListeners();
            }, 50);
            // Guardamos para loadData
            window._mapFns = { initMap, initMapFilterListeners };
            break;
        }
        case 'diary': {
            const { renderDiary, initDiaryEvents } = await import('./views/diary.js');
            contentDiv.innerHTML = renderDiary(AppState.diaries);
            setTimeout(async () => {
                await initDiaryEvents();
            }, 50);
            break;
        }
        case 'plant-detail': {
            const { renderPlantDetail, initDetailMap, stopPlantTTS } = await import('./views/plantDetail.js');
            window._stopPlantTTS = stopPlantTTS;

            const plantEntry = AppState.plants.find(p => {
                const idToCheck = p.item ? p.item["@id"] : p["@id"];
                return idToCheck === params.id;
            });

            if (plantEntry) {
                const plantData = plantEntry.item ? plantEntry.item : plantEntry;
                contentDiv.innerHTML = renderPlantDetail(plantData);
                setTimeout(() => {
                    initDetailMap(plantData);
                }, 100);
            }
            break;
        }
        default:
            contentDiv.innerHTML = '<h2 class="text-xl font-bold p-8">Pàgina no trobada</h2>';
    }
}

window.changePage = (pageNumber) => {
    if (AppState.currentRoute === 'herbarium') {
        // Necesitamos applyFilters y refreshGrid del módulo ya cargado
        if (window._herbariumFns) {
            const { applyFilters, refreshGrid } = window._herbariumFns;
            const filtered = applyFilters(AppState.plants);
            const totalPages = Math.ceil(filtered.length / AppState.itemsPerPage);

            if (pageNumber < 1 || pageNumber > totalPages) return;

            AppState.currentPage = pageNumber;
            refreshGrid(filtered);
        }
    } else {
        const totalPages = Math.ceil(AppState.plants.length / AppState.itemsPerPage);
        if (pageNumber < 1 || pageNumber > totalPages) return;
        AppState.currentPage = pageNumber;
        renderView('herbarium');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.navigateSPA = (route, id = null) => {
    if (typeof renderView === 'function') {
        renderView(route, { id: id });
        renderHeader();
        renderFooter();
        renderBottomNav();
        setupNavigation();
        setupHeaderEvents();
        initSeason();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.AppState = AppState;