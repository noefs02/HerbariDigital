/**
 * Servei de Síntesi de Veu (Text-to-Speech)
 * Encapsula la interacció amb la Web Speech API per a la descripció accessible de plantes.
 */
export class SpeechService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
    }

    /**
     * Comprova si el navegador actual suporta la síntesi de veu
     * @returns {boolean}
     */
    isSupported() {
        return !!this.synth;
    }

    /**
     * Comprova si hi ha algun text reproduint-se actualment
     * @returns {boolean}
     */
    isSpeaking() {
        return this.isSupported() ? this.synth.speaking : false;
    }

    /**
     * Neteja les etiquetes HTML del text per deixar només text pla
     * @param {string} htmlText 
     * @returns {string}
     */
    cleanHTML(htmlText) {
        if (!htmlText) return '';
        // Reemplacem tags com <p>, <br>, etc., per espais i eliminem qualsevol altre tag HTML
        return htmlText
            .replace(/<\/?[^>]+(>|$)/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Reprodueix el text mitjançant síntesi de veu
     * @param {string} text - El text descriptiu (pot incloure HTML)
     * @param {Object} options - Callbacks d'estat (onStart, onEnd, onError)
     */
    speak(text, options = {}) {
        if (!this.isSupported()) {
            console.warn("La síntesi de veu no està suportada en aquest navegador.");
            if (options.onError) options.onError(new Error("Not supported"));
            return;
        }

        // Aturem qualsevol veu anterior abans de començar la nova
        this.stop();

        const plainText = this.cleanHTML(text);
        if (!plainText) return;

        this.utterance = new SpeechSynthesisUtterance(plainText);
        
        // Configuració de veu
        if (this.synth.getVoices) {
            const voices = this.synth.getVoices();
            
            // Intentem trobar una veu en català
            let targetVoice = voices.find(v => 
                v.lang.startsWith('ca') || 
                v.lang.includes('ca-ES') || 
                v.lang.includes('ca_ES')
            );
            
            // Fallback a castellà/espanyol si no n'hi ha en català
            if (!targetVoice) {
                targetVoice = voices.find(v => 
                    v.lang.startsWith('es') || 
                    v.lang.includes('es-ES')
                );
            }
            
            if (targetVoice) {
                this.utterance.voice = targetVoice;
            }
        }

        // Establir el to i la velocitat de parla (valors estàndard naturals)
        this.utterance.pitch = 1.0;
        this.utterance.rate = 1.0;

        // Assignació de callbacks
        if (options.onStart) {
            this.utterance.onstart = options.onStart;
        }
        
        // A més dels callbacks de fi i error, ens assegurem de netejar l'utterance actiu
        this.utterance.onend = (e) => {
            this.utterance = null;
            if (options.onEnd) options.onEnd(e);
        };

        this.utterance.onerror = (e) => {
            // Ignorar el comportament habitual d'error causat per un cancel() de stop() intencionat
            if (e.error !== 'interrupted') {
                console.error("Error en la síntesi de veu:", e);
                this.utterance = null;
                if (options.onError) options.onError(e);
            }
        };

        // Enviar la cua de reproducció al navegador
        this.synth.speak(this.utterance);
    }

    /**
     * Atura immediatament qualsevol reproducció activa
     */
    stop() {
        if (!this.isSupported()) return;
        this.synth.cancel();
        this.utterance = null;
    }
}
