import { _decorator, Component, Node, Sprite, SpriteFrame, Button, Vec2 } from "cc";
import { TypedEvent } from "../../Utils/TypedEvent";
const { ccclass, property } = _decorator;

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
