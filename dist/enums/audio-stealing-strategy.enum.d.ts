/**
 * Strategies when max instances of a specific audio type is reached
 */
export declare enum AudioStealingStrategyEnum {
    /**
     * Stop the oldest audio instance first.
     */
    OLDEST = "oldest",
    /**
     * Stop the quietest audio instance first.
     */
    QUIETEST = "quietest",
    /**
     * Prevent creation of new instances until one of the existing instances ends
     */
    NONE = "none"
}
//# sourceMappingURL=audio-stealing-strategy.enum.d.ts.map