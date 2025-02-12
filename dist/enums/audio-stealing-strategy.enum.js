"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioStealingStrategyEnum = void 0;
/**
 * Strategies when max instances of a specific audio type is reached
 */
var AudioStealingStrategyEnum;
(function (AudioStealingStrategyEnum) {
    /**
     * Stop the oldest audio instance first.
     */
    AudioStealingStrategyEnum["OLDEST"] = "oldest";
    /**
     * Stop the quietest audio instance first.
     */
    AudioStealingStrategyEnum["QUIETEST"] = "quietest";
    /**
     * Prevent creation of new instances until one of the existing instances ends
     */
    AudioStealingStrategyEnum["NONE"] = "none";
})(AudioStealingStrategyEnum || (exports.AudioStealingStrategyEnum = AudioStealingStrategyEnum = {}));
//# sourceMappingURL=audio-stealing-strategy.enum.js.map