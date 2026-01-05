import { _decorator, Component, Node, CCFloat, game } from "cc";
import { Singleton } from "../Standard/Singleton";
import { MainGameLoadingCover } from "./MainGameLoadingCover";
import { GameMainPage } from "./UI/GameMainPage";
const { ccclass, property } = _decorator;

/**
 * Bootstraps the main game scene sequence.
 *
 * Currently: set a black full-screen cover, wait a short delay, run fade-out and wait for it to finish.
 * (Further steps will be added later.)
 */
@ccclass("MainGameBoostrapper")
export class MainGameBoostrapper extends Singleton<MainGameBoostrapper> {
    protected doOnStart(): void {
        // Start the full async flow without blocking the engine.
        // console.log(`MainGameBoostrapper: doOnStart called. time ${game.totalTime / 1000}`);
        void this.runProcess();
    }

    // Small helper to await a number of milliseconds.
    private sleep(miliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, miliseconds));
    }

    // The async flow: set cover, wait, run fade out and wait for completion.
    private async runProcess(): Promise<void> {
        // console.log(`MainGameBoostrapper: runProcess started. time ${game.totalTime / 1000}`);
        const loadingCover = MainGameLoadingCover.getInstance<MainGameLoadingCover>();
        // warn if no loading cover is present.
        if (!loadingCover) {
            console.warn("MainGameLoadingCover singleton instance not found in Main scene.");
        }

        // Ensure the cover is immediately black and opaque at scene open.
        if (loadingCover) {
            loadingCover.coverScreen();
            // console.log(`MainGameLoadingCover: coverScreen called. time ${game.totalTime / 1000}`);
        }

        // Initial short delay so the opaque cover is visible briefly.
        await this.sleep(100);

        // Fade out to reveal the content, then wait for fade to finish.
        if (loadingCover) {
            // console.log(`MainGameLoadingCover: runFadeOut called. time ${game.totalTime / 1000}`);
            loadingCover.runFadeOut();
            // Wait for the fade out animation to finish.
            await this.sleep(loadingCover.fadeAnimationDuration * 1000);
        }

        // Show the main UI page (if present) now that loading is finished.
        this.openMainPage();
    }

    /**
     * Show the main UI page by fetching the GameMainPage singleton and calling show().
     * Logs warnings if the singleton or UIPage component is missing.
     */
    private openMainPage(): void {
        const gameMainPage = GameMainPage.getInstance<GameMainPage>();
        if (!gameMainPage) {
            console.warn("GameMainPage singleton instance not found in Main scene.");
            return;
        }

        const uiPage = gameMainPage.getUiPage();
        if (uiPage) {
            uiPage.show();
        } else {
            console.warn("GameMainPage: UIPage component not found; cannot call show().");
        }
    }
}
