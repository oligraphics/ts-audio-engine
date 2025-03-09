import { AudioEngine } from './audio-engine.model';
import { AudioConfigurationDto } from '../dto/configurations/audio.configuration.dto';
import { RuntimeAudioInstanceDto } from '../dto/instances/runtime-audio.instance.dto';
import { PlayOptionsDto } from '../dto/options/play.options.dto';

export type SingleTrackAudioConfigurationDto = {
  fadeIn?: boolean;
  fadeOut?: boolean;
} & AudioConfigurationDto;

export class SingleTrackMixer {
  private readonly engine: AudioEngine;
  private readonly transitionDurationMs: number;

  private disposed = false;
  private playing = false;

  private previousInstance: RuntimeAudioInstanceDto | undefined = undefined;
  private instance: RuntimeAudioInstanceDto | undefined = undefined;

  private fadeIn = true;
  private fadeOut = true;

  private lastTick = 0;

  get volume() {
    return this.engine.volume;
  }

  set volume(value: number) {
    this.engine.volume = value;
  }

  get debug() {
    return this.engine.debug;
  }

  set debug(value: boolean) {
    this.engine.debug = value;
  }

  constructor(
    tracks: SingleTrackAudioConfigurationDto[],
    options?: { transitionDurationMs?: number },
  ) {
    this.engine = new AudioEngine(tracks);
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

  private update() {
    if (!this.playing) {
      return;
    }
    const time = Date.now();
    const deltaTime = (time - this.lastTick) / this.transitionDurationMs;
    if (this.instance && this.instance.volume < 1) {
      const volume = this.instance.volume;
      this.engine.setVolume(
        this.instance,
        this.fadeIn ? Math.min(1, volume + deltaTime) : 1,
      );
    }
    if (this.previousInstance) {
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

  play(typeId: string, options?: PlayOptionsDto) {
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
    const type = this.engine.getType(
      typeId,
    ) as SingleTrackAudioConfigurationDto;
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
      const type = this.engine.getType(
        this.instance.typeId,
      ) as SingleTrackAudioConfigurationDto;
      if (type?.fadeOut ?? true) {
        this.previousInstance = this.instance;
        if (this.debug) {
          console.debug('Fade out single track', this.previousInstance?.typeId);
        }
      } else {
        this.engine.pause(this.instance);
        if (this.debug) {
          console.debug('Stop single track', this.instance.typeId);
        }
      }
    }
    this.instance = undefined;
  }
}
