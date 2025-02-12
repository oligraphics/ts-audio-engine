export type RuntimeAudioInstanceDto = {
  id: string;
  typeId: string;
  url: string | string[];
  variant: number;
  element: HTMLAudioElement | undefined;
  elements: HTMLAudioElement[];
};
