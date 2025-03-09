export type RuntimeAudioInstanceDto = {
  id: string;
  typeId: string;
  url: string | string[];
  baseVolume: number;
  volumeMultiplier: number;
  get volume(): number;
  pitch: number;
  /**
   * Set to <code>false</code> once the audio element reports the end of the track
   */
  playing: boolean;
  variant: number;
  element: HTMLAudioElement | undefined;
  elements: HTMLAudioElement[];
};
