export class CustomVideoHandler {
    constructor() {
        this.video = null;
        this.wrapper = null;
        this.controlsTimeout = null;
        this.listeners = []; // Para limpieza de eventos
    }

    init(containerId) {
        this.wrapper = document.getElementById(containerId);
        if (!this.wrapper) return;

        this.video = this.wrapper.querySelector('#video-player');
        this.playBtn = this.wrapper.querySelector('#play-pause-btn');
        this.muteBtn = this.wrapper.querySelector('#mute-btn');
        this.volumeSlider = this.wrapper.querySelector('#volume-slider');
        this.fullscreenBtn = this.wrapper.querySelector('#fullscreen-btn');
        this.progressBar = this.wrapper.querySelector('#progress-bar');
        this.progressFilled = this.wrapper.querySelector('#progress-filled');
        this.currentTimeEl = this.wrapper.querySelector('#current-time');
        this.durationEl = this.wrapper.querySelector('#duration');
        this.controlsContainer = this.wrapper.querySelector('#video-controls');

        this.errorOverlay = this.wrapper.querySelector('#error-overlay');
        this.loadingOverlay = this.wrapper.querySelector('#loading-overlay');

        if (this.controlsContainer) {
            this.controlsContainer.style.display = 'flex';
        }

        this.setupEvents();
    }

    addListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    setupEvents() {
        // Toggle Reproducción
        const togglePlay = () => {
            if (this.video.paused || this.video.ended) {
                this.video.play();
                this.playBtn.innerHTML = '<span class="material-symbols-outlined">pause</span>';
            } else {
                this.video.pause();
                this.playBtn.innerHTML = '<span class="material-symbols-outlined">play_arrow</span>';
            }
        };

        this.addListener(this.playBtn, 'click', togglePlay);
        this.addListener(this.video, 'click', togglePlay);

        // Progreso de carga y tiempo
        this.addListener(this.video, 'timeupdate', () => {
            const current = this.video.currentTime;
            const duration = this.video.duration;
            
            if (!isNaN(duration)) {
                const percent = (current / duration) * 100;
                this.progressBar.value = percent;
                this.progressFilled.style.width = `${percent}%`;
                
                this.currentTimeEl.textContent = this.formatTime(current);
                this.durationEl.textContent = this.formatTime(duration);
            }
        });

        // Actualizar barra de progreso al hacer click o arrastrar
        this.addListener(this.progressBar, 'input', (e) => {
            if (!isNaN(this.video.duration)) {
                const newTime = (e.target.value / 100) * this.video.duration;
                this.video.currentTime = newTime;
                this.progressFilled.style.width = `${e.target.value}%`;
            }
        });

        // Volumen y Mutear
        this.addListener(this.muteBtn, 'click', () => {
            this.video.muted = !this.video.muted;
            this.updateVolumeIcon();
        });

        this.addListener(this.volumeSlider, 'input', (e) => {
            this.video.volume = e.target.value;
            this.video.muted = e.target.value == 0;
            this.updateVolumeIcon();
        });

        // Pantalla completa
        this.addListener(this.fullscreenBtn, 'click', () => {
            if (!document.fullscreenElement) {
                this.wrapper.requestFullscreen().catch(err => console.warn('Error accediendo a pantalla completa:', err));
            } else {
                document.exitFullscreen();
            }
        });

        // Actividad / Ocultar controles
        const resetControlsTimeout = () => {
            this.wrapper.classList.remove('hide-controls');
            clearTimeout(this.controlsTimeout);
            this.controlsTimeout = setTimeout(() => {
                if (!this.video.paused) {
                    this.wrapper.classList.add('hide-controls');
                }
            }, 3000);
        };

        this.addListener(this.wrapper, 'mousemove', resetControlsTimeout);
        this.addListener(this.wrapper, 'mouseleave', () => {
            if (!this.video.paused) this.wrapper.classList.add('hide-controls');
        });
        
        // Manejo de eventos de la etiqueta <video> y estado de carga
        this.addListener(this.video, 'waiting', () => {
            this.loadingOverlay?.classList.remove('hidden');
        });
        this.addListener(this.video, 'canplay', () => {
            this.loadingOverlay?.classList.add('hidden');
        });
        this.addListener(this.video, 'error', () => {
            this.errorOverlay?.classList.remove('hidden');
            this.loadingOverlay?.classList.add('hidden');
        });
    }

    updateVolumeIcon() {
        if (this.video.muted || this.video.volume == 0) {
            this.muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_off</span>';
            this.volumeSlider.value = 0;
        } else if (this.video.volume < 0.5) {
            this.muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_down</span>';
            this.volumeSlider.value = this.video.volume;
        } else {
            this.muteBtn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
            this.volumeSlider.value = this.video.volume;
        }
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    cleanupPlayer() {
        // Remover eventos para prevenir memory leaks en SPA
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];
        
        if (this.controlsTimeout) {
            clearTimeout(this.controlsTimeout);
        }
        
        if (this.video) {
            this.video.pause();
            this.video.removeAttribute('src');
            this.video.load();
        }
        
        this.video = null;
        this.wrapper = null;
    }
}
