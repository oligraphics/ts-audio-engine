import { EventBus } from 'ts-event-bus';
import { RuntimeAudioInstanceDto } from '../dto/instances/runtime-audio.instance.dto';
import { AudioEventTypeEnum } from '../enums/audio-event-type.enum';
import { AudioTimeUpdatedEventDto } from '../dto/events/audio-time-updated.event.dto';
import { AudioPlayedEventDto } from '../dto/events/audio-played.event.dto';
import { AudioVolumeChangedEventDto } from '../dto/events/audio-volume-changed.event.dto';
import { AudioPausedEventDto } from '../dto/events/audio-paused.event.dto';
import { AudioEndedEventDto } from '../dto/events/audio-ended.event.dto';
import { AudioReleasedEventDto } from '../dto/events/audio-released.event.dto';
import { AudioConfigurationDto } from '../dto/configurations/audio.configuration.dto';
import { IdService } from '../services/id.service';
import { AudioStealingStrategyEnum } from '../enums/audio-stealing-strategy.enum';
import { PlayOptionsDto } from '../dto/options/play.options.dto';

export class AudioEngine {
  /**
   * Bus to listen to events within the engine.
   * @see AudioEventTypeEnum
   * @see AudioEventDto
   */
  readonly bus: EventBus = new EventBus();

  private readonly types: Map<string, AudioConfigurationDto> = new Map();
  private readonly cache: Map<string, RuntimeAudioInstanceDto[]> = new Map();
  private readonly playing: Map<string, Map<string, RuntimeAudioInstanceDto>> =
    new Map();

  private _audioConsentReceived = false;
  private _globalVolume = 1;
  private _globalVolumeFactor = 1;

  get audioConsentReceived() {
    return this._audioConsentReceived;
  }

  get volume() {
    return this._globalVolume;
  }

  set volume(value: number) {
    this._globalVolume = value;
    this._globalVolumeFactor = 1 - Math.pow(1 - value, 2);
    for (const playing of this.playing.values()) {
      for (const instance of playing.values()) {
        const element = instance.element;
        if (element) {
          element.volume = instance.volume * this._globalVolumeFactor;
        }
      }
    }
  }

  /**
   * Toggle console logging
   */
  debug = false;

