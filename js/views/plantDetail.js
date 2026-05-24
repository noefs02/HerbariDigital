import { AppState } from '../app.js';
import { renderPlantTags } from './herbarium.js';
import { YouTubeHandler } from '../components/youtubeService.js'; // IMPORTACIÓN DEL SERVICIO
import { CustomVideoHandler } from '../components/customVideo.js'; // IMPORTACIÓN REPRODUCTOR PROPIO
import { CustomAudioHandler } from '../components/customAudio.js'; // IMPORTACIÓN REPRODUCTOR AUDIO
import { TILE_LAYER_CONFIG, createPlantIcon, LocationControl, LayerSwitcherControl, injectMapStyles } from '../components/mapUtils.js';
import { SpeechService } from '../components/speechService.js';
import { AuthService } from '../services/authService.js';

let detailMapInstance = null;
const ytHandler = new YouTubeHandler(); // INSTANCIA DEL GESTOR GLOBAL
const localVideoHandler = new CustomVideoHandler(); // INSTANCIA DEL REPRODUCTOR LOCAL
const localAudioHandler = new CustomAudioHandler(); // INSTANCIA DEL REPRODUCTOR AUDIO
const speechService = new SpeechService();

export function stopPlantTTS() {
    speechService.stop();
}

export async function initDetailMap(plant) {
    const mapContainer = document.getElementById('detail-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // --- LIMPIEZA ---
    if (detailMapInstance) { detailMapInstance.remove(); detailMapInstance = null; }
    if (window._detailMapOutsideClick) {
        document.removeEventListener('click', window._detailMapOutsideClick);
        window._detailMapOutsideClick = null;
    }

    // --- ESTILOS CENTRALIZADOS ---
    injectMapStyles();

    const coordsProp = plant.additionalProperty?.find(prop => prop.name === 'Coordenades');
    const coords = coordsProp ? coordsProp.value : [];

    if (coords.length === 0) {
        mapContainer.innerHTML = `<div class="absolute inset-0 flex items-center justify-center bg-forest-neutral-900 text-slate-500 text-xs italic">No hi ha dades de localització.</div>`;
    } else {
        // --- INICIALIZACIÓN ---
        detailMapInstance = L.map('detail-map', {
            zoomControl: false, // DESACTIVAMOS el nativo para controlarlo nosotros
            scrollWheelZoom: false,
            dragging: !L.Browser.mobile,
            tap: !L.Browser.mobile
        }).setView([coords[0].latitude, coords[0].longitude], 8);

        // --- GESTIÓN DE ENFOQUE Y SCROLL DE RUEDA ---
        // Al hacer clic dentro del mapa, se activa el zoom de la rueda del ratón (sin línea verde)
        detailMapInstance.on('click', () => {
            detailMapInstance.scrollWheelZoom.enable();
        });

        // Al hacer clic fuera del contenedor del mapa, se desactiva el zoom de la rueda
        window._detailMapOutsideClick = (e) => {
            if (mapContainer && !mapContainer.contains(e.target)) {
                if (detailMapInstance) {
                    detailMapInstance.scrollWheelZoom.disable();
                }
            }
        };
        document.addEventListener('click', window._detailMapOutsideClick);

        // --- CONTROLES ALINEADOS (de dalt a baix a topleft) ---
        const layerSwitcher = new LayerSwitcherControl({ position: 'topleft' });
        detailMapInstance.addControl(layerSwitcher);
        L.control.zoom({ position: 'topleft' }).addTo(detailMapInstance);
        detailMapInstance.addControl(new LocationControl({ position: 'topleft' }));

        const initialTileLayer = L.tileLayer(TILE_LAYER_CONFIG.url, TILE_LAYER_CONFIG.options).addTo(detailMapInstance);
        layerSwitcher.setInitialLayer(initialTileLayer);

        // Marcadores con texto de coordenadas resaltado
        coords.forEach(coord => {
            const icon = createPlantIcon(24);
            const detailPopupContent = `
                <div class="flex flex-col gap-1.5 px-1 py-1">
                    <div class="flex items-center gap-1.5 text-white">
                        <span class="material-symbols-outlined text-primary text-[16px]">location_on</span>
                        <span class="font-black text-sm tracking-tight">${coord.name}</span>
                    </div>
                    <div class="pl-6 text-[12px] text-slate-100 font-mono font-bold tracking-wide">
                        Lat: ${coord.latitude.toFixed(4)} <span class="text-primary/50">/</span> Lng: ${coord.longitude.toFixed(4)}
                    </div>
                </div>
            `;

            L.marker([coord.latitude, coord.longitude], { icon: icon })
                .addTo(detailMapInstance)
                .bindPopup(detailPopupContent, {
                    className: 'detail-popup',
                    closeButton: false,
                    offset: [0, -5]
                })
                .on('mouseover', function () { this.openPopup(); })
                .on('mouseout', function () { this.closePopup(); });
        });

        setTimeout(() => detailMapInstance.invalidateSize(), 300);
    }

    // --- INICIALITZACIÓ VÍDEO ---
    // Detectem els dos possibles orígens de vídeo independentment
    const videoIdProp = plant.additionalProperty?.find(p => p.name === 'VideoID')?.value || null;
    const localVideoUrl = videoIdProp && !videoIdProp.includes('youtube.com') && !videoIdProp.includes('youtu.be')
        ? videoIdProp : null;

    // Acomodem el nou esquema JSON: subjectOf pot ser un array o un objecte
    const subjectOfArray = Array.isArray(plant.subjectOf) ? plant.subjectOf : (plant.subjectOf ? [plant.subjectOf] : []);
    const videoObj = subjectOfArray.find(s => s['@type'] === 'VideoObject');

    const youtubeUrl = videoObj?.embedUrl
        || (videoIdProp && (videoIdProp.includes('youtube.com') || videoIdProp.includes('youtu.be')) ? videoIdProp : null)
        || null;

    // Prioritat: vídeo local > YouTube
    if (localVideoUrl) {
        const localContainer = document.getElementById('video-wrapper');
        if (localContainer) localVideoHandler.init('video-wrapper');
    } else if (youtubeUrl) {
        const videoContainer = document.getElementById('youtube-player-api');
        if (videoContainer) {
            await ytHandler.loadAPI();
            ytHandler.loadVideo(youtubeUrl, videoContainer);
        }
    }

    // --- INICIALITZACIÓ ÀUDIO ---
    const audioContainer = document.getElementById('audio-player-container');
    if (audioContainer) {
        localAudioHandler.init('audio-player-container');
    }

    // --- INICIALITZACIÓ SPEECH API (TTS) ---
    const ttsBtn = document.getElementById('tts-toggle-btn');
    if (ttsBtn) {
        const ttsIcon = document.getElementById('tts-icon');
        const ttsText = document.getElementById('tts-btn-text');

        ttsBtn.addEventListener('click', () => {
            if (speechService.isSpeaking()) {
                speechService.stop();
                if (ttsIcon) ttsIcon.textContent = 'volume_up';
                if (ttsText) ttsText.textContent = 'Llegeix descripció';
                ttsBtn.classList.remove('border-primary', 'bg-primary/10', 'text-white');
            } else {
                speechService.speak(plant.description, {
                    onStart: () => {
                        if (ttsIcon) ttsIcon.textContent = 'volume_off';
                        if (ttsText) ttsText.textContent = 'Atura lectura';
                        ttsBtn.classList.add('border-primary', 'bg-primary/10', 'text-white');
                    },
                    onEnd: () => {
                        if (ttsIcon) ttsIcon.textContent = 'volume_up';
                        if (ttsText) ttsText.textContent = 'Llegeix descripció';
                        ttsBtn.classList.remove('border-primary', 'bg-primary/10', 'text-white');
                    },
                    onError: () => {
                        if (ttsIcon) ttsIcon.textContent = 'volume_up';
                        if (ttsText) ttsText.textContent = 'Llegeix descripció';
                        ttsBtn.classList.remove('border-primary', 'bg-primary/10', 'text-white');
                    }
                });
            }
        });
    }
}

/**
 * Lògica de Stitch: Presència a les Illes
 */
function renderIslandPresence(illaString = "") {
    const illes = [
        { key: 'mallorca', nom: 'Mallorca' },
        { key: 'cabrera', nom: 'Cabrera' },
        { key: 'menorca', nom: 'Menorca' },
        { key: 'eivissa', nom: 'Eivissa' },
        { key: 'formentera', nom: 'Formentera' }
    ];
    return illes.map(illa => {
        const present = illaString.toLowerCase().includes(illa.key.toLowerCase())
            || illaString.toLowerCase().includes('totes');

        const bg = present ? 'bg-forest-neutral-900 border-forest-neutral-700' : 'bg-background-dark border-white/10 opacity-40';
        const textCls = present ? 'text-white' : 'text-forest-neutral-500';
        const icon = present
            ? '<span class="material-symbols-outlined text-primary text-xl" style=\'font-variation-settings: "FILL" 1;\'>check_circle</span>'
            : '<span class="material-symbols-outlined text-forest-neutral-600 text-xl">cancel</span>';

        return `
        <div class="flex flex-col items-center justify-center py-3 px-2 rounded-lg ${bg} border transition-colors">
            <span class="text-[9px] font-bold uppercase tracking-wider ${textCls} mb-1.5">${illa.nom}</span>
            ${icon}
        </div>`;
    }).join('');
}

/**
 * Lògica de Stitch: Targeta de Conservació
 */
function renderConservationCard(status = "") {
    let colorClasses = {
        cardBg: 'bg-emerald-500/10',
        cardBorder: 'border-emerald-500/20',
        textLight: 'text-emerald-400',
        progressBg: 'bg-emerald-600',
        textDark: 'text-emerald-600'
    };
    let label = 'Segura', percent = 20, desc = 'Poblacions estables.';

    if (status.includes('Crític')) {
        colorClasses = {
            cardBg: 'bg-red-500/10',
            cardBorder: 'border-red-500/20',
            textLight: 'text-red-400',
            progressBg: 'bg-red-600',
            textDark: 'text-red-600'
        };
        label = 'En Perill Crític'; percent = 95; desc = 'Risc extrem d\'extinció en estat silvestre.';
    } else if (status.includes('Perill')) {
        colorClasses = {
            cardBg: 'bg-red-500/10',
            cardBorder: 'border-red-500/20',
            textLight: 'text-red-400',
            progressBg: 'bg-red-600',
            textDark: 'text-red-600'
        };
        label = 'En Perill'; percent = 85; desc = 'Risc elevat d\'extinció en estat silvestre.';
    } else if (status.includes('Vulnerable')) {
        colorClasses = {
            cardBg: 'bg-amber-500/10',
            cardBorder: 'border-amber-500/20',
            textLight: 'text-amber-400',
            progressBg: 'bg-amber-600',
            textDark: 'text-amber-600'
        };
        label = 'Vulnerable'; percent = 65; desc = 'Vulnerable a l\'extinció si no es prenen mesures.';
    } else if (status.includes('Protegida')) {
        colorClasses = {
            cardBg: 'bg-orange-500/10',
            cardBorder: 'border-orange-500/20',
            textLight: 'text-orange-400',
            progressBg: 'bg-orange-600',
            textDark: 'text-orange-600'
        };
        label = 'Protegida'; percent = 50; desc = 'Sota regulació especial per evitar el seu declivi.';
    }

    return `
    <div class="${colorClasses.cardBg} rounded-xl border ${colorClasses.cardBorder} p-6">
        <div class="flex items-center gap-2 ${colorClasses.textLight} mb-3">
            <span class="material-symbols-outlined">warning</span>
            <h4 class="font-bold text-lg">Estat de conservació</h4>
        </div>
        <p class="text-sm text-forest-neutral-300 mb-4 italic leading-relaxed">"${desc}"</p>
        <div class="w-full bg-forest-neutral-800 h-2 rounded-full overflow-hidden">
            <div class="${colorClasses.progressBg} h-full" style="width:${percent}%"></div>
        </div>
        <p class="text-[10px] mt-2 text-right uppercase font-bold ${colorClasses.textDark}">${status || label}</p>
    </div>`;
}

/**
 * Renderitza les targetes de plantes relacionades
 */
function renderRelatedCards(currentId) {
    const getPropVal = (plantObj, name) => plantObj?.additionalProperty?.find(prop => prop.name === name)?.value || '';

    const currentPlantEntry = AppState.plants.find(p => {
        const id = p.item ? p.item['@id'] : p['@id'];
        return id === currentId;
    });
    const currentPlant = currentPlantEntry ? (currentPlantEntry.item || currentPlantEntry) : null;

    const curStatus = getPropVal(currentPlant, 'Estat de conservació');
    const curFloracio = getPropVal(currentPlant, 'Floració');
    const curHabitat = getPropVal(currentPlant, 'Hàbitat');

    const otherPlants = AppState.plants.filter(p => {
        const id = p.item ? p.item['@id'] : p['@id'];
        return id !== currentId;
    });

    const scoredOthers = otherPlants.map(entry => {
        const p = entry.item || entry;
        const status = getPropVal(p, 'Estat de conservació');
        const floracio = getPropVal(p, 'Floració');
        const habitat = getPropVal(p, 'Hàbitat');

        let score = 0;
        if (curStatus && status === curStatus) score++;
        if (curFloracio && floracio === curFloracio) score++;
        if (curHabitat && habitat === curHabitat) score++;

        return { entry, score };
    });

    // Fisher-Yates shuffle to randomize elements before sorting
    for (let i = scoredOthers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scoredOthers[i], scoredOthers[j]] = [scoredOthers[j], scoredOthers[i]];
    }

    // Sort by score descending
    scoredOthers.sort((a, b) => b.score - a.score);

    const others = scoredOthers.slice(0, 4).map(x => x.entry);

    if (others.length === 0) return '';

    const cards = others.map(entry => {
        const p = entry.item || entry;
        const pid = p['@id'];
        const getProp = (name) => p.additionalProperty?.find(prop => prop.name === name)?.value || '';
        const familia = getProp('Família');

        // Extraiem una imatge vàlida, reemplaçant _2000 per _400_thumb
        let imageUrl = '';
        if (Array.isArray(p.image) && p.image.length > 0) {
            imageUrl = p.image[0].contentUrl || '';
        } else if (typeof p.image === 'string') {
            imageUrl = p.image;
        }
        const thumbUrl = imageUrl ? imageUrl.replace('_2000.webp', '_400_thumb.webp') : '';

        return `
        <div onclick="window.navigateSPA('plant-detail', '${pid}')"
            class="group flex flex-col bg-surface rounded-2xl overflow-hidden border border-white/10 shadow-2xl hover:border-primary transition-all duration-500 cursor-pointer hover:scale-[1.02] aspect-[4/5]">
            <div class="relative flex-1 overflow-hidden">
                <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="${p.alternateName || p.name}" src="${thumbUrl}" loading="lazy" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="absolute top-4 left-4 flex flex-wrap gap-2">
                    ${renderPlantTags(p)}
                </div>
            </div>
            <div class="p-5 shrink-0 bg-surface">
                <p class="text-primary-light text-[10px] font-black uppercase tracking-[0.2em] mb-1">${familia}</p>
                <h4 class="text-lg font-bold text-white leading-tight">${p.alternateName || p.name}</h4>
            </div>
        </div>`;
    }).join('');

    return `
    <section class="mt-20 border-t border-white/10 pt-12">
        <div class="mb-8">
            <h2 class="text-3xl font-black text-white mb-2 tracking-tight">Explora més a l'Herbari</h2>
            <p class="text-forest-neutral-500">Espècies amb requeriments o hàbitats similars</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            ${cards}
        </div>
    </section>`;
}

