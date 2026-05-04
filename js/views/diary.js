import { AppState } from '../app.js';

export function renderDiary(diaries) {
    // Esqueleto mínimo para la vista Diario
    return `
        <div id="diary-view" class="view-container">
            <section id="diari-checklist">
                <!-- Checklist irá aquí -->
            </section>
            
            <section id="diari-entries">
                <!-- Entradas del diario irán aquí -->
            </section>
        </div>
    `;
}

export function initDiaryEvents() {
    // Lógica vacía por ahora
}