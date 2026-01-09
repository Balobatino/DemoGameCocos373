import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("GameStats")
export class GameStats {
    public static selectLevelIndex: number = 0;
    public static matchingScore: number = 0;

    public static turnCount: number = 0;
    public static matchCount: number = 0;

    public static resetStatsForNewGame(): void {
        this.matchingScore = 0;
        this.turnCount = 0;
        this.matchCount = 0;
    }
}
