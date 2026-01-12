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
 * Inspector group for UI references used by GridCardItem.
 */
@ccclass("GridCardItemUIReference")
class UIReference {
    @property({ type: Node })
    public rootBackFace: Node | null = null;

    @property({ type: Node })
    public rootFrontFace: Node | null = null;

    @property({ type: Sprite })
    public displayCardSprite: Sprite | null = null;

    @property({ type: Button })
    public mainButton: Button | null = null;
}

/**
 * Simple view controller for a grid cell card. Manages display sprite and click handling.
 */
@ccclass("GridCardItem")
export class GridCardItem extends Component {
    //------------------------------
    // Inspector fields (assign in editor)

    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

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
        if (this.uiRef.displayCardSprite) {
            this.uiRef.displayCardSprite.spriteFrame = sprite;
        }
    }

    /**
     * Activate or deactivate the back face node. Activating back face deactivates front face.
     * @param isActive - Whether back face should be active.
     */
    public activeBackFace(isActive: boolean) {
        if (this.uiRef.rootBackFace) this.uiRef.rootBackFace.active = isActive;
        if (this.uiRef.rootFrontFace) this.uiRef.rootFrontFace.active = !isActive;
    }

    /**
     * Activate or deactivate the front face node. Activating front face deactivates back face.
     * @param isActive - Whether front face should be active.
     */
    public activeFrontFace(isActive: boolean) {
        if (this.uiRef.rootFrontFace) this.uiRef.rootFrontFace.active = isActive;
        if (this.uiRef.rootBackFace) this.uiRef.rootBackFace.active = !isActive;
    }

    /**
     * Enable or disable interaction with the main button.
     * @param isActive - Whether interaction should be enabled.
     */
    public setActiveInteraction(isActive: boolean) {
        if (this.uiRef.mainButton) {
            this.uiRef.mainButton.interactable = isActive;
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
        // Cancel any previous tween so a new one may take over
        tween(this.node).stop();

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
        // Cancel any previous tween so a new one may take over
        tween(this.node).stop();

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
        // Require all flip-related nodes to be present
        if (!this.uiRef.rootBackFace || !this.uiRef.rootFrontFace) {
            console.warn("GridCardItem: Missing flip nodes (rootBackFace, rootFrontFace, displayCardNode); cannot perform playFlipBackToFrontAnimation.");
            if (onComplete) onComplete();
            return;
        }

        const halfDuration = this.flipAnimation.duration / 2;
        const linearEasing = EasingMap.get(EasingType.Linear);

        // hide front and display items immediately (non-null asserted after earlier guard)
        const front = this.uiRef.rootFrontFace!;
        front.active = false;

        // Animate back shrinking, then reveal front and expand
        const back = this.uiRef.rootBackFace!;
        back.active = true;
        back.setScale(1, 1, 1);
        front.setScale(0, 1, 1);

        this.runScaleTween(back, halfDuration, new Vec3(0, 1, 1), linearEasing, () => {
            back.active = false;
            front.active = true;
            this.runScaleTween(front, halfDuration, new Vec3(1, 1, 1), linearEasing, onComplete);
        });
    }

    /**
     * Play flip animation that transitions from front-face to back-face (mirror of back->front).
     */
    public playFlipFrontToBackAnimation(onComplete?: () => void) {
        if (!this.node) return;
        // Require all flip-related nodes to be present
        if (!this.uiRef.rootBackFace || !this.uiRef.rootFrontFace) {
            console.warn("GridCardItem: Missing flip nodes (rootBackFace, rootFrontFace, displayCardNode); cannot perform playFlipFrontToBackAnimation.");
            if (onComplete) onComplete();
            return;
        }

        const halfDuration = this.flipAnimation.duration / 2;
        const linearEasing = EasingMap.get(EasingType.Linear);

        // Ensure initial active states and scales (mirror of back->front)
        const front = this.uiRef.rootFrontFace!;
        const back = this.uiRef.rootBackFace!;
        front.active = true;
        back.active = false;
        front.setScale(1, 1, 1);
        back.setScale(0, 1, 1);

        // shrink front, then enable back and expand
        this.runScaleTween(front, halfDuration, new Vec3(0, 1, 1), linearEasing, () => {
            front.active = false;
            back.active = true;
            this.runScaleTween(back, halfDuration, new Vec3(1, 1, 1), linearEasing, onComplete);
        });
    }

    //------------------------------
    //---- helper animation methods
    /**
     * Helper that starts a scale tween on `target`.
     */
    private runScaleTween(target: Node, duration: number, toScale: Vec3, easingFunc: (t: number) => number, onComplete?: () => void, delay: number = 0) {
        if (!target) {
            if (onComplete) onComplete();
            return;
        }

        // Cancel any previous tween on target
        tween(target).stop();

        // Build tween and optionally include a delay before the scale animation
        let t = tween(target);
        if (delay > 0) {
            t = t.delay(delay);
        }

        t = t.to(duration, { scale: toScale }, { easing: easingFunc }).call(() => {
            if (onComplete) onComplete();
        });

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
        if (this.uiRef.mainButton) {
            this.uiRef.mainButton.node.on(Button.EventType.CLICK, this.onMainButtonClick, this);
            return;
        }
        console.warn(`GridCardItem: 'mainButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.uiRef.mainButton) {
            this.uiRef.mainButton.node.off(Button.EventType.CLICK, this.onMainButtonClick, this);
        }
    }
}
