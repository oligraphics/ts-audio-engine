import { AudioStealingStrategyEnum } from '../../enums/audio-stealing-strategy.enum';

export type AudioConfigurationDto = {
  /**
   * Unique audio type id
   */
  id: string;

  /**
   * If multiple urls are supplied, a random variant is picked each time this is played
   */
  url: string | string[];

  /**
   * @default false
   */
  loop?: boolean;

  /**
   * @default 1
   */
  maxInstances?: number;

  /**
   * @default OLDEST
   */
  stealingStrategy?: AudioStealingStrategyEnum;
};