  constructor(audioTypes: AudioConfigurationDto[]) {
    for (const type of audioTypes) {
      this.types.set(type.id, type);
      this.cache.set(type.id, []);
      this.playing.set(type.id, new Map<string, RuntimeAudioInstanceDto>());
      const maxInstances = type.maxInstances ?? 0;
      if (maxInstances > 0) {
        for (let i = 0; i < maxInstances; i++) {
          this.prepareInstance(type.id);
        }
      }
    }

    document.addEventListener('click', this.onDocumentClicked);
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

  getType(typeId: string) {
    return this.types.get(typeId);
  }

  private readonly onDocumentClicked = () => {
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
  prepareInstance(typeId: string): RuntimeAudioInstanceDto | undefined {
    const type = this.types.get(typeId);
    if (type === undefined) {
      console.error('Unknown audio type', typeId);
      return undefined;
    }
    if (this.debug) {
      console.debug('Play', typeId);
    }
    const id = IdService.createRandomId(8);
    const urls = Array.isArray(type.url) ? type.url : [type.url];
    const elements: HTMLAudioElement[] = [];
    const instance = <RuntimeAudioInstanceDto>{
      id,
      typeId,
      url: type.url,
      volume: 1,
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
        this.bus.trigger(AudioEventTypeEnum.TIME_UPDATE, <
          AudioTimeUpdatedEventDto
        >{
          type: AudioEventTypeEnum.TIME_UPDATE,
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
        } else {
          this.release(instance);
        }
        this.bus.trigger(AudioEventTypeEnum.ENDED, <AudioEndedEventDto>{
          type: AudioEventTypeEnum.ENDED,
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

  _getInstance(typeId: string): RuntimeAudioInstanceDto | undefined {
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
    const stealingStrategy =
      type.stealingStrategy ?? AudioStealingStrategyEnum.OLDEST;
    if (this.debug) {
      console.debug(
        'Steal from playing',
        stealingStrategy,
        'available:',
        playing.size,
      );
    }
    let instance: RuntimeAudioInstanceDto | undefined;
    switch (stealingStrategy) {
      case AudioStealingStrategyEnum.OLDEST:
        instance = [...playing.values()].find(() => true);
        break;
      case AudioStealingStrategyEnum.QUIETEST:
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
  play(
    typeId: string,
    options?: PlayOptionsDto,
  ): RuntimeAudioInstanceDto | undefined {
    const instance = this._getInstance(typeId);
    if (instance === undefined) {
      if (this.debug) {
        console.error(
          'Cannot create another instance of type',
          typeId,
          'due to the max instances count',
        );
      }
      return undefined;
    }

    const type = this.types.get(typeId);

    const playing =
      this.playing.get(typeId) ?? new Map<string, RuntimeAudioInstanceDto>();
    playing.set(instance.id, instance);
    this.playing.set(typeId, playing);

    if (this.debug) {
      console.debug('Play', typeId, 'active instances:', playing.size);
    }

    const baseVolume = options?.volume !== undefined ? options.volume : 1;
    const typeVolume = type?.volume ?? 1;
    const randomTypeVolume =
      type?.randomize?.volume !== undefined
        ? Math.random() * type.randomize.volume
        : 0;
    const volume =
      baseVolume *
      (typeVolume - (type?.randomize?.volume ?? 0) / 2 + randomTypeVolume);

    const basePitch = type?.pitch ?? 1;
    const randomPitch =
      type?.randomize?.pitch !== undefined
        ? Math.random() * type.randomize.pitch
        : 0;
    const pitch = basePitch - (type?.randomize?.pitch ?? 0) / 2 + randomPitch;

    instance.volume = volume;
    instance.pitch = pitch;

    for (const element of instance.elements) {
      element.volume = volume * this._globalVolumeFactor;
      element.playbackRate = pitch;
    }

    if (this.debug) {
      console.debug('Volume', volume, 'Pitch', pitch);
    }

    const element =
      instance.elements[Math.floor(Math.random() * instance.elements.length)];
    instance.element = element;
    element.currentTime =
      (options?.timeMs !== undefined ? options.timeMs : 0) / 1000;
    if (this._audioConsentReceived) {
      element.play().catch((e) => console.error(e));
    }
    this.bus.trigger(AudioEventTypeEnum.PLAYED, <AudioPlayedEventDto>{
      type: AudioEventTypeEnum.PLAYED,
      audio: instance,
    });
    return instance;
  }

  /**
   * Set the volume of a sound instance
   */
  setVolume(instance: RuntimeAudioInstanceDto, volume: number) {
    if (this.debug) {
      console.debug('Set volume of', instance.id, 'to', JSON.stringify(volume));
    }
    instance.volume = volume;
    if (instance.element) {
      instance.element.volume = volume * this._globalVolumeFactor;
    }
    this.bus.trigger(AudioEventTypeEnum.VOLUME_CHANGED, <
      AudioVolumeChangedEventDto
    >{
      type: AudioEventTypeEnum.VOLUME_CHANGED,
      audio: instance,
      volume,
    });
  }

  /**
   * Pause a sound instance
   */
  pause(instance: RuntimeAudioInstanceDto) {
    if (instance === undefined) {
      return;
    }
    if (instance.element) {
      instance.element.pause();
    }
    this.bus.trigger(AudioEventTypeEnum.PAUSED, <AudioPausedEventDto>{
      type: AudioEventTypeEnum.PAUSED,
      audio: instance,
    });
  }

  /**
   * Release a sound instance
   */
  release(instance: RuntimeAudioInstanceDto) {
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
    this.bus.trigger(AudioEventTypeEnum.RELEASED, <AudioReleasedEventDto>{
      type: AudioEventTypeEnum.RELEASED,
      audio: instance,
    });
  }
}
