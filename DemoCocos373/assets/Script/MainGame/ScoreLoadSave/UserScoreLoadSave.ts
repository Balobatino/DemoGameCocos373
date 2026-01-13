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
     * If levelIndex = 0, then we set turnCount to 1 to unlock the first level.
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
                // Unlock the first level by default
                if (levelIndex === 0 && turnCount === 0) {
                    turnCount = 1;
                }
                sys.localStorage.setItem(turnKey, String(turnCount));
            } else {
                turnCount = tv;
            }
        } else {
            // Unlock the first level by default
            if (levelIndex === 0 && turnCount === 0) {
                turnCount = 1;
            }
            sys.localStorage.setItem(turnKey, String(turnCount));
        }

        return { score, turnCount };
    }

    /**
     * Ensure a level is unlocked in persistent storage. If `turnCount` is 0 for the level,
     * this method sets its turn count to 1 so it becomes selectable.
     * @param levelIndex - index of the level to ensure unlocked
     */
    public static checkUnlockLevel(levelIndex: number): void {
        const data = this.getScoreData(levelIndex);
        if (data.turnCount === 0) {
            const turnKey = this.getTurnKey(levelIndex);
            sys.localStorage.setItem(turnKey, "1");
            //console.log(`UserScoreLoadSave: unlocked level ${levelIndex} (set turnCount = 1)`);
        }
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
