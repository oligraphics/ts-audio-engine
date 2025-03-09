"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioEngine = void 0;
const ts_event_bus_1 = require("ts-event-bus");
const audio_event_type_enum_1 = require("../enums/audio-event-type.enum");
const id_service_1 = require("../services/id.service");
const audio_stealing_strategy_enum_1 = require("../enums/audio-stealing-strategy.enum");
class AudioEngine {
    /**
     * Bus to listen to events within the engine.
     * @see AudioEventTypeEnum
     * @see AudioEventDto
     */
    bus = new ts_event_bus_1.EventBus();
    types = new Map();
    cache = new Map();
    playing = new Map();
    _audioConsentReceived = false;
    _globalVolume = 1;
    _globalVolumeFactor = 1;
    /**
     * Audio consent is received after the first click event on the document
     */
    get audioConsentReceived() {
        return this._audioConsentReceived;
    }
    /**
     * Value between 0 and 1
     */
    get volume() {
        return this._globalVolume;
    }
    /**
     * Value between 0 and 1
     */
    set volume(value) {
        this._globalVolume = value;
        this._globalVolumeFactor = 1 - Math.pow(1 - value, 2);
        for (const playing of this.playing.values()) {
            for (const instance of playing.values()) {
                const element = instance.element;
                if (element) {
                    element.volume = instance.volume * this.globalVolumeFactor;
                }
            }
        }
    }
    get globalVolumeFactor() {
        return (this._globalVolumeFactor *
            (document.visibilityState === 'visible' ? 1 : 0));
    }
    /**
     * Toggle console logging
     */
    debug = false;
    constructor(audioTypes) {
        for (const type of audioTypes) {
            this.types.set(type.id, type);
            this.cache.set(type.id, []);
            this.playing.set(type.id, new Map());
            const maxInstances = type.maxInstances ?? 0;
            if (maxInstances > 0) {
                for (let i = 0; i < maxInstances; i++) {
                    this.prepareInstance(type.id);
                }
            }
        }
        document.addEventListener('click', this.onDocumentClicked);
        document.addEventListener('visibilitychange', this.onDocumentVisibilityChange);
    }
    dispose() {
        document.removeEventListener('click', this.onDocumentClicked);
        document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange);
        for (const list of this.cache.values()) {
            for (const element of list.flatMap((e) => e.elements)) {
                element.remove();
            }
        }
        for (const playing of this.playing.values()) {
            for (const instance of playing.values()) {
                for (const element of instance.elements) {
                    element.remove();
                }
            }
        }
        this.cache.clear();
        this.playing.clear();
    }
    getType(typeId) {
        return this.types.get(typeId);
    }
    onDocumentVisibilityChange = () => {
        this.volume = this.volume;
    };
    onDocumentClicked = () => {
        this._audioConsentReceived = true;
        document.removeEventListener('click', this.onDocumentClicked);
        for (const playing of this.playing.values()) {
            for (const instance of playing.values()) {
                // noinspection JSIgnoredPromiseFromCall
                instance.element?.play();
            }
        }
    };
    /**
     * Create a new sound instance
     */
    prepareInstance(typeId) {
        const type = this.types.get(typeId);
        if (type === undefined) {
            console.error('Unknown audio type', typeId);
            return undefined;
        }
        if (this.debug) {
            console.debug('Play', typeId);
        }
        const id = id_service_1.IdService.createRandomId(8);
        const urls = Array.isArray(type.url) ? type.url : [type.url];
        const elements = [];
        const instance = {
            id,
            typeId,
            url: type.url,
            baseVolume: 1,
            volumeMultiplier: 1,
            get volume() {
                return instance.baseVolume * instance.volumeMultiplier;
            },
            pitch: 1,
            element: undefined,
            variant: Math.floor(Math.random() * urls.length),
            elements,
        };
        for (const url of urls) {
            const element = document.createElement('audio');
            element.src = url;
            element.loop = type.loop ?? false;
            element.autoplay = false;
            element.preservesPitch = false;
            element.ontimeupdate = () => {
                this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.TIME_UPDATE, {
                    type: audio_event_type_enum_1.AudioEventTypeEnum.TIME_UPDATE,
                    audio: instance,
                    timeMs: element.currentTime,
                });
            };
            element.onended = () => {
                instance.playing = false;
                const playing = this.playing.get(typeId);
                if (playing) {
                    playing.delete(instance.id);
                }
                const cache = this.cache.get(typeId);
                if (cache) {
                    cache.push(instance);
                }
                else {
                    this.release(instance);
                }
                this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.ENDED, {
                    type: audio_event_type_enum_1.AudioEventTypeEnum.ENDED,
                    audio: instance,
                });
            };
            document.body.append(element);
            elements.push(element);
        }
        const cache = this.cache.get(typeId) ?? [];
        cache.push(instance);
        this.cache.set(typeId, cache);
        return instance;
    }
    _getInstance(typeId) {
        const cache = this.cache.get(typeId);
        if (cache && cache.length > 0) {
            if (this.debug) {
                console.debug('Pick from cache', cache.length);
            }
            return cache.splice(0, 1)[0];
        }
        const type = this.types.get(typeId);
        if (!type) {
            throw new Error('Unknown audio type ' + typeId);
        }
        const playing = this.playing.get(typeId);
        if (!playing) {
            return undefined;
        }
        const stealingStrategy = type.stealingStrategy ?? audio_stealing_strategy_enum_1.AudioStealingStrategyEnum.OLDEST;
        if (this.debug) {
            console.debug('Steal from playing', stealingStrategy, 'available:', playing.size);
        }
        let instance;
        switch (stealingStrategy) {
            case audio_stealing_strategy_enum_1.AudioStealingStrategyEnum.OLDEST:
                instance = [...playing.values()].find(() => true);
                break;
            case audio_stealing_strategy_enum_1.AudioStealingStrategyEnum.QUIETEST:
                instance = [...playing.values()]
                    .sort((a, b) => {
                    const aVolume = a.element?.volume ?? 0;
                    const bVolume = b.element?.volume ?? 0;
                    return aVolume > bVolume ? 1 : aVolume < bVolume ? -1 : 0;
                })
                    .find(() => true);
                break;
            default:
                return undefined;
        }
        if (instance) {
            playing.delete(instance.id);
        }
        return instance;
    }
    /**
     * Play a sound instance
     */
    play(typeId, options) {
        const instance = this._getInstance(typeId);
        if (instance === undefined) {
            if (this.debug) {
                console.error('Cannot create another instance of type', typeId, 'due to the max instances count');
            }
            return undefined;
        }
        const type = this.types.get(typeId);
        const playing = this.playing.get(typeId) ?? new Map();
        playing.set(instance.id, instance);
        this.playing.set(typeId, playing);
        if (this.debug) {
            console.debug('Play', typeId, 'active instances:', playing.size);
        }
        const typeVolume = type?.volume ?? 1;
        const randomTypeVolume = type?.randomize?.volume !== undefined
            ? Math.random() * type.randomize.volume
            : 0;
        const volume = typeVolume - (type?.randomize?.volume ?? 0) / 2 + randomTypeVolume;
        const basePitch = type?.pitch ?? 1;
        const randomPitch = type?.randomize?.pitch !== undefined
            ? Math.random() * type.randomize.pitch
            : 0;
        const pitch = basePitch - (type?.randomize?.pitch ?? 0) / 2 + randomPitch;
        instance.baseVolume = volume;
        instance.volumeMultiplier =
            options?.volume !== undefined ? options.volume : 1;
        instance.pitch = pitch;
        instance.playing = true;
        for (const element of instance.elements) {
            element.volume = instance.volume * this.globalVolumeFactor;
            element.playbackRate = pitch;
        }
        if (this.debug) {
            console.debug('Volume', volume, 'Pitch', pitch);
        }
        const element = instance.elements[Math.floor(Math.random() * instance.elements.length)];
        instance.element = element;
        element.currentTime =
            (options?.timeMs !== undefined ? options.timeMs : 0) / 1000;
        if (this._audioConsentReceived) {
            element.play().catch((e) => console.error(e));
        }
        this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.PLAYED, {
            type: audio_event_type_enum_1.AudioEventTypeEnum.PLAYED,
            audio: instance,
        });
        return instance;
    }
    /**
     * Set the volume of a sound instance
     */
    setVolume(instance, volume) {
        if (this.debug) {
            console.debug('Set volume of', instance.typeId, `(${instance.id})`, 'to', volume);
        }
        instance.volumeMultiplier = volume;
        if (instance.element) {
            instance.element.volume = instance.volume * this.globalVolumeFactor;
        }
        this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.VOLUME_CHANGED, {
            type: audio_event_type_enum_1.AudioEventTypeEnum.VOLUME_CHANGED,
            audio: instance,
            volume,
        });
    }
    /**
     * Pause a sound instance
     */
    pause(instance) {
        if (instance === undefined) {
            return;
        }
        if (instance.element) {
            instance.element.pause();
        }
        this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.PAUSED, {
            type: audio_event_type_enum_1.AudioEventTypeEnum.PAUSED,
            audio: instance,
        });
    }
    /**
     * Release a sound instance
     */
    release(instance) {
        if (this.debug) {
            console.debug('release', instance.typeId, `(${instance.id})`);
        }
        if (instance.element) {
            if (this.debug) {
                console.debug('Volume of', instance.typeId, `(${instance.id})`, 'was', instance.element.volume);
            }
            instance.element.pause();
        }
        for (const element of instance.elements) {
            element.remove();
        }
        const playing = this.playing.get(instance.typeId);
        if (playing) {
            playing.delete(instance.id);
        }
        const cache = this.cache.get(instance.typeId);
        if (cache) {
            const index = cache.findIndex((i) => i.id === instance.id);
            if (index >= 0) {
                cache.splice(index, 1);
            }
        }
        this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.RELEASED, {
            type: audio_event_type_enum_1.AudioEventTypeEnum.RELEASED,
            audio: instance,
        });
    }
}
exports.AudioEngine = AudioEngine;
//# sourceMappingURL=audio-engine.model.js.map