// GESTIÓN DEL CARRUSEL GLOBAL
window.currentSlide = 0;
window.nextSlide = function (total) {
    window.setSlide((window.currentSlide + 1) % total, total);
};
window.prevSlide = function (total) {
    window.setSlide((window.currentSlide - 1 + total) % total, total);
};
window.setSlide = function (index, total) {
    if (typeof total === 'undefined') {
        const dots = document.querySelectorAll('[id^="carousel-dot-"]');
        total = dots.length;
    }
    for (let i = 0; i < total; i++) {
        const slide = document.getElementById(`carousel-slide-${i}`);
        const fsSlide = document.getElementById(`fullscreen-slide-${i}`);
        const dot = document.getElementById(`carousel-dot-${i}`);
        if (slide) {
            slide.classList.remove('opacity-100', 'z-10');
            slide.classList.add('opacity-0', 'z-0');
        }
        if (fsSlide) {
            fsSlide.classList.remove('opacity-100', 'z-10');
            fsSlide.classList.add('opacity-0', 'z-0', 'pointer-events-none');
        }
        if (dot) {
            dot.classList.remove('bg-white');
            dot.classList.add('bg-white/30');
        }
    }
    window.currentSlide = index;
    const activeSlide = document.getElementById(`carousel-slide-${index}`);
    const activeFsSlide = document.getElementById(`fullscreen-slide-${index}`);
    const activeDot = document.getElementById(`carousel-dot-${index}`);
    if (activeSlide) {
        activeSlide.classList.remove('opacity-0', 'z-0');
        activeSlide.classList.add('opacity-100', 'z-10');
    }
    if (activeFsSlide) {
        activeFsSlide.classList.remove('opacity-0', 'z-0', 'pointer-events-none');
        activeFsSlide.classList.add('opacity-100', 'z-10');
    }
    if (activeDot) {
        activeDot.classList.remove('bg-white/30');
        activeDot.classList.add('bg-white');
    }
};

