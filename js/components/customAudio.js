export class CustomAudioHandler {
    constructor() {
        this.audio = null;
        this.playBtn = null;
        this.progressBar = null;
        this.progressFilled = null;
        this.iconContainer = null;
        this.volumeSlider = null;
        this.listeners = [];
        this.isDragging = false;
    }

    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.audio = container.querySelector('audio');
        this.playBtn = container.querySelector('.play-btn');
        this.progressBar = container.querySelector('.audio-progress');
        this.progressFilled = container.querySelector('.audio-progress-filled');
        this.iconContainer = container.querySelector('.audio-icon-container');
        this.volumeSlider = container.querySelector('.audio-volume-slider');

        if (!this.audio || !this.playBtn || !this.progressBar || !this.progressFilled) return;

        // Set initial volume if slider exists
        if (this.volumeSlider) {
            this.audio.volume = this.volumeSlider.value;
        }

        this.setupEvents();
    }

    addListener(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    setupEvents() {
        // Toggle play/pause
        this.addListener(this.playBtn, 'click', () => {
            if (this.audio.paused || this.audio.ended) {
                this.audio.play();
                this.playBtn.innerHTML = '<span class="material-symbols-outlined text-3xl">pause</span>';
                this.iconContainer?.classList.add('animate-pulse');
            } else {
                this.audio.pause();
                this.playBtn.innerHTML = '<span class="material-symbols-outlined text-3xl">play_arrow</span>';
                this.iconContainer?.classList.remove('animate-pulse');
            }
        });

        // Update progress
        this.addListener(this.audio, 'timeupdate', () => {
            if (this.isDragging) return;
            const current = this.audio.currentTime;
            const duration = this.audio.duration;
            if (!isNaN(duration) && duration > 0) {
                const percent = (current / duration) * 100;
                this.progressFilled.style.width = `${percent}%`;
            }
        });

        // End of audio (fallback even with loop)
        this.addListener(this.audio, 'ended', () => {
            this.playBtn.innerHTML = '<span class="material-symbols-outlined text-3xl">play_arrow</span>';
            this.progressFilled.style.width = '0%';
            this.iconContainer?.classList.remove('animate-pulse');
        });

        // Volume control
        if (this.volumeSlider) {
            this.addListener(this.volumeSlider, 'input', (e) => {
                this.audio.volume = e.target.value;
            });
        }

        // Handle progress bar interaction
        this.addListener(this.progressBar, 'click', (e) => {
            const rect = this.progressBar.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (!isNaN(this.audio.duration)) {
                this.audio.currentTime = pos * this.audio.duration;
                this.progressFilled.style.width = `${pos * 100}%`;
            }
        });

        this.addListener(this.progressBar, 'mousedown', () => this.isDragging = true);
        window.addEventListener('mouseup', () => this.isDragging = false);
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging && !isNaN(this.audio.duration)) {
                const rect = this.progressBar.getBoundingClientRect();
                let pos = (e.clientX - rect.left) / rect.width;
                pos = Math.max(0, Math.min(1, pos)); // Clamp between 0-1
                this.audio.currentTime = pos * this.audio.duration;
                this.progressFilled.style.width = `${pos * 100}%`;
            }
        });
    }

    cleanupPlayer() {
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];

        if (this.audio) {
            this.audio.pause();
            this.audio.removeAttribute('src');
            this.audio.load();
        }
        
        this.audio = null;
        this.playBtn = null;
        this.progressBar = null;
        this.progressFilled = null;
        this.iconContainer = null;
        this.volumeSlider = null;
    }
}
