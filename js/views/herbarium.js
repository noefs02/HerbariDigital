import { renderSidebar } from '../components/sidebar.js';

export function renderHerbarium(plants) {
    // Esqueleto mínimo para la vista Herbario
    return `
        <div id="herbarium-view" class="view-container flex h-full items-start">
            ${renderSidebar()}
            <main class="flex-1 p-6 lg:p-10 overflow-y-auto">
                <div class="max-w-6xl mx-auto">
                    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h2 class="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Herbari de les
                                Illes Balears</h2>
                            <p class="text-slate-500 text-lg max-w-2xl">Explora la riquesa botànica única del nostre
                                arxipèlag mediterrani des d'una perspectiva científica i visual.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export function renderPlantGrid(plants) {
    return ``;
}