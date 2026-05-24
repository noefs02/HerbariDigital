// --- js/views/home.js ---

export function renderHome() {
    // Obtenim l'estació actual (definida per la app)
    const activeSeason = document.documentElement.getAttribute('data-season') || localStorage.getItem('herbari-season') || 'primavera';

    // Traduim l'ID intern ('estiu', 'tardor'...) al nom de l'arxiu corresponent
    const seasonFileNames = {
        'primavera': 'primavera',
        'estiu': 'verano',
        'tardor': 'otoño',
        'hivern': 'invierno'
    };

    const imgPrefix = seasonFileNames[activeSeason] || 'primavera';

    // CORRECCIÓN: Optimizado el texto alternativo y aislada la tipografía de material-icons para evitar desajustes visuales
    return `
    <div class="relative flex-1 flex items-center justify-center overflow-hidden">
        
        <img id="home-bg-image" class="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none transition-opacity duration-300"
             alt="Imatge de fons de l'estació de ${imgPrefix}"
             src="media/img/inicio/${imgPrefix}_800.webp"
             srcset="
                media/img/inicio/${imgPrefix}_800.webp 800w,
                media/img/inicio/${imgPrefix}_1200.webp 1200w,
                media/img/inicio/${imgPrefix}_1920.webp 1920w,
                media/img/inicio/${imgPrefix}_2560.webp 2560w
             "
             sizes="100vw"
             loading="eager" />

        <div class="absolute inset-0 bg-gradient-to-b from-transparent to-background-dark/90"></div>

        <div class="relative z-10 animate-in fade-in max-w-4xl mx-auto py-12 px-4 text-center">
            
            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 mb-6 min-h-[26px] backdrop-blur-sm">
                <span class="material-icons text-sm" style="line-height: 1;">science</span> Investigació Botànica
            </span>
            
            <h2 class="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                Explora la Flora de les <span class="text-primary-light">Illes Balears</span>
            </h2>
            
            <p class="text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed drop-shadow">
                Benvingut al catàleg científic i visual de la flora autòctona i endemismes de l'arxipèlag balear. 
                Utilitza el menú superior per navegar pel nostre herbari digital, consultar els mapes de distribució o gestionar el teu diari de camp.
            </p>

            <div class="flex flex-wrap justify-center gap-4 min-h-[46px]">
                <button onclick="window.navigateSPA('herbarium')" class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2">
                    <span class="material-icons text-base" style="line-height: 1;">local_florist</span> Obrir l'Herbari
                </button>
                <button onclick="window.navigateSPA('map')" class="px-5 py-2.5 bg-surface/50 backdrop-blur-md hover:bg-white/10 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-2">
                    <span class="material-icons text-base" style="line-height: 1;">map</span> Veure el Mapa
                </button>
            </div>
        </div>
    </div>
    `;
}