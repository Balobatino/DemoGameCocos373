import { _decorator, Sprite, tween } from "cc";
import { Singleton } from "../Standard/Singleton";
const { ccclass, property } = _decorator;

/**
 * Inspector UI reference for the splash loading bar.
 */
@ccclass("SplashLoadingBarUIReference")
export class UIReference {
    @property({ type: Sprite })
    public loadingFillBar: Sprite | null = null;
}

@ccclass("SplashLoadingBar")
export class SplashLoadingBar extends Singleton<SplashLoadingBar> {
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    protected doOnLoad(): void {
        // Ensure the loading bar is reset to 0 fill on load.
        if (this.uiRef.loadingFillBar) {
            this.uiRef.loadingFillBar.fillRange = 0;
        } else {
            console.warn("SplashLoadingBar: loadingFillBar not assigned in inspector.");
        }
    }

    /**
     * Simulate a loading progression using tweens.
     * Sequence:
     *  - Tween fill from current (assumed 0) to a random target in [0,1].
     *  - Wait for that tween to finish.
     *  - Wait a random delay in [0.5, 0.7]s.
     *  - Tween fill to 1 and wait for it to finish.
     */
    public async fakeLoadingProgress(): Promise<void> {
        const bar = this.uiRef.loadingFillBar;
        if (!bar) {
            console.warn("SplashLoadingBar: cannot run fakeLoadingProgress -- loadingFillBar is null.");
            return;
        }

        // Ensure starting at 0
        bar.fillRange = 0;

        // First tween to a random target
        const target = Math.random();
        const duration1 = 0.3 + Math.random() * 0.2;
        // Start the tween and await its duration
        tween(bar).to(duration1, { fillRange: target }).start();
        await new Promise((r) => setTimeout(r, duration1 * 1000));

        // Random delay
        const delay = 0.3 + Math.random() * 0.3;
        await new Promise((r) => setTimeout(r, delay * 1000));

        // Final tween to fill = 1
        const duration2 = 0.3 + Math.random() * 0.2;
        tween(bar).to(duration2, { fillRange: 1 }).start();
        await new Promise((r) => setTimeout(r, duration2 * 1000));
    }
}
