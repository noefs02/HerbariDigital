// Estado global de la aplicación
const AppState = {
    plants: [],
    currentRoute: 'home',
    diaries: []
};

// ─── 1. LÓGICA DE ESTACIONES (De tu prototipo) ───
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

function setSeason(seasonId) {
    document.documentElement.setAttribute('data-season', seasonId);
    localStorage.setItem('herbari-season', seasonId);
    
    const season = SEASONS.find(s => s.id === seasonId);
    if (!season) return;
    
    // Actualizar botón del header
    const btnIcon = document.getElementById('season-btn-icon');
    const btnLabel = document.getElementById('season-btn-label');
    if(btnIcon) btnIcon.textContent = season.icon;
    if(btnLabel) btnLabel.textContent = season.label;
    
    // Actualizar clases activas en el menú desplegable
    document.querySelectorAll('.season-option').forEach(el => {
        if(el.dataset.season === seasonId) el.classList.add('active');
        else el.classList.remove('active');
    });
}

function initSeasonSelector() {
    const currentSeason = localStorage.getItem('herbari-season') || detectSeason();
    const menu = document.getElementById('season-menu');
    
    if(!menu) return; // Si no existe el menú todavía
    
    // Inyectar opciones
    menu.innerHTML = SEASONS.map(s => `
        <button class="season-option" data-season="${s.id}">
            <span class="material-symbols-outlined">${s.icon}</span>
            ${s.label}
        </button>
    `).join('');

    // Eventos para abrir/cerrar y seleccionar
    document.getElementById('season-toggle-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
    });

    menu.addEventListener('click', (e) => {
        const btn = e.target.closest('.season-option');
        if (btn) {
            setSeason(btn.dataset.season);
            menu.classList.remove('open');
        }
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) menu.classList.remove('open');
    });

    setSeason(currentSeason); // Aplicar temporada actual al cargar
}

// Cargar los datos desde el archivo JSON
async function loadData() {
    try {
        const response = await fetch('data/plants.json');
        const data = await response.json();
        AppState.plants = data.plants;
        console.log('Datos de plantas cargados:', AppState.plants);
        
        // Simular carga de diario (desde localStorage si estuviera implementado)
        AppState.diaries = JSON.parse(localStorage.getItem('herbario-diaries')) || [];
    } catch (error) {
        console.error('Error cargando los datos persistentes:', error);
    }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    initSeasonSelector();
    await loadData();
    setupNavigation();
    
    // Cargar la vista inicial
    renderView('home');
});

// Configurar los manejadores de eventos de la barra de navegación
function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Actualizar estilo activo
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const route = link.dataset.route;
            renderView(route);
        });
    });
}

// Router principal para renderizar la vista correspondiente
import { renderHome } from './views/home.js';
import { renderHerbarium } from './views/herbarium.js';
import { renderMap } from './views/map.js';
import { renderDiary } from './views/diary.js';

export function renderView(route, params = {}) {
    AppState.currentRoute = route;
    const contentDiv = document.getElementById('app-content');
    contentDiv.innerHTML = ''; // Limpiar el contenido actual
    
    switch (route) {
        case 'home':
            contentDiv.innerHTML = renderHome();
            break;
        case 'herbarium':
            contentDiv.innerHTML = renderHerbarium(AppState.plants);
            setupHerbariumEvents(AppState.plants);
            break;
        case 'map':
            contentDiv.innerHTML = renderMap();
            setupMap(AppState.plants);
            break;
        case 'diary':
            contentDiv.innerHTML = renderDiary(AppState.diaries);
            setupDiaryEvents();
            break;
        case 'plant-detail':
            const plant = AppState.plants.find(p => p.id === params.id);
            if (plant) {
                import('./views/plantDetail.js').then(module => {
                    contentDiv.innerHTML = module.renderPlantDetail(plant);
                    module.setupPlantDetailEvents();
                });
            }
            break;
        default:
            contentDiv.innerHTML = '<h2>Página no encontrada</h2>';
    }
}

// Exportar estado para que módulos de vistas puedan acceder si es necesario
export { AppState };

// ---- TAREAS PENDIENTES DEL ROUTER (Inicialización Eventos) ---- //

function setupHerbariumEvents(plants) {
    // Filtrado de etiquetas
    const checkboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const activeTags = Array.from(document.querySelectorAll('.sidebar input[type="checkbox"]:checked')).map(c => c.value);
            const filteredPlants = plants.filter(p => {
                if(activeTags.length === 0) return true;
                return activeTags.some(tag => p.etiquetas.includes(tag));
            });
            
            // Re-renderizamos los items de la grid
            import('./views/herbarium.js').then(module => {
                document.querySelector('.plant-grid').innerHTML = module.renderPlantGrid(filteredPlants);
                attachPlantClickEvents();
            });
        });
    });
    
    attachPlantClickEvents();
}

function attachPlantClickEvents() {
    const cards = document.querySelectorAll('.plant-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const id = parseInt(card.dataset.id);
            renderView('plant-detail', { id });
        });
    });
}

function setupMap(plants) {
    import('./views/map.js').then(module => {
        module.initMap(plants);
    });
}

function setupDiaryEvents() {
    import('./views/diary.js').then(module => {
        module.initDiaryEvents();
    });
}
