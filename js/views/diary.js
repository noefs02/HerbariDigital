import { AppState } from '../app.js';
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, LayerSwitcherControl, injectMapStyles } from '../components/mapUtils.js';
import { AuthService } from '../services/authService.js';

export function renderDiary(diaries) {
    return `
        <main id="diary-view" class="flex flex-1 flex-col px-4 py-6 lg:px-20 gap-6">
            <!-- Contenedor de Logros (Achievements) -->
            <section id="achievements-container">
                <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-6 py-1">
                        <div class="h-2 bg-slate-700 rounded"></div>
                        <div class="space-y-3">
                            <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
                                <div class="h-14 w-14 bg-slate-700 rounded-full mx-auto"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <!-- Checklist de favoritos -->
                <section class="lg:col-span-5 flex flex-col gap-8">
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">checklist</span>
                                Llista de Control
                            </h3>
                        </div>
                        <div class="flex p-1 bg-surface rounded-lg border border-white/10" id="checklist-filters">
                            <button data-filter="all" class="flex-1 py-1.5 text-xs font-bold bg-primary text-white rounded-md shadow-sm transition-colors">Tots</button>
                            <button data-filter="encontrado" class="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors">Vistos</button>
                            <button data-filter="sin-encontrar" class="flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors">Pendents</button>
                        </div>
                        
                        <!-- Lista injectada dinámicamente -->
                        <div id="diari-checklist" class="flex flex-col gap-3 pr-2 h-[750px] overflow-y-auto">
                            <div class="p-6 text-center text-slate-500 text-sm italic">Carregant llista...</div>
                        </div>

                        <!-- Paginación -->
                        <div id="checklist-pagination" class="flex items-center justify-center gap-1.5 py-4 border-t border-white/10">
                            <!-- Inyectado dinámicamente -->
                        </div>
                    </div>
                </section>

                <!-- Entradas del diario -->
                <section id="diari-entries" class="lg:col-span-7 flex flex-col gap-6">
                    <!-- Mapa de Troballes -->
                    <div class="flex flex-col gap-4" id="map-section">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">explore</span> Mapa de Troballes
                            </h3>
                            <button id="map-toggle-btn" class="p-2 bg-surface hover:bg-primary/20 text-primary rounded-lg transition-colors" title="Minimizar/Maximizar mapa">
                                <span class="material-symbols-outlined">unfold_less</span>
                            </button>
                        </div>
                        <div id="diary-map-container" class="relative w-full h-[600px] rounded-xl overflow-hidden border border-white/10 bg-surface z-0 select-none outline-none focus:outline-none transition-all duration-300">
                            <div id="diary-map" class="w-full h-full"></div>
                        </div>
                    </div>

                    <!-- Llista de Diari d'Activitat -->
                    <div class="flex flex-col gap-4 mt-2">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary">menu_book</span> Diari d'Activitat
                            </h3>
                            <button id="btn-nou-registre" class="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors">
                                <span class="material-symbols-outlined text-base">add</span> Nou Registre
                            </button>
                        </div>
                        
                        <div id="diari-entries-list" class="space-y-4 h-[960px] overflow-y-auto">
                            <div class="p-6 text-center text-slate-500 text-sm italic">Carregant registres del diari...</div>
                        </div>
                        
                        <div id="diary-pagination" class="flex items-center justify-center gap-2 mt-2 py-4 border-t border-white/10">
                            <!-- Paginación inyectada dinámicamente -->
                        </div>
                    </div>
                </section>
            </div>
        </main>

        <!-- Modal de Nou Registre -->
        <div id="diary-modal" class="fixed inset-0 z-[200] hidden flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 overflow-y-auto">
            <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-black relative my-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold flex items-center gap-2 text-white">
                        <span class="material-symbols-outlined text-primary">add_circle</span>
                        Nou Registre
                    </h2>
                    <button id="btn-close-diary-modal" class="text-slate-400 hover:text-white transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form id="diary-form" class="space-y-4">
                    <div class="relative">
                        <label for="diary-plant-search" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Planta</label>
                        <div class="relative">
                            <input type="text" id="diary-plant-search" autocomplete="off" placeholder="Escriu per cercar una planta..." class="w-full bg-slate-900 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" required>
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                                <span class="material-symbols-outlined text-lg">search</span>
                            </div>
                            <button type="button" id="btn-clear-plant" class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white hidden">
                                <span class="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        <input type="hidden" id="diary-plant-select" required>
                        <div id="diary-plant-results" class="absolute left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl max-h-60 overflow-y-auto hidden z-[210] shadow-2xl divide-y divide-white/5"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="diary-date" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Data</label>
                            <input type="datetime-local" id="diary-date" required class="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                        </div>
                        <div>
                            <label for="diary-loc-name" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicació (Nom)</label>
                            <input type="text" id="diary-loc-name" required placeholder="Ex: Serra de Tramuntana" class="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="diary-lat" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Latitud</label>
                            <input type="number" step="any" id="diary-lat" required placeholder="39.7103" class="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                        </div>
                        <div>
                            <label for="diary-lng" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Longitud</label>
                            <input type="number" step="any" id="diary-lng" required placeholder="2.9122" class="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">
                        </div>
                    </div>
                    <div class="flex justify-end mb-2">
                        <button type="button" id="btn-geolocate" class="text-xs text-primary hover:text-primary-light flex items-center gap-1 transition-colors">
                            <span class="material-symbols-outlined text-[14px]">my_location</span> Utilitzar la meva ubicació
                        </button>
                    </div>
                    <div>
                        <label for="diary-obs" class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Observacions</label>
                        <textarea id="diary-obs" rows="3" class="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Afegeix detalls de la troballa..."></textarea>
                    </div>
                    <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4">
                        <span class="material-symbols-outlined">save</span> Guardar Registre
                    </button>
                </form>
            </div>
        </div>
    `;
}

