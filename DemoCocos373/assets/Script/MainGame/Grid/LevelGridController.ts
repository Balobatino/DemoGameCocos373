import { _decorator, Component, Node, Prefab, instantiate, UITransform, Layout, Vec2, Size, SpriteFrame, isValid } from "cc";
import { GridCardItem } from "./GridCardItem";
import { TypedEvent } from "../../Utils/TypedEvent";
import { IconPackData, IconSpriteStorage } from "../LevelData/IconSpriteStorage";
import { LevelDataStorage } from "../LevelData/LevelDataStorage";
const { ccclass, property } = _decorator;

/**
 * Grouped inspector data for the LevelGridController.
 *
 * Purpose:
 * - Keeps prefab references (card item, level storage, icon storage) together so the
 *   inspector shows a single collapsible object and the controller uses a single entry.
 */
@ccclass("LevelGridControllerData")
class Data {
    @property({ type: Prefab })
    public cardItemPrefab: Prefab | null = null;

    @property({ type: Prefab })
    public levelStoragePrefab: Prefab | null = null;

    @property({ type: Prefab })
    public iconStoragePrefab: Prefab | null = null;
}

/**
 * Controller for the level grid used in the GamePage.
 * Responsibilities:
 * - layout and instantiate grid cells for a level data
 * - adapt Layout spacing and child sizes to fit the render area
 */
@ccclass("LevelGridController")
export class LevelGridController extends Component {
    // ---------------- Inspector fields ----------------
    /**
     * Grouped prefab references used by the grid (card prefab, level data prefab, icon storage prefab).
     */
    @property({ type: Data })
    public data: Data = new Data();

    @property({ type: Layout })
    public gridLayout: Layout | null = null;

    // /** Animation config is project-specific; keep as `any` and guard its usage at runtime. */
    // @property({ type: Object })
    // public animationConfig: any = null;

    // ---------------- Public events ----------------
    /** Event triggered when a card item is clicked */
    public readonly onCardItemButtonClickedHandler = new TypedEvent<GridCardItem>();

    // ---------------- Private state ----------------
    private _initGridRenderAreaSize: Size | null = null;
    private _currentLevelSize: Vec2 = new Vec2(0, 0);
    private _allCards: GridCardItem[] = [];

    // ---------------- Lifecycle ----------------
    // onLoad() {}

    protected start(): void {
        // Cache initial render area size
        const parentTransform = this.node.getComponent(UITransform);
        if (parentTransform) {
            this._initGridRenderAreaSize = parentTransform.contentSize.clone();
        } else {
            console.warn("LevelGridController: Missing UITransform on grid render area node.");
        }
    }

    // ---------------- Public API ----------------
    /**
     * Load a level by index: clear current grid and instantiate card items based on LevelStorage LevelData.
     */
    public loadLevel(levelIndex: number) {
        if (!this.data || !this.data.levelStoragePrefab) {
            console.error("LoadLevel(), LevelStorage prefab is null");
            return;
        }

        const levelStorage = this.data.levelStoragePrefab.data.getComponent(LevelDataStorage);
        if (!levelStorage) {
            console.error("LoadLevel(), LevelStorage prefab missing LevelDataStorage component.");
            return;
        }
        const level = levelStorage.getLevel(levelIndex);
        if (!level) {
            console.error(`LoadLevel(), Level index ${levelIndex} returned null.`);
            return;
        }

        // save current level size for AdjustGridLayoutToFitCardInRenderArea usage
        this._currentLevelSize = level.size.clone ? level.size.clone() : new Vec2(level.size.x, level.size.y);

        // Clear existing children
        const rootItem = this.node;
        for (let n = rootItem.children.length - 1; n >= 0; n--) {
            const child = rootItem.children[n];
            child.removeFromParent();
            child.destroy();
        }

        if (!this.data.cardItemPrefab) {
            console.error("LoadLevel(), CardItemPrefab is not set.");
            return;
        }

        // instantiate card items (row-major ordering)
        this._allCards.length = 0;
        for (let row = 0; row < this._currentLevelSize.y; row++) {
            for (let col = 0; col < this._currentLevelSize.x; col++) {
                const card = instantiate(this.data.cardItemPrefab);
                rootItem.addChild(card);
                // card.setScale(1, 1, 1);

                // If prefab includes GridCardItem, configure it
                const cardComponent = card.getComponent(GridCardItem) as GridCardItem | null;
                if (!cardComponent) {
                    console.error("LoadLevel(), CardItemPrefab missing GridCardItem component.");
                    continue;
                }
                cardComponent.setGridPosition(new Vec2(col, row));
                // default backface
                cardComponent.activeBackFace(true);
                this._allCards.push(cardComponent);
                // register button click callback
                cardComponent.onSelected.add((it) => this.onCardItemSelected(it));
            }
        }

        // Layout and sizing
        this.adjustGridLayoutToFitCardInRenderArea(this._currentLevelSize);

        // assign display sprites to cards
        this.assignSpriteToAllCard();

        // run begin pop-out animation
        void this.playBeginPopOutAnimationForAllCard();
    }

