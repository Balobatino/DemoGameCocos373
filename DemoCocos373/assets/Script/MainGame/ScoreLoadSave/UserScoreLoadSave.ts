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
     * Save player's score (and turn count) for a specific level.
     * If a score already exists, it will only be overwritten when the
     * new score is higher than the saved one. When writing, both the
     * score and the associated turn count are persisted.
     * @param levelIndex - level index
     * @param score - score to save (integer)
     * @param turnCount - number of turns used to achieve the score (integer)
     */
    public static saveScore(levelIndex: number, score: number, turnCount: number = 0): void {
        const key = this.getScoreKey(levelIndex);
        const turnKey = this.getTurnKey(levelIndex);

        const existingStr = sys.localStorage.getItem(key);
        if (existingStr !== null) {
            const existing = parseInt(existingStr, 10);
            // Corrupt value, or new score higher than the existing score -> overwrite with new score & turns
            if (Number.isNaN(existing) || score > existing) {
                sys.localStorage.setItem(key, String(score));
                sys.localStorage.setItem(turnKey, String(turnCount));
            }
            return;
        }

        // No existing score -> set both score and turns
        sys.localStorage.setItem(key, String(score));
        sys.localStorage.setItem(turnKey, String(turnCount));
    }

    /**
     * Get saved score and turn count for a specific level. If not found, initialize to 0.
     * @param levelIndex - level index
     * @returns object with { score, turnCount }
     */
    public static getScoreData(levelIndex: number): { score: number; turnCount: number } {
        const key = this.getScoreKey(levelIndex);
        const turnKey = this.getTurnKey(levelIndex);

        // Retrieve score
        let score = 0;
        const existingStr = sys.localStorage.getItem(key);
        if (existingStr !== null) {
            const val = parseInt(existingStr, 10);
            if (Number.isNaN(val)) {
                console.warn(`UserScoreLoadSave: corrupted value for key ${key}, resetting to 0`);
                sys.localStorage.setItem(key, "0");
            } else {
                score = val;
            }
        } else {
            sys.localStorage.setItem(key, "0");
        }

        // Retrieve turn count
        let turnCount = 0;
        const existingTurnStr = sys.localStorage.getItem(turnKey);
        if (existingTurnStr !== null) {
            const tv = parseInt(existingTurnStr, 10);
            if (Number.isNaN(tv)) {
                console.warn(`UserScoreLoadSave: corrupted value for key ${turnKey}, resetting to 0`);
                sys.localStorage.setItem(turnKey, "0");
            } else {
                turnCount = tv;
            }
        } else {
            sys.localStorage.setItem(turnKey, "0");
        }

        return { score, turnCount };
    }

    // ----------------------------------------
    // ------- Private static

    // Single prefix constant to avoid repeating the literal in multiple places.
    private static readonly SCORE_PREFIX = "Score_";
    private static readonly TURN_PREFIX = "Turns_";

    private static getScoreKey(levelIndex: number): string {
        return this.SCORE_PREFIX + levelIndex;
    }

    private static getTurnKey(levelIndex: number): string {
        return this.TURN_PREFIX + levelIndex;
    }
}