// Variables de estado local para la vista del diario
let df_currentUserFavorites = [];
let df_currentFilter = 'all';
let df_currentPage = 1;
const df_itemsPerPage = 8;

let df_currentUserDiary = [];
let df_currentDiaryPage = 1;
const df_diaryItemsPerPage = 4;

// Estado del mapa
let df_mapIsMinimized = false;
const df_mapMinimizedHeight = 'h-[80px]';
const df_mapNormalHeight = 'h-[600px]';

export async function initDiaryEvents() {
    try {
        const user = AppState.currentUser;
        if (!user) {
            const diaryView = document.getElementById('diary-view');
            if (diaryView) {
                diaryView.innerHTML = `
                    <div class="flex flex-col items-center justify-center text-center p-12 mt-12 bg-surface border border-white/10 rounded-2xl max-w-lg mx-auto shadow-2xl">
                        <span class="material-symbols-outlined text-6xl text-slate-500 mb-4">lock</span>
                        <h2 class="text-2xl font-bold text-white mb-2">Inicia Sessió</h2>
                        <p class="text-slate-400 mb-6">Necessites iniciar sessió per veure el teu diari, llista de desitjos i èxits.</p>
                        <button onclick="document.getElementById('btn-login-modal').click()" class="bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-lg shadow-primary/20">
                            Identificar-se
                        </button>
                    </div>
                `;
            }
            return;
        }

        renderAchievements(user.logros);

        // Inicializar Llista de Control
        df_currentUserFavorites = user.favoritos || [];
        setupChecklistFilters();
        updateChecklistUI();

        // Inicializar Mapa y Diario
        if (user.diario) {
            df_currentUserDiary = user.diario;
            initDiaryMap(user.diario);
            updateDiaryUI();
            setupMapToggle();
        }

        // Modal logic
        setupDiaryModal();

    } catch (error) {
        console.error("Error al cargar los datos del usuario:", error);
    }
}

// --- CHECKLIST LOGIC ---

function setupChecklistFilters() {
    const filterContainer = document.getElementById('checklist-filters');
    if (!filterContainer) return;

    const buttons = filterContainer.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Actualizar diseño de los botones
            buttons.forEach(b => {
                b.className = "flex-1 py-1.5 text-xs font-bold text-slate-400 hover:text-primary transition-colors";
            });
            const clickedBtn = e.target;
            clickedBtn.className = "flex-1 py-1.5 text-xs font-bold bg-primary text-white rounded-md shadow-sm transition-colors";

            // Actualizar estado y reescribir
            df_currentFilter = clickedBtn.dataset.filter;
            df_currentPage = 1; // reset a pág 1 al cambiar de filtro
            updateChecklistUI();
        });
    });
}

