import { _decorator, Component, sys } from "cc";
const { ccclass } = _decorator;

/**
 * Simple utility to save and load per-level user scores.
 * Uses `sys.localStorage` so it works across web and native targets.
 */
@ccclass("UserScoreLoadSave")
export class UserScoreLoadSave {
    // ----------------------------------------
    // ------- Public static
    /**
     * Save player's score for a specific level.
     * If a score already exists, it will only be overwritten when the
     * new score is higher than the saved one.
     * @param levelIndex - level index
     * @param score - score to save (integer)
     */
    public static saveScore(levelIndex: number, score: number): void {
        const key = this.getScoreKey(levelIndex);

        const existingStr = sys.localStorage.getItem(key);
        if (existingStr !== null) {
            const existing = parseInt(existingStr, 10);
            // Corrupt value, or new score higher than the existing score -> overwrite with new score
            if (Number.isNaN(existing) || score > existing) {
                sys.localStorage.setItem(key, String(score));
            }
            return;
        }

        // No existing score -> set it
        sys.localStorage.setItem(key, String(score));
    }

    /**
     * Get saved score for a specific level. If not found, initialize to 0.
     * @param levelIndex - level index
     * @returns saved score (integer)
     */
    public static getScore(levelIndex: number): number {
        const key = this.getScoreKey(levelIndex);

        const existingStr = sys.localStorage.getItem(key);
        if (existingStr !== null) {
            const val = parseInt(existingStr, 10);
            if (Number.isNaN(val)) {
                // Reset corrupt value to 0
                console.warn(`UserScoreLoadSave: corrupted value for key ${key}, resetting to 0`);
                sys.localStorage.setItem(key, "0");
                return 0;
            }
            return val;
        }

        // Not found: initialize and return 0
        sys.localStorage.setItem(key, "0");
        return 0;
    }

    // ----------------------------------------
    // ------- Private static

    // Single prefix constant to avoid repeating the literal in multiple places.
    private static readonly SCORE_PREFIX = "Score_";

    private static getScoreKey(levelIndex: number): string {
        return this.SCORE_PREFIX + levelIndex;
    }
}