window.openFullscreenGallery = function (index) {
    window.setSlide(index);
    const gallery = document.getElementById('fullscreen-gallery');
    if (gallery) {
        gallery.classList.remove('opacity-0', 'pointer-events-none');
        gallery.classList.add('opacity-100');
        document.body.style.overflow = 'hidden';
    }
};

window.closeFullscreenGallery = function () {
    const gallery = document.getElementById('fullscreen-gallery');
    if (gallery) {
        gallery.classList.remove('opacity-100');
        gallery.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }
};

export function renderPlantDetail(plant) {
    if (!plant) return `<div class="p-20 text-center">Planta no trobada</div>`;

    const getProp = (name) => plant.additionalProperty?.find(p => p.name === name)?.value || '—';

    const familia = getProp('Família');
    const status = getProp('Estat de conservació');
    const illa = getProp('Illa');
    const floracio = getProp('FloracióDesc');
    const sol = getProp('Hàbitat') !== '—' ? getProp('Hàbitat') : getProp('Requeriments de sòl');
    const plantId = plant['@id'];

    // GESTIÓN DE MEMORIA 
    ytHandler.cleanupPlayer();
    localVideoHandler.cleanupPlayer();
    localAudioHandler.cleanupPlayer();

    // PROCESSAMENT IMATGES (CARRUSEL RESPONSIVE)
    let images = [];
    if (Array.isArray(plant.image)) {
        images = plant.image;
    } else if (typeof plant.image === 'string') {
        images = [{ contentUrl: plant.image, caption: plant.alternateName || plant.name, description: '' }];
    }

    // Assegurar inicialització
    window.currentSlide = 0;

    const carouselSlidesHTML = images.map((imgObj, index) => {
        let originalUrl = imgObj.contentUrl || '';
        let altText = imgObj.caption || imgObj.description || plant.alternateName || plant.name;

        let srcset = '';
        let src = originalUrl;

        // Auto generació del srcset si es tracta de l'estructura *_2000.webp
        if (originalUrl.endsWith('_2000.webp')) {
            const base = originalUrl.replace('_2000.webp', '');
            srcset = `
                ${base}_400.webp 400w,
                ${base}_800.webp 800w,
                ${base}_1280.webp 1280w,
                ${base}_2000.webp 2000w
            `;
        }

        return `
        <div id="carousel-slide-${index}" class="absolute inset-0 transition-opacity duration-700 ease-in-out ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'} cursor-pointer" onclick="window.openFullscreenGallery(${index})">
            <img 
                src="${src}" 
                ${srcset ? `srcset="${srcset.trim().replace(/\s+/g, ' ')}"` : ''} 
                ${srcset ? `sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, (max-width: 1440px) 1280px, 2000px"` : ''}
                alt="${altText}"
                loading="lazy"
                class="w-full h-full object-cover"
            />
        </div>
        `;
    }).join('');

    const fullscreenSlidesHTML = images.map((imgObj, index) => {
        let originalUrl = imgObj.contentUrl || '';
        let altText = imgObj.caption || imgObj.description || plant.alternateName || plant.name;

        let srcset = '';
        let src = originalUrl;

        if (originalUrl.endsWith('_2000.webp')) {
            const base = originalUrl.replace('_2000.webp', '');
            srcset = `
                ${base}_400.webp 400w,
                ${base}_800.webp 800w,
                ${base}_1280.webp 1280w,
                ${base}_2000.webp 2000w
            `;
        }

        return `
        <div id="fullscreen-slide-${index}" class="absolute inset-4 md:inset-10 flex items-center justify-center transition-opacity duration-500 ease-in-out ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" onclick="event.stopPropagation()">
            <img 
                src="${src}" 
                ${srcset ? `srcset="${srcset.trim().replace(/\s+/g, ' ')}"` : ''} 
                ${srcset ? `sizes="100vw"` : ''}
                alt="${altText}"
                class="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
        </div>
        `;
    }).join('');

    const fullscreenGalleryHTML = `
    <div id="fullscreen-gallery" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300" onclick="window.closeFullscreenGallery()">
        
        ${fullscreenSlidesHTML}

        ${images.length > 1 ? `
        <div class="absolute inset-y-0 left-0 flex items-center px-4 md:px-8 z-20 pointer-events-none">
            <button onclick="window.prevSlide(${images.length}); event.stopPropagation();" class="size-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black backdrop-blur-md transition-all cursor-pointer pointer-events-auto">
                <span class="material-symbols-outlined text-2xl">chevron_left</span>
            </button>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center px-4 md:px-8 z-20 pointer-events-none">
            <button onclick="window.nextSlide(${images.length}); event.stopPropagation();" class="size-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black backdrop-blur-md transition-all cursor-pointer pointer-events-auto">
                <span class="material-symbols-outlined text-2xl">chevron_right</span>
            </button>
        </div>
        ` : ''}
        
        <button onclick="window.closeFullscreenGallery(); event.stopPropagation();" class="absolute top-6 right-6 size-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-black backdrop-blur-md transition-all cursor-pointer z-30">
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>
    </div>
    `;

    const carouselDotsHTML = images.length > 1 ? images.map((_, index) => `
        <button onclick="window.setSlide(${index})" id="carousel-dot-${index}" class="size-2 rounded-full cursor-pointer transition-colors z-20 ${index === 0 ? 'bg-white' : 'bg-white/30'} hover:bg-primary"></button>
    `).join('') : '';

    const carouselNavHTML = images.length > 1 ? `
        <div class="absolute inset-y-0 left-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onclick="window.prevSlide(${images.length})" class="size-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-primary backdrop-blur-sm transition-colors cursor-pointer">
                <span class="material-symbols-outlined">chevron_left</span>
            </button>
        </div>
        <div class="absolute inset-y-0 right-0 flex items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onclick="window.nextSlide(${images.length})" class="size-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-primary backdrop-blur-sm transition-colors cursor-pointer">
                <span class="material-symbols-outlined">chevron_right</span>
            </button>
        </div>
    ` : '';

    const heroTagsHTML = renderPlantTags(plant, true);

    return `
    <div class="flex-1 w-full animate-in fade-in duration-500">

        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <nav class="flex items-center gap-2 text-sm font-medium text-slate-500">
                <a class="hover:text-primary cursor-pointer" onclick="window.navigateSPA('herbarium')">Herbari Digital</a>
                <span class="material-symbols-outlined text-xs">chevron_right</span>
                <span class="text-slate-100">${plant.alternateName || plant.name}</span>
            </nav>
            <button onclick="window.navigateSPA('herbarium')" class="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg border border-forest-neutral-700 text-slate-300 hover:bg-forest-neutral-800 transition-colors">
                <span class="material-symbols-outlined text-lg">arrow_back</span>
                Tornar a l'Herbari
            </button>
        </div>

        <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div class="relative group aspect-[4/3] md:aspect-video rounded-2xl overflow-hidden bg-forest-neutral-900 shadow-2xl">
                
                ${carouselSlidesHTML}
                
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none"></div>

                ${carouselNavHTML}

                <div class="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:justify-between items-start md:items-end z-20 pointer-events-none">
                    <div class="mb-4 md:mb-0">
                        <div class="flex items-center gap-3 mb-2">
                            ${heroTagsHTML}
                        </div>
                        <h2 class="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg">${plant.alternateName}</h2>
                    </div>
                    <div class="flex gap-2 pb-2 pointer-events-auto">
                        ${carouselDotsHTML}
                    </div>
                </div>
            </div>
        </section>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div class="lg:col-span-2 space-y-8">

                    <div class="bg-surface rounded-2xl border border-white/10 p-8 space-y-10 shadow-xl">
                        <section>
                            <h3 class="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                                <span class="material-symbols-outlined text-primary">info</span>
                                Fitxa tècnica
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Nom científic</p>
                                    <p class="text-lg font-medium italic text-slate-200">${plant.name}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Nom comú</p>
                                    <p class="text-lg font-medium text-slate-200">${plant.alternateName || '—'}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Requeriments de sòl</p>
                                    <p class="text-lg font-medium text-slate-200">${sol}</p>
                                </div>
                                <div class="space-y-1 border-l-2 border-primary pl-4">
                                    <p class="text-xs uppercase tracking-widest text-forest-neutral-500 font-bold">Floració</p>
                                    <p class="text-lg font-medium text-slate-200">${floracio}</p>
                                </div>
                            </div>
                        </section>
                        <hr class="border-white/10" />
                        <section>
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-bold flex items-center gap-2 text-white">
                                    <span class="material-symbols-outlined text-primary">description</span>
                                    Descripció
                                </h3>
                                ${speechService.isSupported() ? `
                                <button id="tts-toggle-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-white/10 hover:border-primary text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer">
                                    <span id="tts-icon" class="material-symbols-outlined text-sm">volume_up</span>
                                    <span id="tts-btn-text">Llegeix descripció</span>
                                </button>
                                ` : ''}
                            </div>
                            <div class="prose prose-invert max-w-none text-forest-neutral-300 leading-relaxed space-y-4">
                                ${plant.description}
                            </div>
                        </section>
                    </div>

                    ${(() => {
            const subjectOfArray = Array.isArray(plant.subjectOf) ? plant.subjectOf : (plant.subjectOf ? [plant.subjectOf] : []);
            const audioObj = subjectOfArray.find(s => s['@type'] === 'AudioObject');
            if (audioObj) {
                return `
                    <div id="audio-player-container" class="bg-surface border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-lg gap-6">
                        <audio preload="metadata" playsinline loop>
                            ${audioObj.encoding?.map(enc => `<source src="${enc.contentUrl}" type="${enc.encodingFormat}">`).join('') || ''}
                            El teu navegador no suporta l'element d'àudio.
                        </audio>
                        <div class="flex items-center gap-5 w-full md:w-auto">
                            <div class="audio-icon-container size-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(48,137,48,0.4)] transition-all duration-300">
                                <span class="material-symbols-outlined text-white text-3xl">graphic_eq</span>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-slate-100">${audioObj.name || "Ambient de l'hàbitat"}</h4>
                                <p class="text-sm text-forest-neutral-400">Enregistrat a les Illes Balears</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-center gap-4 flex-1 w-full md:w-auto mr-0 md:ml-4">
                            <button class="play-btn size-12 rounded-full border border-forest-neutral-700 flex items-center justify-center hover:bg-primary transition-colors text-slate-100 shrink-0">
                                <span class="material-symbols-outlined text-3xl">play_arrow</span>
                            </button>
                            <div class="audio-progress hidden sm:block w-full max-w-[200px] lg:max-w-xs h-2 bg-forest-neutral-800 rounded-full overflow-hidden cursor-pointer relative mx-2">
                                <div class="audio-progress-filled absolute top-0 left-0 h-full bg-primary" style="width: 0%"></div>
                            </div>
                            <div class="audio-volume hidden sm:flex items-center gap-2 ml-2">
                                <span class="material-symbols-outlined text-forest-neutral-400 text-sm">volume_up</span>
                                <input type="range" class="audio-volume-slider volume-slider" min="0" max="1" step="0.05" value="1">
                            </div>
                        </div>
                    </div>`;
            } else {
                return `
                    <div class="bg-surface border border-white/10 rounded-2xl p-8 flex items-center justify-between shadow-lg opacity-50">
                        <div class="flex items-center gap-5">
                            <div class="size-14 rounded-full bg-forest-neutral-800 flex items-center justify-center">
                                <span class="material-symbols-outlined text-forest-neutral-500 text-3xl">mic_off</span>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-slate-100">Sense àudio</h4>
                                <p class="text-sm text-forest-neutral-400">No hi ha enregistraments per a aquesta espècie</p>
                            </div>
                        </div>
                    </div>
                    `;
            }
        })()}

                    <div class="bg-surface rounded-2xl border border-white/10 p-8 shadow-xl">
                        <h4 class="text-xl font-bold mb-8 flex items-center gap-2 text-white">
                            <span class="material-symbols-outlined text-primary">library_books</span>
                            Recursos addicionals
                        </h4>
                        <div class="flex flex-col gap-10">
                            ${(() => {
            // Detectem els dos possibles orígens de vídeo independentment
            const videoIdProp = plant.additionalProperty?.find(p => p.name === 'VideoID')?.value || null;
            const localVideoUrl = videoIdProp && !videoIdProp.includes('youtube.com') && !videoIdProp.includes('youtu.be')
                ? videoIdProp : null;
            // subjectOf pot ser un array (VideoObject + AudioObject) o un objecte simple
            const subjectOfArr = Array.isArray(plant.subjectOf) ? plant.subjectOf : (plant.subjectOf ? [plant.subjectOf] : []);
            const videoObj = subjectOfArr.find(s => s['@type'] === 'VideoObject');
            const youtubeUrl = videoObj?.embedUrl
                || (videoIdProp && (videoIdProp.includes('youtube.com') || videoIdProp.includes('youtu.be')) ? videoIdProp : null)
                || null;

            // Prioritat: local > YouTube
            const isLocalVideo = !!localVideoUrl;
            const isYouTube = !isLocalVideo && !!youtubeUrl;

            if (!isLocalVideo && !isYouTube) return '';

            let videoHtml = '';
            if (isYouTube) {
                videoHtml = `
                                        <div class="relative overflow-hidden rounded-2xl aspect-video bg-black ring-1 ring-white/10 shadow-2xl">
                                            <div id="youtube-player-api" class="w-full h-full">
                                                <div class="flex items-center justify-center h-full text-slate-500 italic text-sm">
                                                    Carregant reproductor multimèdia...
                                                </div>
                                            </div>
                                        </div>`;
            } else if (isLocalVideo) {
                videoHtml = `
                                        <figure id="video-wrapper" class="video-container relative overflow-hidden rounded-2xl aspect-video bg-black ring-1 ring-white/10 shadow-2xl">
                                            <video id="video-player" class="w-full h-full object-contain" preload="metadata" playsinline>
                                                <source src="${localVideoUrl}" type="video/mp4">
                                                <source src="${localVideoUrl.replace('.mp4', '.webm')}" type="video/webm">
                                                <p>El teu navegador no suporta HTML5. <a href="${localVideoUrl}">Descarrega l'arxiu</a>.</p>
                                            </video>
                            
                                            <div id="error-overlay" class="overlay hidden absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                                                <span class="material-symbols-outlined text-red-500 text-4xl mb-2">error</span>
                                                <p id="error-message" class="text-white">Ha ocurrido un error reproduciendo el vídeo.</p>
                                            </div>
                            
                                            <div id="loading-overlay" class="overlay hidden absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                                                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                            
                                            <div id="video-controls" class="controls-container" data-state="hidden" style="display: none;">
                                                <div class="progress-wrapper" id="progress-wrapper">
                                                    <input type="range" id="progress-bar" class="progress-bar" min="0" max="100" value="0" step="0.1">
                                                    <div class="progress-filled" id="progress-filled"></div>
                                                </div>
                            
                                                <div class="controls-main">
                                                    <div class="controls-left">
                                                        <button id="play-pause-btn" class="control-btn" title="Reproducir/Pausar">
                                                            <span class="material-symbols-outlined">play_arrow</span>
                                                        </button>
                            
                                                        <div class="volume-container hidden sm:flex">
                                                            <button id="mute-btn" class="control-btn" title="Silenciar">
                                                                <span class="material-symbols-outlined">volume_up</span>
                                                            </button>
                                                            <input type="range" id="volume-slider" class="volume-slider" min="0" max="1" step="0.05" value="0.5">
                                                        </div>
                            
                                                        <div class="time-display text-white">
                                                            <span id="current-time">00:00</span> / <span id="duration">00:00</span>
                                                        </div>
                                                    </div>
                            
                                                    <div class="controls-right">
                                                        <button id="fullscreen-btn" class="control-btn" title="Pantalla completa">
                                                            <span class="material-symbols-outlined">fullscreen</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </figure>`;
            }

            return `
                            <div class="space-y-5">
                                <p class="text-xs font-bold text-forest-neutral-500 uppercase tracking-widest">Documental Botànic</p>
                                ${videoHtml}
                                <p class="text-xl font-bold text-slate-100">Documental botànic de l'espècie</p>
                            </div>`;
        })()}
                            ${(() => {
            const subjectOfArr = Array.isArray(plant.subjectOf) ? plant.subjectOf : (plant.subjectOf ? [plant.subjectOf] : []);
            const links = subjectOfArr.filter(s => s['@type'] === 'WebPage' || s['@type'] === 'CreativeWork');

            if (links.length === 0) return '';

            const linksHtml = links.map(link => {
                const isPdf = link['@type'] === 'CreativeWork' || (link.encodingFormat && link.encodingFormat.includes('pdf'));
                const icon = isPdf ? 'picture_as_pdf' : 'language';
                const iconColor = isPdf ? 'text-red-500' : 'text-blue-400';
                const subtitle = isPdf ? 'Document descarregable (PDF)' : 'Referència web externa';
                const actionIcon = isPdf ? 'download' : 'open_in_new';
                const title = link.name || (isPdf ? 'Document PDF' : 'Enllaç web');
                // Ensure URLs are available, fallback to '#' if missing
                const url = link.url || '#';

                return `
                                    <a class="flex items-center justify-between p-4 rounded-xl bg-background-dark border border-white/10 hover:border-primary transition-all group" href="${url}" target="_blank" rel="noopener noreferrer">
                                        <div class="flex items-center gap-3">
                                            <span class="material-symbols-outlined text-2xl ${iconColor}">${icon}</span>
                                            <div>
                                                <p class="font-bold text-sm">${title}</p>
                                                <p class="text-[10px] text-forest-neutral-500">${subtitle}</p>
                                            </div>
                                        </div>
                                        <span class="material-symbols-outlined text-sm text-forest-neutral-500 group-hover:text-primary transition-colors">${actionIcon}</span>
                                    </a>`;
            }).join('');

            return `
                            <div class="space-y-4">
                                <p class="text-xs font-bold text-forest-neutral-500 uppercase tracking-widest">Documentació de referència</p>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${linksHtml}
                                </div>
                            </div>`;
        })()}
                        </div>
                    </div>
                </div>

                <div class="space-y-6">
                    ${(() => {
                        const isFav = AuthService.isFavorite(plantId);
                        if (isFav) {
                            return `
                            <button onclick="window.toggleFav(event, '${plantId}'); window.navigateSPA('plant-detail', '${plantId}');" class="w-full py-4 px-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-xl border border-red-500/30 flex items-center justify-center gap-3 transition-all group">
                                <span class="material-symbols-outlined transition-all">heart_broken</span>
                                Llevar de Preferits
                            </button>
                            `;
                        } else {
                            return `
                            <button onclick="window.toggleFav(event, '${plantId}'); window.navigateSPA('plant-detail', '${plantId}');" class="w-full py-4 px-6 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-surface flex items-center justify-center gap-3 transition-all group active:scale-[0.98]">
                                <span class="material-symbols-outlined group-hover:fill-1 transition-all">favorite</span>
                                Afegir a Preferits
                            </button>
                            `;
                        }
                    })()}

                    <div class="bg-surface rounded-xl border border-white/10 p-6 shadow-xl">
                        <h4 class="font-bold text-lg mb-4 text-white">Presència a les Illes</h4>
                        <div class="grid grid-cols-3 gap-2">
                            ${renderIslandPresence(illa)}
                        </div>
                    </div>

                    ${renderConservationCard(status)}

                    <section class="bg-surface rounded-xl border border-white/10 overflow-hidden shadow-xl">
                        <div class="p-6 border-b border-white/10">
                            <h3 class="font-bold flex items-center gap-2 text-white">
                                <span class="material-symbols-outlined text-primary">location_on</span>
                                Distribució Geogràfica
                            </h3>
                        </div>
                        
                        <div id="detail-map" class="w-full aspect-square bg-forest-neutral-800 relative z-0">
                            <div class="absolute inset-0 flex items-center justify-center">
                                <div class="flex flex-col items-center gap-2">
                                    <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p class="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Carregant mapa...</p>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 bg-surface/50 border-t border-white/5">
                            <p class="text-[10px] text-forest-neutral-400 text-center leading-relaxed italic">
                                Localitzacions documentades a <span class="text-slate-200">${illa}</span>
                            </p>
                        </div>
                    </section>
                </div>
            </div>

            ${renderRelatedCards(plantId)}
        </main>
    </div>

    ${fullscreenGalleryHTML.replace('z-50', 'z-[100] w-screen h-screen')}
    `;
}