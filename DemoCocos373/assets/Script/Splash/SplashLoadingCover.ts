import { _decorator, Component, Node, Sprite, Color, tween, easing } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SplashLoadingCover')
export class SplashLoadingCover extends Component {
    // Reference to the full-screen cover sprite (assign in the editor).
    @property(Sprite)
    screenCover: Sprite | null = null;

    // Duration (in seconds) for fade animations.
    @property({ type: Number })
    fadeAnimationDuration = 0.5;

    // Internal reference to the current active Tween so it can be stopped.
    private _activeTween: any | null = null;

    /**
     * Immediately set the cover to black and fully opaque.
     */
    public coverScreen(): void {
        if (!this.screenCover) return;

        // Set to black with full alpha (255 = fully opaque).
        const c = new Color(0, 0, 0, 255);
        this.screenCover.color = c;
    }

    /**
     * Fade the cover from alpha=1 (opaque) to alpha=0 (transparent) over `fadeAnimationDuration` seconds.
     * @param onComplete Optional callback called when the fade finishes.
     */
    public runFadeOut(onComplete?: () => void): void {
        if (!this.screenCover) {
            if (onComplete) onComplete();
            return;
        }

        // Set color to black and fully opaque.
        this.screenCover.color = new Color(0, 0, 0, 255);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween alpha from 255 -> 0
        const t = tween(this.screenCover.color)
            .to(this.fadeAnimationDuration, { a: 0 }, { easing: easing.linear })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    /**
     * Fade the cover from alpha=0 (transparent) to alpha=1 (opaque) over `fadeAnimationDuration` seconds.
     * @param onComplete Optional callback called when the fade finishes.
     */
    public runFadeIn(onComplete?: () => void): void {
        if (!this.screenCover) {
            if (onComplete) onComplete();
            return;
        }

        // Set color to black and fully transparent.
        this.screenCover.color = new Color(0, 0, 0, 0);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween alpha from 0 -> 255
        const t = tween(this.screenCover.color)
            .to(this.fadeAnimationDuration, { a: 255 }, { easing: easing.linear })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    /**
     * Cancel any in-progress fade operation.
     */
    public cancelFade(): void {
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }
    }
}

