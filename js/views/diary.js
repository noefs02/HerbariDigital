import { AppState } from '../app.js';
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, LayerSwitcherControl, injectMapStyles } from '../components/mapUtils.js';

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
                            <button class="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors">
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
        const response = await fetch('data/users.json');
        const data = await response.json();
        const user = data.users[0]; // Usamos el primer usuario como prueba

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

    if(prevBtn) prevBtn.onclick = () => { df_currentPage--; updateChecklistUI(); };
    if(nextBtn) nextBtn.onclick = () => { df_currentPage++; updateChecklistUI(); };
    nBtns.forEach(btn => btn.onclick = (e) => {
        df_currentPage = parseInt(e.target.innerText);
        updateChecklistUI();
    });
}

function setupChecklistActions() {
    // Ejemplo de interactivdad: "Eliminar" (Sólo visual, modificar el array y repintar)
    const deleteBtns = document.querySelectorAll('button[data-fav-delete]');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToDel = btn.dataset.favDelete;
            df_currentUserFavorites = df_currentUserFavorites.filter(f => f.plantaId !== idToDel);
            updateChecklistUI();
            
            // Aquí en una app real enviaríamos el Update a Firebase/Servidor
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

    if(prevBtn) prevBtn.onclick = () => { df_currentDiaryPage--; updateDiaryUI(); };
    if(nextBtn) nextBtn.onclick = () => { df_currentDiaryPage++; updateDiaryUI(); };
    nBtns.forEach(btn => btn.onclick = (e) => {
        df_currentDiaryPage = parseInt(e.target.innerText);
        updateDiaryUI();
    });
}

