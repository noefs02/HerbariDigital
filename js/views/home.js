export function renderHome() {
    return `
    <div class="animate-in fade-in max-w-4xl mx-auto py-12 px-4 text-center">
        
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary-light border border-primary/20 mb-6 min-h-[26px]">
            <span class="material-icons text-sm w-4 h-4 flex items-center justify-center">science</span> Investigació Botànica
        </span>
        
        <h2 class="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Explora la Flora de les <span class="text-primary-light">Illes Balears</span>
        </h2>
        
        <p class="text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Benvingut al catàleg científic i visual de la flora autòctona i endemismes de l'arxipèlag balear. 
            Utilitza el menú superior per navegar pel nostre herbari digital, consultar els mapes de distribució o gestionar el teu diari de camp.
        </p>

        <div class="flex flex-wrap justify-center gap-4 min-h-[46px]">
            <button onclick="window.navigateSPA('herbarium')" class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2">
                <span class="material-icons text-base w-5 h-5 flex items-center justify-center">local_florist</span> Obrir l'Herbari
            </button>
            <button onclick="window.navigateSPA('map')" class="px-5 py-2.5 bg-surface hover:bg-white/5 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-white/10 transition-all flex items-center gap-2">
                <span class="material-icons text-base w-5 h-5 flex items-center justify-center">map</span> Veure el Mapa
            </button>
        </div>
    </div>
    `;
}