function updateChecklistUI() {
    const listContainer = document.getElementById('diari-checklist');
    const paginationContainer = document.getElementById('checklist-pagination');
    if (!listContainer) return;

    // 1. Filtrar lista sumando el json de usuarios con la store global de plantas
    const mappedFavorites = df_currentUserFavorites
        .filter(fav => df_currentFilter === 'all' || fav.estado === df_currentFilter)
        .map(fav => {
            // Buscar la planta en AppState.plants (asegurándonos de sacar la versión Schema u Obj pelado)
            const plantData = AppState.plants.find(p => {
                const idToCheck = p.item ? p.item["@id"] : p["@id"];
                return idToCheck === fav.plantaId;
            });
            const p = plantData?.item || plantData; // Desenvuelve de itemListElement si aplica
            return {
                ...fav, // lleva plantaId y estado
                plantaDetails: p || null
            };
        })
        .filter(item => item.plantaDetails !== null); // Ignorar si en plants.json ya no existe

    // 2. Paginar
    const totalPages = Math.ceil(mappedFavorites.length / df_itemsPerPage) || 1;
    if (df_currentPage > totalPages) df_currentPage = totalPages;

    const startIndex = (df_currentPage - 1) * df_itemsPerPage;
    const paginatedItems = mappedFavorites.slice(startIndex, startIndex + df_itemsPerPage);

    // 3. Renderizar listado
    if (paginatedItems.length === 0) {
        listContainer.innerHTML = `<div class="p-6 text-center text-slate-500 text-sm italic">No hi ha cap planta en aquesta llista.</div>`;
    } else {
        listContainer.innerHTML = paginatedItems.map(fav => renderChecklistItem(fav)).join('');
        // Agregamos enrutamiento dinámico a los botones de la lista generada
        setupChecklistActions();
    }

    // 4. Renderizar Paginación
    renderChecklistPagination(paginationContainer, totalPages);
}

function renderChecklistItem(favItem) {
    const isVist = favItem.estado === 'encontrado';
    const planta = favItem.plantaDetails;

    // Extraiem una imatge vàlida, reemplaçant _2000 per _100_icon
    let imageUrl = '';
    if (Array.isArray(planta.image) && planta.image.length > 0) {
        imageUrl = planta.image[0].contentUrl || '';
    } else if (typeof planta.image === 'string') {
        imageUrl = planta.image;
    }
    const thumbUrl = imageUrl ? imageUrl.replace('_2000.webp', '_100_icon.webp') : '';

    const wrapperCls = isVist
        ? 'bg-surface border-white/10' : 'bg-slate-900/40 border-slate-800';
    const imgCls = isVist
        ? 'border-white/10'
        : 'border-slate-800';
    const imgExtraCls = isVist ? '' : 'opacity-60 grayscale';
    const nameCls = isVist ? '' : 'text-slate-500';
    const subtitleCls = isVist ? 'text-slate-400' : 'text-slate-500';

    const btnVist = isVist
        ? `<button class="p-1.5 bg-forest-neutral-900 text-primary rounded-lg shadow-sm cursor-default" title="Vist">
                <span class="material-symbols-outlined text-lg">check_circle</span>
           </button>`
        : `<button class="p-1.5 bg-slate-800 text-slate-500 rounded-lg cursor-default" title="Pendent">
                <span class="material-symbols-outlined text-lg">radio_button_unchecked</span>
           </button>`;

    return `
    <div class="${wrapperCls} border rounded-xl p-3 flex items-center gap-4 group hover:border-primary transition-all">
        <div class="size-14 rounded-lg overflow-hidden shrink-0 border ${imgCls} cursor-pointer" onclick="window.navigateSPA('plant-detail', '${planta['@id']}');">
            <img alt="${planta.name}" class="w-full h-full object-cover ${imgExtraCls}" src="${thumbUrl}" />
        </div>
        <div class="flex-1 min-w-0 cursor-pointer" onclick="window.navigateSPA('plant-detail', '${planta['@id']}');">
            <h4 class="font-bold text-sm truncate ${nameCls}">${planta.alternateName || planta.name}</h4>
            <p class="text-[10px] italic ${subtitleCls} truncate">${planta.name}</p>
        </div>
        <div class="flex gap-1.5">
            ${btnVist}
            ${!isVist ? `<button class="p-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors" title="Afegir al diari" data-fav-add="${favItem.plantaId}">
                <span class="material-symbols-outlined text-lg">add</span>
            </button>` : ''}
            <button class="p-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors" onclick="window.navigateSPA('map');" title="Veure al Mapa">
                <span class="material-symbols-outlined text-lg">location_on</span>
            </button>
            <button class="p-1.5 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Eliminar de preferits" data-fav-delete="${favItem.plantaId}">
                <span class="material-symbols-outlined text-lg">delete</span>
            </button>
        </div>
    </div>`;
}

