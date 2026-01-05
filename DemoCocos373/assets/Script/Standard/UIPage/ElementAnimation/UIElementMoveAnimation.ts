import { _decorator, Enum, Node, Vec2, Vec3, tween } from "cc";
import { BaseUIElementAnimation } from "../BaseUIElementAnimation";
import { EasingType, EasingMap } from "./AnimationMapCache";
const { ccclass, property } = _decorator;

/**
 * UIElementMoveAnimation
 *
 * Animates a node's 2D position relative to a cached `defaultPosition`.
 * Exposes show/hide offsets, durations and easing types and provides
 * public `show()` / `hide()` methods that use the project's centralized
 * `EasingMap` and Cocos' `tween` system.
 */
@ccclass("UIElementMoveAnimation")
export class UIElementMoveAnimation extends BaseUIElementAnimation {
    // Cached default position (world-local 2D position) captured in onLoad().
    @property
    public defaultPosition: Vec2 = new Vec2(0, 0);

    // Show animation configuration
    @property
    public showDuration: number = 0.2;

    // Delay before the show animation starts (seconds).
    @property
    public showDelay: number = 0;

    @property({ type: Enum(EasingType) })
    public showEasing: EasingType = EasingType.Linear;

    @property
    public showFrom: Vec2 = new Vec2(0, 0);

    @property
    public showTo: Vec2 = new Vec2(0, 0);

    // Hide animation configuration
    @property
    public hideDuration: number = 0.15;

    // Delay before the hide animation starts (seconds).
    @property
    public hideDelay: number = 0;

    @property({ type: Enum(EasingType) })
    public hideEasing: EasingType = EasingType.Linear;

    @property
    public hideFrom: Vec2 = new Vec2(0, 0);

    @property
    public hideTo: Vec2 = new Vec2(0, 0);

    // Track active tween so we can cancel/replace it when necessary.
    private _activeTween: any = null;

    // Capture the node's current position as the default position for offset calculations.
    onLoad() {
        if (!this.node) return;
        const p = this.node.position;
        this.defaultPosition = new Vec2(p.x, p.y);
    }

    /**
     * Play the show animation. Offsets are relative to `defaultPosition`.
     */
    public show(onComplete?: () => void): void {
        if (!this.node) return;

        // cancel any in-progress tween
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        const fromOffset = this.showFrom;
        const toOffset = this.showTo;

        const fromPos = new Vec2(this.defaultPosition.x + fromOffset.x, this.defaultPosition.y + fromOffset.y);
        const toPos = new Vec2(this.defaultPosition.x + toOffset.x, this.defaultPosition.y + toOffset.y);
        const z = this.node.position ? this.node.position.z : 0;

        // Immediately set to the "from" position
        this.node.setPosition(fromPos.x, fromPos.y, z);

        const t = tween(this.node)
            .delay(this.showDelay)
            .to(this.showDuration, { position: new Vec3(toPos.x, toPos.y, z) }, { easing: EasingMap.get(this.showEasing) })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    /**
     * Play the hide animation. Offsets are relative to `defaultPosition`.
     */
    public hide(onComplete?: () => void): void {
        if (!this.node) return;

        // cancel any in-progress tween
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        const fromOffset = this.hideFrom;
        const toOffset = this.hideTo;

        const fromPos = new Vec2(this.defaultPosition.x + fromOffset.x, this.defaultPosition.y + fromOffset.y);
        const toPos = new Vec2(this.defaultPosition.x + toOffset.x, this.defaultPosition.y + toOffset.y);
        const z = this.node.position ? this.node.position.z : 0;

        // Immediately set to the "from" position
        this.node.setPosition(fromPos.x, fromPos.y, z);

        const t = tween(this.node)
            .delay(this.hideDelay)
            .to(this.hideDuration, { position: new Vec3(toPos.x, toPos.y, z) }, { easing: EasingMap.get(this.hideEasing) })
            .call(() => {
                this._activeTween = null;
                if (onComplete) onComplete();
            });

        this._activeTween = t;
        t.start();
    }

    // Ensure compatibility with BaseUIElementAnimation hooks
    public playShowAnimation(): void {
        this.show();
    }

    public playHideAnimation(): void {
        this.hide();
    }
}