    /**
     * Adjust the Layout spacing and child sizes to fit the configured render area.
     * 90% of each cell is used as the cellSize, and 10% used as spacing.
     */
    /**
     * Adjust the Layout spacing and child sizes to fit the configured render area.
     * Translated from the C# implementation but *does not* modify the render area's
     * size (preserve the container). `levelSize` is optional and falls back to
     * the cached `_currentLevelSize` when not provided.
     */
    public adjustGridLayoutToFitCardInRenderArea(levelSize?: Vec2) {
        // Basic config checks (equivalent of isFailedConfig)
        if (!this.gridLayout) {
            console.error("AdjustGridLayoutToFitCardInRenderArea(), missing gridLayout reference");
            return;
        }

        const size = levelSize ?? this._currentLevelSize;
        if (!size || size.x <= 0 || size.y <= 0) {
            console.error("AdjustGridLayoutToFitCardInRenderArea(), invalid level size");
            return;
        }

        const parentTransform = this.node.getComponent(UITransform);
        if (!parentTransform) {
            console.error("AdjustGridLayoutToFitCardInRenderArea(), missing UITransform on render area");
            return;
        }

        // log parent size
        console.log(`AdjustGridLayoutToFitCardInRenderArea(), render area size: ${this._initGridRenderAreaSize.width} x ${this._initGridRenderAreaSize.height}`);

        // compute cell and spacing similar to the C# logic
        const cellW = this._initGridRenderAreaSize.width / size.x;
        const cellH = this._initGridRenderAreaSize.height / size.y;
        const edge = Math.min(cellW, cellH);
        const usableEdge = edge * 0.9; // 90% used by the cell
        const cellSize = new Size(usableEdge, usableEdge);
        console.log(`AdjustGridLayoutToFitCardInRenderArea(), calculated cell size: ${cellSize.width} x ${cellSize.height}`);

        // reduce 10% for spacing, use 9% to fix issue where rounding causes overflow
        const spacingX = edge * 0.09;
        const spacingY = edge * 0.09;
        console.log(`AdjustGridLayoutToFitCardInRenderArea(), calculated spacing: ${spacingX} x ${spacingY}`);

        const layout = this.gridLayout;
        layout.cellSize = cellSize;
        layout.spacingX = spacingX;
        layout.spacingY = spacingY;

        // calculate the required size of the parent to fit the grid exactly
        const totalWidth = size.x * cellSize.width + (size.x - 1) * spacingX;
        const totalHeight = size.y * cellSize.height + (size.y - 1) * spacingY;
        // set to parent
        parentTransform.setContentSize(totalWidth, totalHeight);

        // Force an immediate layout rebuild so the changes are visible immediately
        layout.updateLayout();
    }

