import { _decorator, Component, Button, Label, Node } from "cc";
import { TypedEvent } from "../../../Utils/TypedEvent";
import { UserScoreLoadSave } from "../../ScoreLoadSave/UserScoreLoadSave";
const { ccclass, property } = _decorator;

/**
 * GameLevelSelectItem: Represents a selectable level item.
 * Exposes `onSelected` so consumers can react when this item is chosen.
 */
@ccclass("GameLevelSelectItem")
export class GameLevelSelectItem extends Component {
    //------------------------------
    // Exposed inspector properties

    /** Numeric index representing the level. Set in inspector or by code. */
    @property
    levelIndex = -1;

    /** Optional Button used to trigger selection. Assign in inspector for clickable UI. */
    @property({ type: Button })
    selectButton: Button | null = null;

    /** Optional Label used to display the human-visible level number (shows index+1). */
    @property({ type: Label })
    levelLabel: Label | null = null;

    /** List of star nodes to display achievement (activate first N nodes). */
    @property({ type: [Node] })
    starOnList: Node[] = [];

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
    public setLevelIndex(index: number): void {
        this.levelIndex = index;

        if (this.levelLabel) {
            // Display human-friendly 1-based level number
            this.levelLabel.string = String(index + 1);
        }

        // Load saved star count for this level and update star nodes (if any).
        if (this.starOnList && this.starOnList.length > 0) {
            // Note: We interpret the stored numeric value as a star count (0..N).
            let savedStarCount = UserScoreLoadSave.getScore(index);
            let roundedNumStars = Math.floor(Number(savedStarCount));

            if (Number.isNaN(roundedNumStars) || roundedNumStars < 0) roundedNumStars = 0;
            if (roundedNumStars > this.starOnList.length) {
                console.warn(`GameLevelSelectItem: saved stars (${roundedNumStars}) exceed available star nodes (${this.starOnList.length}) for level ${index}. Clamping.`);
                roundedNumStars = this.starOnList.length;
            }

            for (let i = 0; i < this.starOnList.length; i++) {
                const node = this.starOnList[i];
                if (node) node.active = i < roundedNumStars;
            }
        }
    }

    //------------------------------
    // Private

    private registerButtonClick(): void {
        if (this.selectButton) {
            this.selectButton.node.on(Button.EventType.CLICK, this.handleSelectClicked, this);
            return;
        }

        // If no Button assigned, warn so caller can attach a handler another way.
        console.warn(`GameLevelSelectItem: 'selectButton' not assigned for node '${this.node.name}'.`);
    }

    private unregisterButtonClick(): void {
        if (this.selectButton) {
            this.selectButton.node.off(Button.EventType.CLICK, this.handleSelectClicked, this);
        }
    }

    private handleSelectClicked(): void {
        // Dispatch the level index to listeners.
        this.onSelected.invoke(this.levelIndex);
    }
}
