import { _decorator, Component, Button, Label, Node } from "cc";
import { TypedEvent } from "../../../Utils/TypedEvent";
const { ccclass, property } = _decorator;

/**
 * Inspector group for UI references used by GameLevelSelectItem.
 */
@ccclass("GameLevelSelectItemUIReference")
export class UIReference {
    @property({ type: Button })
    public selectButton: Button | null = null;

    @property({ type: Label })
    public levelLabel: Label | null = null;

    @property({ type: [Node] })
    public starOnList: Node[] = [];

    @property({ type: Node })
    public lockedIcon: Node | null = null;
}

/**
 * GameLevelSelectItem: Represents a selectable level item.
 * Exposes `onSelected` so consumers can react when this item is chosen.
 */
@ccclass("GameLevelSelectItem")
export class GameLevelSelectItem extends Component {
    //------------------------------
    // Exposed inspector properties

    /** Numeric index representing the level. Set in inspector or by code. */
    public levelIndex = -1;

    /**
     * Grouped UI references for this item. Assign the button, label and star nodes
     * in the inspector under this object for better organization.
     */
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    // Public events

    /** Event fired when this item is selected. Payload: levelIndex (number). */
    public readonly onSelected = new TypedEvent<number>();

    //------------------------------
    // Lifecycle

    onLoad(): void {
        this.registerButtonClick();
    }

    onDestroy(): void {
        this.unregisterButtonClick();
        // Clear any remaining listeners attached to this event.
        this.onSelected.clear();
    }

    //-----------------------------
    // Public Methods

    /**
     * Set the numeric index representing the level.
     * Also updates `levelLabel` text (shows 1-based number) when assigned.
     */
    /**
     * Set basic info for this level item.
     * @param index - zero-based level index
     * @param starAchieved - precomputed number of stars to display (0..3)
     */
    public setInfo(index: number, starAchieved: number): void {
        this.levelIndex = index;

        if (this.uiRef.levelLabel) {
            // Display human-friendly 1-based level number
            this.uiRef.levelLabel.string = String(index + 1);
        }

        // Update UI using the provided star count (no estimation performed here)
        if (!Number.isFinite(starAchieved) || starAchieved < 0) {
            console.warn(`GameLevelSelectItem: invalid starAchieved (${starAchieved}) for level ${index}; defaulting to 0.`);
            starAchieved = 0;
        }

        this.updateStarDisplay(Math.floor(starAchieved));
    }

    /** Update the star display based on the given star count.
     * Activates the first N star nodes in `starOnList`.
     */
    public updateStarDisplay(starCount: number): void {
        // Load saved star count for this level and update star nodes (if any).
        if (this.uiRef.starOnList && this.uiRef.starOnList.length > 0) {
            if (Number.isNaN(starCount) || starCount < 0) starCount = 0;
            if (starCount > this.uiRef.starOnList.length) {
                console.warn(`GameLevelSelectItem: saved stars (${starCount}) exceed available star nodes (${this.uiRef.starOnList.length}). Clamping.`);
                starCount = this.uiRef.starOnList.length;
            }

            for (let i = 0; i < this.uiRef.starOnList.length; i++) {
                const node = this.uiRef.starOnList[i];
                if (node) node.active = i < starCount;
            }
        }
    }

    /**
     * Set or clear the locked visual state for this item.
     * When locked, the `lockedIcon` node is enabled and the `selectButton` is disabled.
     * @param isLocked - true to lock (disable interaction), false to unlock
     */
    public setActiveLock(isLocked: boolean): void {
        if (this.uiRef.lockedIcon) {
            this.uiRef.lockedIcon.active = isLocked;
        }

        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.interactable = !isLocked;
        }
    }

    //------------------------------
    // Private

    private registerButtonClick(): void {
        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.node.on(Button.EventType.CLICK, this.handleSelectClicked, this);
            return;
        }

        // If no Button assigned, warn so caller can attach a handler another way.
        console.warn(`GameLevelSelectItem: 'uiRef.selectButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.uiRef.selectButton) {
            this.uiRef.selectButton.node.off(Button.EventType.CLICK, this.handleSelectClicked, this);
        }
    }

    private handleSelectClicked(): void {
        // Dispatch the level index to listeners.
        this.onSelected.invoke(this.levelIndex);
    }
}
