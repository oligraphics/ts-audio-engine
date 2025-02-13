import { AudioConfigurationDto } from '../dto/configurations/audio.configuration.dto';
import { PlayOptionsDto } from '../dto/options/play.options.dto';
export type SingleTrackAudioConfigurationDto = {
    fadeIn?: boolean;
    fadeOut?: boolean;
} & AudioConfigurationDto;
export declare class SingleTrackMixer {
    private readonly engine;
    private readonly transitionDurationMs;
    private disposed;
    private playing;
    private previousInstance;
    private instance;
    private fadeIn;
    private fadeOut;
    private lastTick;
    get volume(): number;
    set volume(value: number);
    get debug(): boolean;
    set debug(value: boolean);
    constructor(tracks: SingleTrackAudioConfigurationDto[], options?: {
        transitionDurationMs?: number;
    });
    start(): void;
    private update;
    stop(): void;
    dispose(): void;
    play(typeId: string, options?: PlayOptionsDto): void;
    playEmpty(): void;
    _endCurrent(): void;
}
//# sourceMappingURL=single-track-mixer.model.d.ts.map