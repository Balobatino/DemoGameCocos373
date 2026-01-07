import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Vec2, tween, Vec3, Enum } from "cc";
import { TypedEvent } from "../../Utils/TypedEvent";
import { EasingType, EasingMap } from "../../Standard/UIPage/ElementAnimation/AnimationMapCache";
const { ccclass, property } = _decorator;

@ccclass("PopUpAnimationConfig")
export class PopUpAnimationConfig {
    @property
    public duration: number = 0.15;

    @property({ type: Enum(EasingType) })
    public easing: EasingType = EasingType.Linear;
}

@ccclass("PopDownAnimationConfig")
export class PopDownAnimationConfig {
    @property
    public duration: number = 0.15;

    @property({ type: Enum(EasingType) })
    public easing: EasingType = EasingType.Linear;
}

@ccclass("FlipAnimationConfig")
export class FlipAnimationConfig {
    @property
    public duration: number = 0.2;
}

/**
 * Simple view controller for a grid cell card. Manages display sprite and click handling.
 */
@ccclass("GridCardItem")
export class GridCardItem extends Component {
    //------------------------------
    // Inspector fields (assign in editor)
    // @property({ type: Node })
    // rootDisplay: Node | null = null;

    @property({ type: Node })
    rootBackFace: Node | null = null;

    @property({ type: Node })
    rootFrontFace: Node | null = null;

    @property({ type: Sprite })
    displayCardItem: Sprite | null = null;

    @property({ type: Button })
    mainButton: Button | null = null;

    //------------------------------
    // --- animation config

    // Pop-up animation configuration (inspectable)
    @property({ type: PopUpAnimationConfig })
    public popUpAnimation: PopUpAnimationConfig = new PopUpAnimationConfig();

    // Pop-down animation configuration (inspectable)
    @property({ type: PopDownAnimationConfig })
    public popDownAnimation: PopDownAnimationConfig = new PopDownAnimationConfig();

    // Flip animation configuration (inspectable)
    @property({ type: FlipAnimationConfig })
    public flipAnimation: FlipAnimationConfig = new FlipAnimationConfig();

    //------------------------------
    //--- Private Properties

    // Track active tween for pop-up/pop-down animations so it can be cancelled/replaced
    private _activeTween: any = null;

    //------------------------------
    // Public events
    public readonly onSelected = new TypedEvent<GridCardItem>();

    //------------------------------
    // Lifecycle and state

    private gridPositionData = new Vec2();
    private displaySpriteData: SpriteFrame | null = null;

    onLoad() {
        // Register click handler for configured button.
        this.registerButtonClick();
    }

    onDestroy() {
        this.unregisterButtonClick();
    }

    //------------------------------
    // Public Methods
    /**
     * Configure the logical grid position for this card.
     * @param gridPosition - Position in grid coordinates.
     */
    public setGridPosition(gridPosition: Vec2) {
        this.gridPositionData = gridPosition;
    }

    /**
     * Configure the display sprite for the card.
     * @param sprite - SpriteFrame to display on the card front.
     */
    public setDisplaySprite(sprite: SpriteFrame | null) {
        this.displaySpriteData = sprite;
        if (this.displayCardItem) {
            this.displayCardItem.spriteFrame = sprite;
        }
    }

    /**
     * Activate or deactivate the back face node. Activating back face deactivates front face.
     * @param isActive - Whether back face should be active.
     */
    public activeBackFace(isActive: boolean) {
        if (this.rootBackFace) this.rootBackFace.active = isActive;
        if (this.rootFrontFace) this.rootFrontFace.active = !isActive;
    }

    /**
     * Activate or deactivate the front face node. Activating front face deactivates back face.
     * @param isActive - Whether front face should be active.
     */
    public activeFrontFace(isActive: boolean) {
        if (this.rootFrontFace) this.rootFrontFace.active = isActive;
        if (this.rootBackFace) this.rootBackFace.active = !isActive;
    }

    /**
     * Enable or disable interaction with the main button.
     * @param isActive - Whether interaction should be enabled.
     */
    public setActiveInteraction(isActive: boolean) {
        if (this.mainButton) {
            this.mainButton.interactable = isActive;
        }
    }

    /**
     * Returns true if other card displays the same sprite frame.
     * @param otherCard - Other GridCardItem to compare with.
     */
    public isSameSpriteToCard(otherCard: GridCardItem | null) {
        if (!otherCard) {
            console.error("IsSameSpriteToCard(), otherCard is null");
            return false;
        }
        return this.displaySprite === otherCard.displaySprite;
    }

    //------------------------------
    //--- Animation Methods

    /**
     * Play a pop-up animation on this card's node using the configured
     * `popUpAnimation` duration and easing. Cancels any running pop-up tween
     * before starting a new one. Starts from scale (0,0) and animates to (1,1).
     * @param onComplete - Optional callback when animation finishes
     * @param delay - Optional delay (seconds) before the animation begins
     */
    public playPopUpAnimation(onComplete?: () => void, delay: number = 0) {
        if (!this.node) return;

        // Start from zero scale (invisible) and animate to full size (1,1)
        const z = this.node.scale ? this.node.scale.z : 1;
        this.node.setScale(0, 0, z);
        this.runScaleTween(this.node, this.popUpAnimation.duration, new Vec3(1, 1, z), EasingMap.get(this.popUpAnimation.easing), onComplete, delay);
    }

