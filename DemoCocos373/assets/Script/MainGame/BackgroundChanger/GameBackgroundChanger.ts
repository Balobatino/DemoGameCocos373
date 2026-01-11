import { _decorator, Node, Sprite, SpriteFrame, instantiate, tween, Color, isValid, UIOpacity } from "cc";
import { Singleton } from "../../Standard/Singleton";
const { ccclass, property } = _decorator;

/**
 * Data: stores available background sprite frames and transition duration.
 */
@ccclass("BackgroundData")
export class Data {
    /**
     * List of sprite frames that will be cycled as backgrounds.
     */
    @property({ type: SpriteFrame })
    public spriteFrames: SpriteFrame[] = [];

    /**
     * Duration, in seconds, of the fade transition between backgrounds.
     */
    @property
    public transitionDuration = 0.5;
}

/**
 * UIReference: node references used by the background changer.
 */
@ccclass("UIReference")
export class UIReference {
    /**
     * The current background node that contains a Sprite component.
     */
    @property({ type: Node })
    public backgroundSprite: Node | null = null;
}

/**
 * GameBackgroundChanger: manages cycling backgrounds with cross-fade transitions.
 */
@ccclass("GameBackgroundChanger")
export class GameBackgroundChanger extends Singleton<GameBackgroundChanger> {
    /**
     * Configuration data for backgrounds and transition duration.
     */
    @property({ type: Data })
    public data = new Data();

    /**
     * References to UI nodes used by the changer.
     */
    @property({ type: UIReference })
    public ui = new UIReference();

    // Index of the currently shown background in `data.spriteFrames`.
    private currentBgIndex = 0;

    // Prevent overlapping transitions.
    private isTransitioning = false;

    /**
     * Transition to the next background in the data.spriteFrames list.
     *
     * Behavior:
     * - Clone the current background node and set it behind the current node.
     * - Assign the next sprite frame to the clone and set its alpha to 0.
     * - Tween the current sprite alpha from 1 -> 0 and the clone from 0 -> 1.
     * - After transitionDuration, destroy the old node and save the clone as the new background reference.
     */
    public TransitionToNextBackground(): void {
        // Guard: ensure we have a valid current background and at least one sprite frame.
        const bgNode = this.ui.backgroundSprite;
        const frames = this.data.spriteFrames;
        const duration = this.data.transitionDuration;
        if (!bgNode) {
            console.warn("GameBackgroundChanger: backgroundSprite reference is null.");
            return;
        }
        if (!frames || frames.length === 0) {
            console.warn("GameBackgroundChanger: no spriteFrames configured in Data.");
            return;
        }
        if (this.isTransitioning) {
            // Avoid overlapping transitions.
            return;
        }

        const currentSprite = bgNode.getComponent(Sprite);
        if (!currentSprite) {
            console.warn("GameBackgroundChanger: current background node does not have a Sprite component.");
            return;
        }

        // Instantiate a clone of the background node and parent it to the same parent.
        const parent = bgNode.parent!;
        const clone = instantiate(bgNode);
        clone.parent = parent;

        // Place the clone behind the current background by setting a lower sibling index.
        const currentIndex = bgNode.getSiblingIndex();
        clone.setSiblingIndex(Math.max(0, currentIndex - 1));

        // Ensure the clone uses the next sprite frame.
        const cloneSprite = clone.getComponent(Sprite);
        if (!cloneSprite) {
            console.warn("GameBackgroundChanger: cloned node does not have a Sprite component.");
            clone.destroy();
            return;
        }
        // Compute next index.
        const nextIndex = (this.currentBgIndex + 1) % frames.length;
        cloneSprite.spriteFrame = frames[nextIndex];

        // Ensure UIOpacity exists on the current node so we can animate node-level opacity reliably.
        const currentOpacity = bgNode.getComponent(UIOpacity) ?? bgNode.addComponent(UIOpacity);
        currentOpacity.opacity = 255;

        // Keep sprite color alpha fully opaque so UIOpacity controls visibility of the current node only.
        cloneSprite.color = new Color(255, 255, 255, 255);
        currentSprite.color = new Color(255, 255, 255, 255);

        // Mark transitioning and start tween (fade out the current node's UIOpacity).
        this.isTransitioning = true;

        tween(currentOpacity).to(duration, { opacity: 0 }).start();

        // After the transition, swap references and cleanup.
        this.scheduleOnce(() => {
            // Destroy the old background node (the original).
            if (bgNode && isValid(bgNode)) {
                bgNode.destroy();
            }

            // Update UI reference to point to the clone node (now the current background).
            this.ui.backgroundSprite = clone;

            // Update the index and clear transitioning flag.
            this.currentBgIndex = nextIndex;
            this.isTransitioning = false;
        }, duration);
    }
}
