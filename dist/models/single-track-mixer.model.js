"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleTrackMixer = void 0;
const audio_engine_model_1 = require("./audio-engine.model");
class SingleTrackMixer {
    engine;
    transitionDurationMs;
    disposed = false;
    playing = false;
    previousInstance = undefined;
    instance = undefined;
    lastTick = 0;
    get volume() {
        return this.engine.volume;
    }
    set volume(value) {
        this.engine.volume = value;
    }
    get debug() {
        return this.engine.debug;
    }
    set debug(value) {
        this.engine.debug = value;
    }
    constructor(tracks, options) {
        this.engine = new audio_engine_model_1.AudioEngine(tracks);
        this.transitionDurationMs = options?.transitionDurationMs ?? 500;
        this.start();
    }
    start() {
        if (this.disposed) {
            return;
        }
        this.playing = true;
        this.lastTick = Date.now();
        this.update();
    }
    update() {
        if (!this.playing) {
            return;
        }
        const time = Date.now();
        const deltaTime = (time - this.lastTick) / this.transitionDurationMs;
        if (this.instance?.element) {
            const volume = this.instance.element.volume;
            this.engine.setVolume(this.instance, Math.min(1, volume + deltaTime));
        }
        if (this.previousInstance?.element) {
            const volume = this.previousInstance.element.volume;
            const newVolume = Math.max(0, volume - deltaTime);
            this.engine.setVolume(this.previousInstance, newVolume);
            if (newVolume <= 0) {
                this.engine.pause(this.previousInstance);
                this.previousInstance = undefined;
            }
        }
        this.lastTick = time;
        requestAnimationFrame(() => this.update());
    }
    stop() {
        this.playing = false;
    }
    dispose() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.stop();
        this.engine.dispose();
    }
    play(typeId, options) {
        if (this.instance?.typeId === typeId) {
            if (this.debug) {
                console.debug('Track', typeId, 'is already playing');
            }
            return;
        }
        if (this.debug) {
            console.debug('Play single track', typeId);
        }
        if (this.instance?.element?.paused === false) {
            this.previousInstance = this.instance;
            if (this.debug) {
                console.debug('Fade out single track', this.previousInstance?.typeId);
            }
        }
        this.instance = this.engine.play(typeId, {
            ...(options ?? {}),
            volume: 0,
        });
    }
    playEmpty() {
        if (this.instance?.element?.paused === false) {
            this.previousInstance = this.instance;
            if (this.debug) {
                console.debug('Fade out single track', this.previousInstance?.typeId);
            }
        }
        this.instance = undefined;
    }
}
exports.SingleTrackMixer = SingleTrackMixer;
//# sourceMappingURL=single-track-mixer.model.js.map