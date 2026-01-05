import { _decorator, Component, Node, director, CCFloat, game } from "cc";
import { Singleton } from "../Standard/Singleton";
import { SplashLoadingCover } from "./SplashLoadingCover";
const { ccclass, property } = _decorator;

/**
 * Bootstraps the splash scene sequence.
 *
 * Sequence (per design):
 *  - Immediately set a black full-screen cover.
 *  - Wait 0.5s, then fade out the cover.
 *  - Wait for fade-out to complete and for `splashDuration`.
 *  - Fade the cover back in, then load the "Main" scene.
 */
@ccclass("SplashSceneBootstrapper")
export class SplashSceneBootstrapper extends Singleton<SplashSceneBootstrapper> {
    // Duration of the splash hold (in seconds).
    @property({ type: CCFloat })
    splashDuration: number = 2.0;

    protected doOnStart(): void {
        // Start the full async splash flow without blocking the engine.
        // log
        console.log(`SplashSceneBootstrapper: doOnStart called. time ${game.totalTime / 1000}`);
        void this.runProcess();
    }

    // Small helper to await a number of milliseconds.
    private sleep(miliseconds: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, miliseconds));
    }

    // The async splash flow described above.
    private async runProcess(): Promise<void> {
        console.log(`SplashSceneBootstrapper: runProcess started. time ${game.totalTime / 1000}`);
        const loadingCover = SplashLoadingCover.getInstance<SplashLoadingCover>();
        // warn if no loading cover is present.
        if (!loadingCover) {
            console.warn("SplashLoadingCover singleton instance not found in Splash scene.");
        }

        // Ensure the cover is immediately black and opaque at scene open.
        if (loadingCover) {
            loadingCover.coverScreen();
            console.log(`SplashLoadingCover: coverScreen called. time ${game.totalTime / 1000}`);
        }

        // Initial short delay so the opaque cover is visible briefly.
        await this.sleep(500);

        // Fade out to reveal the splash content.
        if (loadingCover) {
            console.log(`SplashLoadingCover: runFadeOut called. time ${game.totalTime / 1000}`);
            loadingCover.runFadeOut();
            // Wait for the fade out animation to finish.
            await this.sleep(loadingCover.fadeAnimationDuration * 1000);
        }

        // Keep the splash visible for the configured duration.
        console.log(`SplashSceneBootstrapper: waiting splash duration ${this.splashDuration}s. time ${game.totalTime / 1000}`);
        await this.sleep(this.splashDuration * 1000);

        // Fade back to opaque before switching scenes.
        if (loadingCover) {
            console.log(`SplashLoadingCover: runFadeIn called. time ${game.totalTime / 1000}`);
            loadingCover.runFadeIn();
            await this.sleep(loadingCover.fadeAnimationDuration * 1000);
        }

        // Finally load the main scene.
        console.log(`SplashSceneBootstrapper: loading Main scene. time ${game.totalTime / 1000}`);
        director.loadScene("Main");
    }
}
