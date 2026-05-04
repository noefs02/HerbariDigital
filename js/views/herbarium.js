export function renderHerbarium(plants) {
    // Esqueleto mínimo para la vista Herbario
    return `
        <div id="herbarium-view" class="view-container flex h-full">
            <aside id="app-sidebar" class="w-1/4">
                <!-- Filtros se inyectarán aquí -->
            </aside>
            <section id="herbari-grid" class="w-3/4 p-4 grid">
                <!-- Grid de plantas se inyectará aquí -->
            </section>
        </div>
    `;
}

export function renderPlantGrid(plants) {
    return ``;
}