function renderChecklistPagination(container, totalPages) {
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let pHTML = `
        <button class="flex items-center justify-center rounded-lg h-7 w-7 bg-surface text-primary hover:bg-primary hover:text-white transition-colors diari-pag-prev" ${df_currentPage === 1 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>
            <span class="material-symbols-outlined text-base">chevron_left</span>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        // En una app real limitaríamos los números si hay 50 páginas, aquí mostramos todas
        const activeCls = i === df_currentPage
            ? 'bg-primary text-white font-bold'
            : 'bg-surface text-primary hover:bg-primary hover:text-white font-bold';

        pHTML += `<button class="flex items-center justify-center rounded-lg h-7 w-7 transition-colors text-xs diari-pag-n" data-page="${i} ${activeCls}">${i}</button>`;
    }

    pHTML += `
        <button class="flex items-center justify-center rounded-lg h-7 w-7 bg-surface text-primary hover:bg-primary hover:text-white transition-colors diari-pag-next" ${df_currentPage === totalPages ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>
            <span class="material-symbols-outlined text-base">chevron_right</span>
        </button>
    `;

    container.innerHTML = pHTML;

    // Vincular Eventos de paginación
    const prevBtn = container.querySelector('.diari-pag-prev');
    const nextBtn = container.querySelector('.diari-pag-next');
    const nBtns = container.querySelectorAll('.diari-pag-n');

    if (prevBtn) prevBtn.onclick = () => { df_currentPage--; updateChecklistUI(); };
    if (nextBtn) nextBtn.onclick = () => { df_currentPage++; updateChecklistUI(); };
    nBtns.forEach(btn => btn.onclick = (e) => {
        df_currentPage = parseInt(e.target.innerText);
        updateChecklistUI();
    });
}

function setupChecklistActions() {
    // Eliminar
    const deleteBtns = document.querySelectorAll('button[data-fav-delete]');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToDel = btn.dataset.favDelete;
            AuthService.toggleFavorite(idToDel); // Esto lo quita porque ya está en la lista
            AppState.currentUser = AuthService.getCurrentUser(); // Sincronizar en memoria
            df_currentUserFavorites = AppState.currentUser.favoritos;
            updateChecklistUI();
        });
    });

    // Add to diary
    const addBtns = document.querySelectorAll('button[data-fav-add]');
    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToAdd = btn.dataset.favAdd;
            const modal = document.getElementById('diary-modal');
            const select = document.getElementById('diary-plant-select');
            const searchInput = document.getElementById('diary-plant-search');
            const btnClear = document.getElementById('btn-clear-plant');

            if (modal && select) {
                select.value = idToAdd;

                // Buscar el nombre de la planta para mostrarlo en el buscador
                const plantObj = AppState.plants.find(p => {
                    const id = p.item ? p.item['@id'] : p['@id'];
                    return id === idToAdd;
                });
                if (plantObj && searchInput) {
                    const p = plantObj.item || plantObj;
                    searchInput.value = p.alternateName || p.name;
                    if (btnClear) btnClear.classList.remove('hidden');
                }

                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                document.getElementById('diary-date').value = now.toISOString().slice(0, 16);
                modal.classList.remove('hidden');
            }
        });
    });
}

// --- ACHIEVEMENTS LOGIC ---
function renderAchievements(logros) {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    // Separar el progreso general del resto de logros
    const progresoGeneral = logros.find(l => l.id === "progreso_general");
    const otrosLogros = logros.filter(l => l.id !== "progreso_general");

    // Función auxiliar para calcular el stroke-dashoffset del SVG
    const getStrokeDashOffset = (porcentaje) => {
        const circumference = 150.8; // 2 * PI * r (r=24)
        return circumference - (porcentaje / 100) * circumference;
    };

    container.innerHTML = `
        <div class="flex flex-col gap-6 p-6 rounded-xl bg-background-dark border border-white/10">
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h3 class="text-xl font-bold">
                        <span class="material-symbols-outlined text-primary mr-2 align-middle">analytics</span>
                        Progrés Detallat
                    </h3>
                </div>
            </div>
            
            <!-- Barra de progreso general -->
            ${progresoGeneral ? `
            <div class="space-y-2">
                <div class="flex justify-between items-end">
                    <span class="text-sm font-bold uppercase tracking-wider text-primary">Progrés de la Col·lecció</span>
                    <span class="text-xs font-bold">
                        <span class="text-primary">${progresoGeneral.obtenido}</span> / ${progresoGeneral.total} espècies trobades
                    </span>
                </div>
                <div class="w-full h-3 bg-background-dark rounded-full overflow-hidden border border-white/10">
                    <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${progresoGeneral.porcentaje}%"></div>
                </div>
            </div>
            ` : ''}

            <!-- Grid de logros circulares -->
            <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4 mt-4">
                ${otrosLogros.map(logro => `
                    <div class="bg-surface dark:bg-surface border border-slate-200 dark:border-white/10 p-3 rounded-xl flex flex-col items-center text-center group relative cursor-help" title="${logro.descripcion}">
                        <div class="relative w-14 h-14 mb-2">
                            <svg class="w-full h-full transform -rotate-90">
                                <circle class="text-slate-200 dark:text-background-dark" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" stroke-width="4"></circle>
                                <circle class="text-primary transition-all duration-1000" cx="28" cy="28" fill="transparent" r="24" stroke="currentColor" stroke-dasharray="150.8" stroke-dashoffset="${getStrokeDashOffset(logro.porcentaje)}" stroke-width="4" stroke-linecap="round"></circle>
                            </svg>
                            <span class="absolute inset-0 flex items-center justify-center font-bold text-[10px]">${logro.porcentaje}%</span>
                        </div>
                        <h3 class="text-[9px] font-bold uppercase tracking-tight">${logro.titulo}</h3>
                        <!-- Tooltip básico por defecto usando title, opcionalmente podrías añadir tu propio div de tooltip aquí -->
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// --- MAPA DE DIARIO LOGIC ---
let diaryMapInstance = null;

function initDiaryMap(diarioEntries) {
    const mapContainer = document.getElementById('diary-map');
    if (!mapContainer) return;

    // Asegurarse de que los estilos del mapa estén inyectados
    injectMapStyles();

    // Destruir mapa si ya existe
    if (diaryMapInstance) {
        diaryMapInstance.remove();
    }

    // Configuración base de Balears si no hay entradas, de lo contrario ajustaremos después
    const defaultCenter = [39.5716, 2.6505];
    const defaultZoom = 8;

    // Configurar mapa de Leaflet
    diaryMapInstance = L.map('diary-map', {
        zoomControl: false, // se pueden añadir controles personalizados
        dragging: true,
        scrollWheelZoom: false // Para evitar que interfiera con el scroll de la página de diario
    }).setView(defaultCenter, defaultZoom);

    // Añadir controles de zoom personalizados
    L.control.zoom({ position: 'bottomright' }).addTo(diaryMapInstance);

    // Añadir controles extras (Ubicación y Capas)
    diaryMapInstance.addControl(new LocationControl({ position: 'bottomright' }));

    const layerSwitcher = new LayerSwitcherControl({ position: 'bottomleft' });
    diaryMapInstance.addControl(layerSwitcher);

    // Habilitar zoom con rueda del ratón solo al hacer clic en el mapa
    diaryMapInstance.on('click', () => {
        diaryMapInstance.scrollWheelZoom.enable();
    });
    diaryMapInstance.on('mouseout', () => {
        diaryMapInstance.scrollWheelZoom.disable();
    });

    // Añadir capa
    const baseLayer = L.tileLayer(TILE_LAYER_CONFIG.url, TILE_LAYER_CONFIG.options).addTo(diaryMapInstance);
    layerSwitcher.setInitialLayer(baseLayer);

    // Variables para bounding box
    const bounds = [];

    // Añadir marcadores
    diarioEntries.forEach(entry => {
        if (entry.ubicacion && entry.ubicacion.latitude && entry.ubicacion.longitude) {
            const coords = [entry.ubicacion.latitude, entry.ubicacion.longitude];
            bounds.push(coords);

            // Obtener info básica de la planta para el popup (si está en la store)
            const plantData = AppState.plants.find(p => {
                const idToCheck = p.item ? p.item["@id"] : p["@id"];
                return idToCheck === entry.plantaId;
            });
            const pObj = plantData?.item || plantData;

            const plantName = pObj ? (pObj.alternateName || pObj.name) : "Planta Desconeguda";

            const marker = L.marker(coords, { icon: createPlantIcon(28) }).addTo(diaryMapInstance);

            // Popup si hay datos
            marker.bindPopup(`
                <div class="text-center p-1">
                    <h4 class="font-bold text-sm text-green-400 mb-1">${plantName}</h4>
                    <p class="text-xs text-gray-300">Data: ${new Date(entry.fecha).toLocaleDateString()}</p>
                    <p class="text-[10px] text-gray-400 mt-1">${entry.ubicacion.name || ''}</p>
                </div>
            `, {
                closeButton: false,
                className: 'custom-popup rounded-xl overflow-hidden'
            });
        }
    });

    // Ajustar zoom si hay marcadores
    if (bounds.length > 0) {
        diaryMapInstance.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
    }
}

// Función para configurar el toggle de minimizar/maximizar del mapa
function setupMapToggle() {
    const toggleBtn = document.getElementById('map-toggle-btn');
    const mapContainer = document.getElementById('diary-map-container');

    if (!toggleBtn || !mapContainer) return;

    toggleBtn.addEventListener('click', () => {
        df_mapIsMinimized = !df_mapIsMinimized;

        if (df_mapIsMinimized) {
            // Minimizar mapa
            mapContainer.classList.remove(df_mapNormalHeight);
            mapContainer.classList.add(df_mapMinimizedHeight);
            toggleBtn.querySelector('span').innerText = 'unfold_more';
            toggleBtn.setAttribute('title', 'Maximizar mapa');

            // Desabilitar interacción con el mapa cuando está minimizado
            if (diaryMapInstance) {
                diaryMapInstance.dragging.disable();
                diaryMapInstance.touchZoom.disable();
                diaryMapInstance.doubleClickZoom.disable();
            }
        } else {
            // Maximizar mapa
            mapContainer.classList.remove(df_mapMinimizedHeight);
            mapContainer.classList.add(df_mapNormalHeight);
            toggleBtn.querySelector('span').innerText = 'unfold_less';
            toggleBtn.setAttribute('title', 'Minimizar mapa');

            // Reabilitar interacción con el mapa cuando está maximizado
            if (diaryMapInstance) {
                diaryMapInstance.dragging.enable();
                diaryMapInstance.touchZoom.enable();
                diaryMapInstance.doubleClickZoom.enable();
            }

            // Ajustar tamaño del mapa tras la transición CSS
            setTimeout(() => {
                if (diaryMapInstance) {
                    diaryMapInstance.invalidateSize();
                }
            }, 300); // Esperar a que termine la transición CSS
        }
    });
}

// --- DIARI D'ACTIVITAT LOGIC ---

function updateDiaryUI() {
    const listContainer = document.getElementById('diari-entries-list');
    const paginationContainer = document.getElementById('diary-pagination');
    if (!listContainer) return;

    // 1. Mapejar les entrades amb les dades de les plantes
    const mappedEntries = df_currentUserDiary.map(entry => {
        const plantData = AppState.plants.find(p => {
            const idToCheck = p.item ? p.item["@id"] : p["@id"];
            return idToCheck === entry.plantaId;
        });
        return {
            ...entry,
            plantaDetails: plantData?.item || plantData || null
        };
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Ordenar per data més recent

    // 2. Paginar
    const totalPages = Math.ceil(mappedEntries.length / df_diaryItemsPerPage) || 1;
    if (df_currentDiaryPage > totalPages) df_currentDiaryPage = totalPages;

    const startIndex = (df_currentDiaryPage - 1) * df_diaryItemsPerPage;
    const paginatedItems = mappedEntries.slice(startIndex, startIndex + df_diaryItemsPerPage);

    // 3. Renderitzar Llista
    if (paginatedItems.length === 0) {
        listContainer.innerHTML = `<div class="p-6 text-center text-slate-500 text-sm italic">Encara no s'ha registrat cap activitat.</div>`;
    } else {
        listContainer.innerHTML = paginatedItems.map(entry => renderDiaryEntryItem(entry)).join('');
    }

    // 4. Renderitzar Paginació
    renderDiaryPagination(paginationContainer, totalPages);
}

function renderDiaryEntryItem(entry) {
    const p = entry.plantaDetails;

    // Extraiem la imatge original de la planta si no n'hi ha cap de l'usuari
    let fallbackImgUrl = 'img/placeholder.jpg';
    if (p) {
        if (Array.isArray(p.image) && p.image.length > 0) {
            fallbackImgUrl = p.image[0].contentUrl || fallbackImgUrl;
        } else if (typeof p.image === 'string') {
            fallbackImgUrl = p.image;
        }
    }

    // Apliquem la miniatura _400_thumb_webp al fallback de l'api si n'hi ha, si no el que doni la bbdd per a l'entrada
    let thumbUrl = fallbackImgUrl.replace('_2000.webp', '_400_thumb.webp');
    const imgSrc = entry.imagen || thumbUrl;

    // Noms
    const nomComu = p ? (p.alternateName || p.name) : "Planta Desconeguda";
    const nomCientific = p ? p.name : "";

    // Dades addicionals
    const dateStr = entry.fecha ? new Date(entry.fecha).toLocaleDateString() : 'Sense data';
    const locationStr = entry.ubicacion ? (entry.ubicacion.name || `${entry.ubicacion.latitude}, ${entry.ubicacion.longitude}`) : 'Ubicació desconeguda';
    const notes = entry.observaciones || "Sense observacions.";

    return `
    <article class="flex flex-col md:flex-row gap-4 bg-surface rounded-xl border border-white/10 overflow-hidden p-4 group hover:border-primary/50 transition-colors">
        <div class="md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onclick="if('${p?.['@id']}') window.navigateSPA('plant-detail', '${p?.['@id']}');">
            <img alt="${nomComu}" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" src="${imgSrc}" />
        </div>
        <div class="flex-1 flex flex-col justify-between">
            <div class="space-y-2">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-lg text-white cursor-pointer hover:text-primary transition-colors" onclick="if('${p?.['@id']}') window.navigateSPA('plant-detail', '${p?.['@id']}');">${nomComu}</h4>
                        <p class="text-xs italic text-primary -mt-1 mb-1 font-medium">${nomCientific}</p>
                        <div class="flex items-center gap-2 text-xs text-forest-neutral-700 font-medium">
                            <span class="material-symbols-outlined text-xs">calendar_today</span> ${dateStr}
                            <span class="material-symbols-outlined text-xs ml-2">location_on</span> ${locationStr}
                        </div>
                    </div>
                    <button class="text-slate-400 hover:text-primary transition-colors p-1" title="Més opcions">
                        <span class="material-symbols-outlined">more_vert</span>
                    </button>
                </div>
                <div class="p-3 bg-slate-900/30 rounded-lg text-sm text-slate-400 mt-2">
                    <p class="italic">"${notes}"</p>
                </div>
            </div>
            <!-- Si hubiese condiciones meterlas aquí, tal y como había en el prototipo -->
            <div class="flex gap-4 mt-3">
                <span class="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold bg-background-dark px-2 py-1 rounded">
                    <span class="material-symbols-outlined text-sm">eco</span> Registrat
                </span>
            </div>
        </div>
    </article>`;
}

function renderDiaryPagination(container, totalPages) {
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let pHTML = `
        <button class="flex items-center justify-center rounded-lg h-10 w-10 bg-surface text-primary hover:bg-primary hover:text-white transition-colors diari-entries-prev" ${df_currentDiaryPage === 1 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>
            <span class="material-symbols-outlined">chevron_left</span>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        const activeCls = i === df_currentDiaryPage
            ? 'bg-primary text-white font-bold'
            : 'bg-surface text-primary hover:bg-primary hover:text-white font-bold transition-colors';

        pHTML += `<button class="flex items-center justify-center rounded-lg h-10 w-10 text-sm diari-entries-n ${activeCls}" data-page="${i}">${i}</button>`;
    }

    pHTML += `
        <button class="flex items-center justify-center rounded-lg h-10 w-10 bg-surface text-primary hover:bg-primary hover:text-white transition-colors diari-entries-next" ${df_currentDiaryPage === totalPages ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>
            <span class="material-symbols-outlined">chevron_right</span>
        </button>
    `;

    container.innerHTML = pHTML;

    // Vincular Eventos de paginación
    const prevBtn = container.querySelector('.diari-entries-prev');
    const nextBtn = container.querySelector('.diari-entries-next');
    const nBtns = container.querySelectorAll('.diari-entries-n');

    if (prevBtn) prevBtn.onclick = () => { df_currentDiaryPage--; updateDiaryUI(); };
    if (nextBtn) nextBtn.onclick = () => { df_currentDiaryPage++; updateDiaryUI(); };
    nBtns.forEach(btn => btn.onclick = (e) => {
        df_currentDiaryPage = parseInt(e.target.innerText);
        updateDiaryUI();
    });
}

function setupPlantAutocomplete() {
    const searchInput = document.getElementById('diary-plant-search');
    const hiddenInput = document.getElementById('diary-plant-select');
    const resultsContainer = document.getElementById('diary-plant-results');
    const btnClear = document.getElementById('btn-clear-plant');

    if (!searchInput || !hiddenInput || !resultsContainer) return;

    const showMatches = (query) => {
        const matches = AppState.plants.filter(p => {
            const pObj = p.item || p;
            const name = pObj.name.toLowerCase();
            const altName = (pObj.alternateName || '').toLowerCase();
            return name.includes(query) || altName.includes(query);
        });

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div class="p-3 text-xs text-slate-500 italic">No s'han trobat plantes</div>`;
        } else {
            resultsContainer.innerHTML = matches.map(p => {
                const pObj = p.item || p;
                let imageUrl = '';
                if (Array.isArray(pObj.image) && pObj.image.length > 0) {
                    imageUrl = pObj.image[0].contentUrl || '';
                } else if (typeof pObj.image === 'string') {
                    imageUrl = pObj.image;
                }
                const thumbUrl = imageUrl ? imageUrl.replace('_2000.webp', '_100_icon.webp') : 'img/placeholder.jpg';

                return `
                    <div class="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-white/5 last:border-none" data-id="${pObj['@id']}" data-name="${pObj.alternateName || pObj.name}">
                        <img src="${thumbUrl}" class="size-8 rounded object-cover border border-white/10" loading="lazy">
                        <div class="flex-1 overflow-hidden">
                            <p class="text-xs font-bold text-slate-200 truncate">${pObj.alternateName || pObj.name}</p>
                            <p class="text-[9px] text-slate-500 italic truncate">${pObj.name}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }
        resultsContainer.classList.remove('hidden');
    };

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length === 0) {
            resultsContainer.classList.add('hidden');
            hiddenInput.value = '';
            if (btnClear) btnClear.classList.add('hidden');
            return;
        }
        showMatches(query);
    });

    searchInput.addEventListener('focus', () => {
        const query = searchInput.value.toLowerCase().trim();
        showMatches(query);
    });

    resultsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('[data-id]');
        if (item) {
            const plantId = item.dataset.id;
            const plantName = item.dataset.name;

            hiddenInput.value = plantId;
            searchInput.value = plantName;
            resultsContainer.classList.add('hidden');
            if (btnClear) btnClear.classList.remove('hidden');
        }
    });

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            hiddenInput.value = '';
            searchInput.value = '';
            btnClear.classList.add('hidden');
            resultsContainer.classList.add('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add('hidden');
        }
    });
}

function setupDiaryModal() {
    const modal = document.getElementById('diary-modal');
    setupPlantAutocomplete();
    const btnOpen = document.getElementById('btn-nou-registre');
    const btnClose = document.getElementById('btn-close-diary-modal');
    const form = document.getElementById('diary-form');
    const btnGeolocate = document.getElementById('btn-geolocate');

    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('diary-date').value = now.toISOString().slice(0, 16);
            if (modal) modal.classList.remove('hidden');
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            if (modal) modal.classList.add('hidden');
        });
    }

    if (btnGeolocate) {
        btnGeolocate.addEventListener('click', () => {
            if ("geolocation" in navigator) {
                btnGeolocate.innerHTML = `<span class="material-symbols-outlined text-[14px] animate-spin">refresh</span> Cercant...`;
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById('diary-lat').value = position.coords.latitude.toFixed(6);
                        document.getElementById('diary-lng').value = position.coords.longitude.toFixed(6);
                        btnGeolocate.innerHTML = `<span class="material-symbols-outlined text-[14px]">check_circle</span> Geolocalitzat`;
                        setTimeout(() => {
                            btnGeolocate.innerHTML = `<span class="material-symbols-outlined text-[14px]">my_location</span> Utilitzar la meva ubicació`;
                        }, 2000);
                    },
                    (error) => {
                        btnGeolocate.innerHTML = `<span class="material-symbols-outlined text-[14px] text-red-500">error</span> Error`;
                        console.error("Error geolocating:", error);
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                alert("Geolocalització no suportada en aquest navegador.");
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const plantId = document.getElementById('diary-plant-select').value;
            const date = document.getElementById('diary-date').value;
            const locName = document.getElementById('diary-loc-name').value;
            const lat = parseFloat(document.getElementById('diary-lat').value);
            const lng = parseFloat(document.getElementById('diary-lng').value);
            const obs = document.getElementById('diary-obs').value;

            if (!plantId || !date || !locName || isNaN(lat) || isNaN(lng)) {
                alert("Si us plau, omple tots els camps obligatoris correctament.");
                return;
            }

            const plantObj = AppState.plants.find(p => {
                const id = p.item ? p.item['@id'] : p['@id'];
                return id === plantId;
            });
            const p = plantObj.item || plantObj;

            const entryData = {
                plantaId: plantId,
                plantaName: p.alternateName || p.name,
                fecha: date, // Formato "YYYY-MM-DDTHH:mm"
                ubicacion: {
                    nombre: locName,
                    lat: lat,
                    lng: lng
                },
                observaciones: obs,
                foto_url: (p.image && p.image.length > 0) ? p.image[0].contentUrl : (typeof p.image === 'string' ? p.image : "")
            };

            const updatedUser = AuthService.addDiaryEntry(entryData);

            // Re-sync local state and update UI
            AppState.currentUser = updatedUser;
            df_currentUserDiary = updatedUser.diario;
            df_currentUserFavorites = updatedUser.favoritos;

            updateChecklistUI();
            updateDiaryUI();
            // TODO: fix issue with renderAchievements not being defined if it's not exported/imported properly. Wait, it's defined in diary.js!
            // Wait, yes, renderAchievements is in diary.js, let me check. Ah, I don't know where it's defined, but it was called earlier.

            // For now, let's just trigger a re-init or call the specific map/achievement functions.
            // Actually, we can just call it since it's probably in diary.js
            if (typeof renderAchievements === 'function') renderAchievements(updatedUser.logros);
            initDiaryMap(updatedUser.diario);

            if (modal) modal.classList.add('hidden');
            form.reset();
            const btnClear = document.getElementById('btn-clear-plant');
            if (btnClear) btnClear.classList.add('hidden');
        });
    }
}

