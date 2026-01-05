import { _decorator, Component, Node, Sprite, Color, tween, easing, Enum, CCFloat, UIOpacity } from "cc";
import { Singleton } from "../Standard/Singleton";
const { ccclass, property } = _decorator;

/**
 * Component that manages a full-screen main-game loading cover with fade-in and fade-out animations.
 */
@ccclass("MainGameLoadingCover")
export class MainGameLoadingCover extends Singleton<MainGameLoadingCover> {
    //--------------------------
    //--------- Properties -----

    // Reference to the full-screen cover sprite (assign in the editor).
    @property(Sprite)
    screenCover: Sprite | null = null;

    // Duration (in seconds) for fade animations.
    @property({ type: CCFloat })
    fadeAnimationDuration = 0.5;

    //------------------------------
    //--------- Private Members
    // Internal reference to the current active Tween so it can be stopped.
    private _activeTween: any | null = null;

    // Cached UIOpacity component (added on demand).
    private uiOpacity: UIOpacity | null = null;

    //------------------------------
    //--------- Lifecycle Methods
    protected doOnDestroy(): void {
        // Clean up any active tween on destroy.
        this.cancelFade();
    }

    protected doOnLoad(): void {
        if (!this.screenCover) return;
        // Cache UIOpacity at load time to avoid repeated lookups and to ensure it exists.
        this.uiOpacity = this.screenCover.node.getComponent(UIOpacity) ?? this.screenCover.node.addComponent(UIOpacity);
    }

    //------------------------------
    //--------- Public Methods -----

    private getNodeOpacity(): number {
        if (this.uiOpacity) return this.uiOpacity.opacity;
        // If we can't get a UIOpacity for some reason, return fully opaque as a safe default.
        return 255;
    }

    private setNodeOpacity(value: number): void {
        // set opacity
        if (!this.uiOpacity) return;
        this.uiOpacity.opacity = value;
        // Ensure the sprite color alpha remains fully opaque so UIOpacity controls visibility.
        // Setting color alpha to 0 would make the visual stay invisible regardless of UIOpacity.
        if (!this.screenCover) return;
        const c = this.screenCover.color;
        this.screenCover.color = new Color(c.r, c.g, c.b, 255);
    }

    /**
     * Immediately set the cover to black and fully opaque.
     */
    public coverScreen(): void {
        if (!this.screenCover) return;
        // active the sprite first, in Editor we disable it by default so it won't block view
        if (!this.screenCover) return;
        this.screenCover.enabled = true;
        // Ensure sprite is black and node is fully opaque.
        this.screenCover.color = new Color(0, 0, 0, 255);
        this.setNodeOpacity(255);
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

        // active the sprite first, in Editor we disable it by default so it won't block view
        if (!this.screenCover) return;
        this.screenCover.enabled = true;

        // Ensure sprite is black and node starts fully opaque.
        this.screenCover.color = new Color(0, 0, 0, 255);
        this.setNodeOpacity(255);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween the UIOpacity component (preferred).
        // console.log(`MainGameLoadingCover: runFadeOut started (duration=${this.fadeAnimationDuration}s)`);
        if (!this.uiOpacity) {
            console.warn("MainGameLoadingCover: UIOpacity component missing; can't animate opacity reliably.");
            if (onComplete) onComplete();
            return;
        }
        const t = tween(this.uiOpacity)
            .to(this.fadeAnimationDuration, { opacity: 0 }, { easing: easing.linear })
            .call(() => {
                this._activeTween = null;
                // console.log(`MainGameLoadingCover: runFadeOut complete`);
                if (onComplete) onComplete();
            });
        // Set active tween and start it.
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

        // enable the sprite first, in Editor we disable it by default so it won't block view
        if (!this.screenCover) return;
        this.screenCover.enabled = true;

        // Ensure sprite starts black; keep it transparent via UIOpacity (not color alpha).
        // Setting color alpha to 0 would make the visual stay invisible regardless of UIOpacity.
        this.screenCover.color = new Color(0, 0, 0, 255);
        this.setNodeOpacity(0);

        // Stop any active tween.
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Tween the UIOpacity component (preferred).
        // console.log(`MainGameLoadingCover: runFadeIn started (duration=${this.fadeAnimationDuration}s)`);
        if (!this.uiOpacity) {
            console.warn("MainGameLoadingCover: UIOpacity component missing; can't animate opacity reliably.");
            if (onComplete) onComplete();
            return;
        }
        const t = tween(this.uiOpacity)
            .to(this.fadeAnimationDuration, { opacity: 255 }, { easing: easing.linear })
            .call(() => {
                this._activeTween = null;
                console.log(`MainGameLoadingCover: runFadeIn complete`);
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
