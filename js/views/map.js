import { renderSidebar } from '../components/sidebar.js';

export function renderMap() {
    const extraContent = `
        <div class="mt-8 pt-4 border-t border-white/10">
             <h2 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">Punts d'Interès</h2>
             <p class="text-xs text-slate-400 px-1">Més controls per al mapa aniran aquí.</p>
        </div>
    `;

    // Esqueleto mínimo para la vista Mapa
    return `
        <div id="map-view" class="view-container h-full relative flex">
            ${renderSidebar(extraContent)}
            
        </div>
    `;
}

export function initMap(plants) {
    // Lógica vacía por ahora
}