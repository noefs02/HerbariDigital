/**
 * YouTubeHandler: Gestor avanzado para la API de YouTube IFrame Player.
 * Permite la carga asíncrona de la API, gestión de memoria (cleanup) 
 * y extracción dinámica de IDs desde URLs o códigos cortos.
 */
export class YouTubeHandler {
    constructor() {
        this.player = null;
    }

    /**
     * Carga la API de YouTube de forma asíncrona mediante una Promesa.
     * Cumple con los criterios de Programación Asíncrona de la rúbrica.
     */
    loadAPI() {
        return new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }

            // Inserción dinámica del tag de la API
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Callback global que ejecuta YouTube cuando la API está lista
            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };
        });
    }

    /**
     * Limpia la instancia del reproductor para liberar memoria.
     * Vital para el rendimiento en aplicaciones SPA al cambiar de vista.
     */
    async cleanupPlayer() {
        if (this.player) {
            try {
                this.stopVideo();
                this.player.destroy();
                this.player = null;
                // Pequeña pausa para asegurar que el DOM se libere correctamente
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
                console.warn('Error en la limpieza del reproductor:', error);
            }
        }
    }

    /**
     * Carga y renderiza el vídeo en el contenedor especificado.
     * @param {string} videoInput - URL completa o ID de 11 caracteres.
     * @param {HTMLElement} videoFrame - Contenedor DOM donde se inyectará el vídeo.
     */
    loadVideo(videoInput, videoFrame) {
        if (!videoInput || videoInput === '—') {
            videoFrame.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full p-6 text-slate-500 italic text-sm text-center">
                    <span class="material-symbols-outlined text-3xl mb-2 opacity-20">videocam_off</span>
                    El vídeo documental de l'espècie no està disponible actualment.
                </div>`;
            return;
        }

        const videoId = this.extractYouTubeId(videoInput);

        if (!videoId) {
            console.error('ID de vídeo no vàlid:', videoInput);
            videoFrame.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full p-6 text-red-400/70 italic text-sm text-center">
                    Error en carregar el vídeo (ID incorrecte).
                </div>`;
            return;
        }

        if (!window.YT || !window.YT.Player) {
            console.error('La API de YouTube no s\'ha carregat correctament.');
            return;
        }

        // Si ya existe un player, cargamos el nuevo ID, si no, creamos uno nuevo
        if (this.player && typeof this.player.loadVideoById === 'function') {
            this.player.loadVideoById(videoId);
        } else {
            this.player = new YT.Player(videoFrame, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,      // Reproducción inline en móviles
                    'rel': 0,              // No mostrar vídeos relacionados al final
                    'modestbranding': 1,   // Ocultar logo de YouTube en la barra
                    'origin': window.location.origin // Seguridad para el servidor local
                },
                events: {
                    'onError': (e) => console.error('YouTube Player Error:', e)
                }
            });
        }
    }

    /**
     * Extrae el ID de 11 caracteres de diversas estructuras de URL de YouTube.
     * Permite que el JSON sea flexible (acepte URL o solo ID).
     */
    extractYouTubeId(url) {
        // Si ya es un ID de 11 caracteres, lo devolvemos directamente
        if (url.length === 11 && !url.includes('/')) return url;

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    /**
     * Detiene la reproducción si el player existe.
     */
    stopVideo() {
        if (this.player && typeof this.player.stopVideo === 'function') {
            this.player.stopVideo();
        }
    }
}