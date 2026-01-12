import { _decorator, Component, Node, Vec2 } from "cc";
const { ccclass, property } = _decorator;

/**
 * GameStats: Static class to hold game statistics and state.
 *
 * Provides helper methods to update score and counters from gameplay code.
 */
@ccclass("GameStats")
export class GameStats {
    //--------------------------
    //--- Public Static Properties
    /** Index of the selected level (set when user chooses a level). */
    public static selectLevelIndex: number = 0;

    /** Size of the current level (set when level is loaded). */
    public static levelSize: Vec2 = new Vec2(0, 0);

    /** Total accumulated score for the current match/session. */
    public static matchingScore: number = 0;

    /** Number of turns (attempts) so far in the current level. */
    public static turnCount: number = 0;

    /** Number of successful matches found in the current level. */
    public static matchCount: number = 0;

    /** Default points awarded on a successful match. */
    public static readonly DEFAULT_MATCH_SUCCESS_SCORE: number = 100;

    //--------------------------
    //--- Public Static Methods
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

    /**
     * Number of pairs in this level (assumes even number of tiles).
     * Floors size components to integers and computes floor((cols * rows) / 2).
     */
    public static getCurrentLevelPairCount(): number {
        const tiles = this.levelSize.x * this.levelSize.y;
        return Math.floor(tiles / 2);
    }

    // --------------------------
    // ------- Star rating calculation

    /**
     * Calculate star rating based on pair count and turns using a simple percentage rule:
     * - 3 stars: turnCount < pairCount * 1.30
     * - 2 stars: turnCount < pairCount * 1.80
     * - 1 star : otherwise
     */
    public static calculateStarForScore(pairCount: number, turnCount: number): number {
        // Normalize inputs to integers and clamp to 0 for safety.
        const pairs = Math.max(0, Math.floor(pairCount));
        const turns = Math.max(0, Math.floor(turnCount));

        // Guard: invalid level
        if (pairs <= 0) return 0;

        // Compute thresholds (use strict '<' per spec)
        const threeStarThreshold = pairs * 1.3;
        const twoStarThreshold = pairs * 1.8;

        if (turns < threeStarThreshold) return 3;
        if (turns < twoStarThreshold) return 2;
        return 1;
    }

    /**
     * Estimate star rating from a saved numeric score for a level.
     *
     * Because a score does not preserve the number of turns, this function
     * makes a best-effort (optimistic) conversion:
     * - It computes the number of successful matches implied by `score`
     *   using DEFAULT_MATCH_SUCCESS_SCORE.
     * - If the implied matches are at least the required pair count, it
     *   assumes minimal (best-case) turns equal to `pairCount` and returns
     *   the star rating based on that assumption.
     *
     * @param pairCount - number of pairs in the level
     * @param score - saved numeric score for the level
     * @returns estimated star count (0..3); returns 0 if estimation is impossible or invalid inputs
     */
    public static estimateStarFromScore(pairCount: number, score: number): number {
        const pairs = Math.max(0, Math.floor(pairCount));
        if (pairs <= 0) return 0;

        const impliedMatches = Math.max(0, Math.floor(score / this.DEFAULT_MATCH_SUCCESS_SCORE));

        // If the saved score implies fewer matches than needed to finish the level,
        // the save is invalid/unreliable for star conversion.
        if (impliedMatches < pairs) {
            console.warn(`GameStats: cannot estimate stars from score ${score} for pairCount ${pairCount} (implied matches ${impliedMatches}).`);
            return 0;
        }

        // Optimistic assumption: player finished the level using minimal turns (one match per pair).
        const estimatedTurns = pairs;
        return this.calculateStarForScore(pairs, estimatedTurns);
    }
}
