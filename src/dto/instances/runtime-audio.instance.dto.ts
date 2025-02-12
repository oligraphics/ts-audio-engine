export type RuntimeAudioInstanceDto = {
  id: string;
  typeId: string;
  url: string | string[];
  volume: number;
  pitch: number;
  variant: number;
  element: HTMLAudioElement | undefined;
  elements: HTMLAudioElement[];
};
