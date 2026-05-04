import { renderView } from '../app.js';

export function renderPlantDetail(plant) {
    // Esqueleto mínimo para la vista de Detalle de Planta
    return `
        <div id="plant-detail-view" class="view-container">
            <button id="btn-back-herbarium">← Volver</button>
            <div id="plant-detail-content">
                <!-- Info de la planta -->
            </div>
        </div>
    `;
}

export function setupPlantDetailEvents() {
    const btn = document.getElementById('btn-back-herbarium');
    if (btn) {
        btn.addEventListener('click', () => {
            renderView('herbarium');
        });
    }
}