    /**
     * Play a pop-down animation on this card's node using the configured
     * `popDownAnimation` duration and easing. Cancels any running tween before starting.
     * Starts from scale (1,1) and animates to (0,0).
     * @param onComplete - Optional callback when animation finishes
     */
    public playPopDownAnimation(onComplete?: () => void) {
        if (!this.node) return;

        const z = this.node.scale ? this.node.scale.z : 1;
        this.node.setScale(1, 1, z);
        this.runScaleTween(this.node, this.popDownAnimation.duration, new Vec3(0, 0, z), EasingMap.get(this.popDownAnimation.easing), onComplete);
    }

    /**
     * Play flip animation that transitions from back-face to front-face.
     * Two phases: 1) show back face and scale X 1->0 (half duration),
     * 2) swap to front face and scale X 0->1 (half duration).
     *
     * Notes/assumptions:
     * - Uses linear easing.
     * - `displayCardItem` should live on the front face; it is enabled/disabled
     *   alongside the front face during the transition.
     */
    public playFlipBackToFrontAnimation(onComplete?: () => void) {
        if (!this.node) return;

        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Require all flip-related nodes to be present
        if (!this.rootBackFace || !this.rootFrontFace || !this.displayCardItem) {
            console.warn("GridCardItem: Missing flip nodes (rootBackFace, rootFrontFace, displayCardItem); cannot perform playFlipBackToFrontAnimation.");
            if (onComplete) onComplete();
            return;
        }

        const half = this.flipAnimation.duration / 2;
        const linearEasing = EasingMap.get(EasingType.Linear);

        // hide front and display items immediately
        this.rootFrontFace.active = false;
        this.displayCardItem.node.active = false;

        // Animate back shrinking, then reveal front and expand
        this.rootBackFace.active = true;
        const z = this.rootBackFace.scale ? this.rootBackFace.scale.z : 1;
        this.rootBackFace.setScale(1, 1, z);

        this.runScaleTween(this.rootBackFace, half, new Vec3(0, 1, z), linearEasing, () => {
            this.rootBackFace.active = false;
            this.rootFrontFace.active = true;
            this.displayCardItem.node.active = true;

            const z2 = this.rootFrontFace.scale ? this.rootFrontFace.scale.z : z;
            this.rootFrontFace.setScale(0, 1, z2);
            this.runScaleTween(this.rootFrontFace, half, new Vec3(1, 1, z2), linearEasing, onComplete);
        });
    }

    /**
     * Play flip animation that transitions from front-face to back-face (mirror of back->front).
     */
    public playFlipFrontToBackAnimation(onComplete?: () => void) {
        if (!this.node) return;

        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Require all flip-related nodes to be present
        if (!this.rootBackFace || !this.rootFrontFace || !this.displayCardItem) {
            console.warn("GridCardItem: Missing flip nodes (rootBackFace, rootFrontFace, displayCardItem); cannot perform playFlipFrontToBackAnimation.");
            if (onComplete) onComplete();
            return;
        }

        const half = this.flipAnimation.duration / 2;
        const linearEasing = EasingMap.get(EasingType.Linear);

        // shrink front face, then enable back face and expand
        const z = this.rootFrontFace.scale ? this.rootFrontFace.scale.z : 1;
        this.rootFrontFace.setScale(1, 1, z);

        this.runScaleTween(this.rootFrontFace, half, new Vec3(0, 1, z), linearEasing, () => {
            this.rootFrontFace.active = false;
            this.displayCardItem.node.active = false;

            this.rootBackFace.active = true;
            const z2 = this.rootBackFace.scale ? this.rootBackFace.scale.z : z;
            this.rootBackFace.setScale(0, 1, z2);
            this.runScaleTween(this.rootBackFace, half, new Vec3(1, 1, z2), linearEasing, onComplete);
        });
    }

    //------------------------------
    //---- helper animation methods
    /**
     * Helper that starts a scale tween on `target`.
     * It sets/clears `_activeTween` and calls `onComplete` when done.
     */
    private runScaleTween(target: Node, duration: number, toScale: Vec3, easingFunc: (t: number) => number, onComplete?: () => void, delay: number = 0) {
        if (!target) {
            if (onComplete) onComplete();
            return;
        }

        // Cancel any previous tween so a new one may take over
        if (this._activeTween) {
            this._activeTween.stop();
            this._activeTween = null;
        }

        // Build tween and optionally include a delay before the scale animation
        let t = tween(target);
        if (delay > 0) {
            t = t.delay(delay);
        }

        t = t.to(duration, { scale: toScale }, { easing: easingFunc }).call(() => {
            this._activeTween = null;
            if (onComplete) onComplete();
        });

        this._activeTween = t;
        t.start();
    }

    //------------------------------
    // Getters
    /** Expose saved grid position */
    public get gridPosition() {
        return this.gridPositionData;
    }

    /** Expose current display sprite */
    public get displaySprite() {
        return this.displaySpriteData;
    }

    //------------------------------
    //--- Button click handler

    private onMainButtonClick() {
        this.onSelected.invoke(this);
    }

    private registerButtonClick(): void {
        if (this.mainButton) {
            this.mainButton.node.on(Button.EventType.CLICK, this.onMainButtonClick, this);
            return;
        }
        console.warn(`GridCardItem: 'mainButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.mainButton) {
            this.mainButton.node.off(Button.EventType.CLICK, this.onMainButtonClick, this);
        }
    }
}
