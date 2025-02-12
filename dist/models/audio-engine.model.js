"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    }
    dispose() {
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
            element: undefined,
            variant: Math.floor(Math.random() * urls.length),
            elements,
        };
        for (const url of urls) {
            const element = document.createElement('audio');
            element.src = url;
            element.loop = type.loop ?? false;
            element.autoplay = false;
            element.ontimeupdate = () => {
                this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.TIME_UPDATE, {
                    type: audio_event_type_enum_1.AudioEventTypeEnum.TIME_UPDATE,
                    audio: instance,
                    timeMs: element.currentTime,
                });
            };
            element.onended = () => {
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
        const playing = this.playing.get(typeId) ?? new Map();
        playing.set(instance.id, instance);
        this.playing.set(typeId, playing);
        if (this.debug) {
            console.debug('Play', typeId, 'active instances:', playing.size);
        }
        const volume = options?.volume !== undefined ? options.volume : 1;
        for (const element of instance.elements) {
            element.volume = volume;
        }
        const element = instance.elements[Math.floor(Math.random() * instance.elements.length)];
        instance.element = element;
        element.currentTime =
            (options?.timeMs !== undefined ? options.timeMs : 0) / 1000;
        element.play().catch((e) => console.error(e));
        this.bus.trigger(audio_event_type_enum_1.AudioEventTypeEnum.PLAYED, {
            type: audio_event_type_enum_1.AudioEventTypeEnum.PLAYED,
            audio: instance,
        });
    }
    /**
     * Set the volume of a sound instance
     */
    setVolume(instance, volume) {
        if (this.debug) {
            console.debug('Set volume of', instance.id, 'to', JSON.stringify(volume));
        }
        if (instance.element) {
            instance.element.volume = volume;
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
            console.debug('release', instance.id);
        }
        if (instance.element) {
            if (this.debug) {
                console.debug('Volume of', instance.id, 'was', instance.element.volume);
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
exports.default = AudioEngine;
//# sourceMappingURL=audio-engine.model.js.map