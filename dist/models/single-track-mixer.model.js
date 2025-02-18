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
    fadeIn = true;
    fadeOut = true;
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
        if (this.instance?.element && this.instance.volume < 1) {
            const volume = this.instance.element.volume;
            this.engine.setVolume(this.instance, this.fadeIn ? Math.min(1, volume + deltaTime) : 1);
        }
        if (this.previousInstance?.element) {
            const volume = this.previousInstance.volume;
            const newVolume = this.fadeOut ? Math.max(0, volume - deltaTime) : 0;
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
        this._endCurrent();
        const type = this.engine.getType(typeId);
        const fadeIn = type?.fadeIn ?? true;
        this.instance = this.engine.play(typeId, {
            ...(options ?? {}),
            volume: fadeIn ? 0 : 1,
        });
        if (this.instance === this.previousInstance) {
            this.previousInstance = undefined;
        }
    }
    playEmpty() {
        this._endCurrent();
    }
    _endCurrent() {
        if (this.instance?.playing === true) {
            const type = this.engine.getType(this.instance.typeId);
            if (type?.fadeOut ?? true) {
                this.previousInstance = this.instance;
                if (this.debug) {
                    console.debug('Fade out single track', this.previousInstance?.typeId);
                }
            }
            else {
                this.engine.pause(this.instance);
                if (this.debug) {
                    console.debug('Stop single track', this.instance.typeId);
                }
            }
        }
        this.instance = undefined;
    }
}
exports.SingleTrackMixer = SingleTrackMixer;
//# sourceMappingURL=single-track-mixer.model.js.map