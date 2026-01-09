import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

/**
 * GameStats: Static class to hold game statistics and state.
 *
 * Provides helper methods to update score and counters from gameplay code.
 */
@ccclass("GameStats")
export class GameStats {
    /** Index of the selected level (set when user chooses a level). */
    public static selectLevelIndex: number = 0;

    /** Total accumulated score for the current match/session. */
    public static matchingScore: number = 0;

    /** Number of turns (attempts) so far in the current level. */
    public static turnCount: number = 0;

    /** Number of successful matches found in the current level. */
    public static matchCount: number = 0;

    /** Default points awarded on a successful match. */
    public static readonly DEFAULT_MATCH_SUCCESS_SCORE: number = 100;

    /**
     * Reset all tracked stats to initial values at the start of a new game/level.
     */
    public static resetStatsForNewGame(): void {
        this.matchingScore = 0;
        this.turnCount = 0;
        this.matchCount = 0;
    }

    /**
     * Record a successful match. Increments match count and awards points.
     * @param points - Points to award for this match (default: DEFAULT_MATCH_SUCCESS_SCORE).
     */
    public static recordMatchSuccess(points: number = GameStats.DEFAULT_MATCH_SUCCESS_SCORE): void {
        if (points <= 0) return;
        this.matchCount++;
        this.matchingScore += points;
        this.turnCount++;
    }

    /**
     * Record a failed match attempt. Increments the turn count.
     */
    public static recordMatchFail(): void {
        this.turnCount++;
    }
}