    /**
     * Play pop-out (scale-up) animation for all instantiated cards using configured animation.
     */
    public async playBeginPopOutAnimationForAllCard() {
        if (!this._allCards || this._allCards.length === 0) {
            console.warn("PlayBeginPopOutAnimationForAllCard(), no cards available");
            return;
        }

        // First, set all card scales to zero so they start hidden
        for (let i = 0; i < this._allCards.length; i++) {
            const card = this._allCards[i];
            if (!card || !card.node) continue;
            const z = card.node.scale ? card.node.scale.z : 1;
            card.node.setScale(0, 0, z);
        }

        const RandomDelayMax = 0.5;
        for (let n = 0; n < this._allCards.length; n++) {
            const cardItem = this._allCards[n];
            if (!cardItem) continue;
            const delay = Math.random() * RandomDelayMax;
            // Use the new delay parameter on playPopUpAnimation
            cardItem.playPopUpAnimation(undefined, delay);
        }

        // Wait a bit so the staggered pop-out can complete; 0.5s is the requested await
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    /**
     * Play flip animation for all instantiated cards from front to back.
     */
    public async playFlipAllCardsFrontToBack() {
        // if (!this._allCards || this._allCards.length === 0) {
        //     return;
        // }
        // const flipAnim = this.animationConfig?.flip;
        // if (!flipAnim || typeof flipAnim.duration !== "number") {
        //     // no flip configured
        //     return;
        // }
        // for (let n = 0; n < this._allCards.length; n++) {
        //     const cardItem = this._allCards[n];
        //     if (!cardItem) continue;
        //     if (typeof flipAnim.playFlipFrontToBack === "function") {
        //         try {
        //             flipAnim.playFlipFrontToBack(cardItem);
        //         } catch (e) {
        //             // ignore
        //         }
        //     }
        // }
        // await new Promise((resolve) => setTimeout(resolve, flipAnim.duration * 1000));
    }

    /**
     * Assign display sprites to all spawned cards for the current level using a random icon pack.
     */
    public assignSpriteToAllCard() {
        // temp for now
        // return;
        if (!this._allCards || this._allCards.length === 0) {
            console.warn("AssignSpriteToAllCard(), no cards available to assign sprites");
            return;
        }

        if (!this.data || !this.data.iconStoragePrefab) {
            console.error("AssignSpriteToAllCard(), IconStorage prefab is not set.");
            return;
        }

        const storage = this.data.iconStoragePrefab.data.getComponent(IconSpriteStorage);
        if (!storage) {
            console.error("AssignSpriteToAllCard(), IconSpriteStorage component missing from prefab.");
            return;
        }
        const pack = storage.getRandomPack() as IconPackData | null;
        if (!pack) {
            console.error("AssignSpriteToAllCard(), no icon pack returned");
            return;
        }
        if (!pack.sprites || pack.sprites.length === 0) {
            console.error("AssignSpriteToAllCard(), selected icon pack has no sprites");
            return;
        }

        const spritesCount = pack.sprites.length;
        const neededSpriteCount = Math.ceil(this._allCards.length / 2);

        let randomSpriteIndex = this.createShuffledIntegerIndexList(spritesCount);
        while (randomSpriteIndex.length < neededSpriteCount) {
            randomSpriteIndex = randomSpriteIndex.concat(this.createShuffledIntegerIndexList(spritesCount));
        }

        const randomCardIndex = this.createShuffledIntegerIndexList(this._allCards.length);
        // assign sprites by taking two cards at a time
        while (randomCardIndex.length >= 2) {
            const cardIndexA = randomCardIndex.pop() as number;
            const cardIndexB = randomCardIndex.pop() as number;

            if (randomSpriteIndex.length === 0) {
                randomSpriteIndex = randomSpriteIndex.concat(this.createShuffledIntegerIndexList(spritesCount));
            }

            const spriteIndex = randomSpriteIndex.pop() as number;
            const spriteToAssign = pack.sprites[spriteIndex] as SpriteFrame;

            this._allCards[cardIndexA].setDisplaySprite(spriteToAssign);
            this._allCards[cardIndexB].setDisplaySprite(spriteToAssign);
        }

        // if odd number of cards, assign last one
        if (randomCardIndex.length === 1) {
            const lastCardIndex = randomCardIndex[0];
            if (randomSpriteIndex.length === 0) randomSpriteIndex = randomSpriteIndex.concat(this.createShuffledIntegerIndexList(spritesCount));
            const spriteIndex = randomSpriteIndex.pop() as number;
            const spriteToAssign = pack.sprites[spriteIndex] as SpriteFrame;
            this._allCards[lastCardIndex].setDisplaySprite(spriteToAssign);
        }
    }

    // ---------------- Modify all cards ----------------
    public allCardFaceUp() {
        if (!this._allCards || this._allCards.length === 0) {
            console.warn("AllCardFaceUp(), no cards available");
            return;
        }

        for (let n = 0; n < this._allCards.length; n++) {
            const card = this._allCards[n];
            if (!card) continue;
            card.activeBackFace(false);
            card.setActiveInteraction(true);
        }
    }

    public allCardFaceDown() {
        if (!this._allCards || this._allCards.length === 0) {
            console.warn("AllCardFaceDown(), no cards available");
            return;
        }

        for (let n = 0; n < this._allCards.length; n++) {
            const card = this._allCards[n];
            if (!card) continue;
            card.activeBackFace(true);
            card.setActiveInteraction(false);
        }
    }

    public setActiveInteractionAllCard(active: boolean) {
        for (let n = 0; n < this._allCards.length; n++) {
            const card = this._allCards[n];
            if (!card) continue;
            card.setActiveInteraction(active);
        }
    }

    // ---------------- Release and Clear ----------------
    /**
     * Play scale-down animation on all remaining cards then destroy their nodes.
     * Supports optional cancellation via AbortSignal.
     */
    public async scaleDownAndDestroyRemainCards(signal?: AbortSignal) {
        // if (!this._allCards || this._allCards.length === 0) {
        //     console.warn("ScaleDownAndDestroyRemainCards(), no cards available to scale/destroy");
        //     return;
        // }
        // const scaleDownConfig = this.animationConfig?.scaleUpDown;
        // for (let n = 0; n < this._allCards.length; n++) {
        //     const card = this._allCards[n];
        //     if (!card) continue;
        //     // If the card's button is disabled it likely was matched and shouldn't be scaled again
        //     try {
        //         // @ts-ignore - mainButton may be undefined in some prefabs
        //         if (card["mainButton"] && card["mainButton"].interactable === false) continue;
        //     } catch (e) {
        //         // ignore
        //     }
        //     if (scaleDownConfig && typeof scaleDownConfig.playScaleDown === "function") {
        //         try {
        //             scaleDownConfig.playScaleDown(card);
        //         } catch (e) {
        //             // ignore
        //         }
        //     }
        // }
        // if (scaleDownConfig && typeof scaleDownConfig.duration === "number") {
        //     const waitMs = scaleDownConfig.duration * 1000;
        //     // await this.waitWithOptionalAbort(waitMs, signal);
        // }
        // // Destroy all remaining card nodes and clear list
        // for (let n = this._allCards.length - 1; n >= 0; n--) {
        //     const card = this._allCards[n];
        //     if (!card) {
        //         this._allCards.splice(n, 1);
        //         continue;
        //     }
        //     const go = card.node;
        //     this._allCards.splice(n, 1);
        //     go.removeFromParent();
        //     go.destroy();
        // }
        // this._allCards.length = 0;
    }

    // // ---------------- Parent size change handling ----------------
    // public startListenToParentDimensionChange() {
    //     const parent = this.parentTransform;
    //     if (!parent) return;
    //     // Try to find a size-change detector component and subscribe to it if available.
    //     const detector: any = parent.getComponent("RectTransformSizeChangeDetector");
    //     if (!detector) {
    //         console.warn("StartListenToParentDimensionChange(), no RectTransformSizeChangeDetector found.");
    //         return;
    //     }
    //     // prevent multiple subscriptions
    //     if (detector.OnDeimensionChangedHandler && typeof detector.OnDeimensionChangedHandler.remove === "function") {
    //         detector.OnDeimensionChangedHandler.remove(this.onParentRectTransformSizeChanged, this);
    //         detector.OnDeimensionChangedHandler.add(this.onParentRectTransformSizeChanged, this);
    //     }
    // }

    // public stopListenToParentDimensionChange() {
    //     const parent = this.parentTransform;
    //     if (!parent) return;
    //     const detector: any = parent.getComponent("RectTransformSizeChangeDetector");
    //     if (!detector) return;
    //     if (detector.OnDeimensionChangedHandler && typeof detector.OnDeimensionChangedHandler.remove === "function") {
    //         detector.OnDeimensionChangedHandler.remove(this.onParentRectTransformSizeChanged, this);
    //     }
    // }

    // private onParentRectTransformSizeChanged() {
    //     this.adjustGridLayoutToFitCardInRenderArea();
    // }

    /**
     * Destroy all instantiated card nodes and clear the internal card list.
     *
     * Implementation notes:
     * - Use a pop-based loop to remove items from the *end* of the array which is
     *   O(1) per removal. This avoids the O(n^2) behavior caused by repeated
     *   middle/front `splice()` calls and still removes references before calling
     *   lifecycle methods such as `destroy()` (prevents callbacks from seeing
     *   partially-destroyed state).
     * - Prefer cheap guard checks (`node.parent`, `node.isValid`) before calling
     *   potentially throwing operations (`removeFromParent()`, `destroy()`);
     *   keep a small try/catch around `destroy()` as a last-resort safety net.
     */
    public destroyAllCards(): void {
        // Guard: nothing to do
        if (!this._allCards || this._allCards.length === 0) return;

        // Pop from the end which is efficient (O(1)) and immediately removes the
        // reference from the array before we call lifecycle methods on the node.
        while (this._allCards.length > 0) {
            const card = this._allCards.pop();
            if (!card) continue;

            const node = card.node;
            // Nothing to do if node reference is missing
            if (!node) continue;

            // Detach immediately if attached; this is cheap and prevents flicker.
            if (node.parent) node.removeFromParent();

            // Check node validity using engine helper to avoid calling destroy on
            // an already-invalid object (prevents potential errors or undefined behavior).
            if (!isValid(node)) continue;

            try {
                node.destroy();
            } catch (e) {
                // Log the error and continue clearing the rest of the list.
                console.warn("destroyAllCards(): destroy() threw", e);
            }
        }

        // Ensure the array is empty
        this._allCards.length = 0;
    }

    // ---------------- Helpers ----------------

    private onCardItemSelected(item: GridCardItem) {
        // log the grid position for debug
        // const pos = item.gridPosition;
        // console.log(`LevelGridController: Card selected at grid position (${pos.x}, ${pos.y})`);
        this.onCardItemButtonClickedHandler.invoke(item);
    }

    private createShuffledIntegerIndexList(count: number): number[] {
        const arr: number[] = [];
        for (let i = 0; i < count; i++) arr.push(i);
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }
}
