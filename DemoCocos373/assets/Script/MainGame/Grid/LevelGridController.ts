import { _decorator, Component, Node, Prefab, instantiate, UITransform, Layout, Vec2, Size, SpriteFrame } from "cc";
import { GridCardItem } from "./GridCardItem";
import { TypedEvent } from "../../Utils/TypedEvent";
import { IconPackData, IconSpriteStorage } from "../LevelData/IconSpriteStorage";
import { LevelDataStorage } from "../LevelData/LevelDataStorage";
const { ccclass, property } = _decorator;

/**
 * Controller for the level grid used in the GamePage.
 * Responsibilities:
 * - layout and instantiate grid cells for a level data
 * - adapt Layout spacing and child sizes to fit the render area
 */
@ccclass("LevelGridController")
export class LevelGridController extends Component {
    // ---------------- Inspector fields ----------------
    @property({ type: Prefab })
    public cardItemPrefab: Prefab | null = null;

    // Level storage component/asset - typed as `any` to avoid hard dependency on storage implementation.
    @property({ type: Prefab })
    public levelStoragePrefab: Prefab | null = null;

    @property({ type: Prefab })
    public iconStoragePrefab: Prefab | null = null;

    // /** Animation config is project-specific; keep as `any` and guard its usage at runtime. */
    // @property({ type: Object })
    // public animationConfig: any = null;

    // ---------------- Public events ----------------
    /** Event triggered when a card item is clicked */
    public readonly onCardItemButtonClickedHandler = new TypedEvent<GridCardItem>();

    // ---------------- Private state ----------------
    private _currentLevelSize: Vec2 = new Vec2(0, 0);
    private _allCards: GridCardItem[] = [];

    // ---------------- Lifecycle ----------------
    onLoad() {}

    // ---------------- Public API ----------------
    /**
     * Load a level by index: clear current grid and instantiate card items based on LevelStorage LevelData.
     */
    public loadLevel(levelIndex: number) {
        if (!this.levelStoragePrefab) {
            console.error("LoadLevel(), LevelStorage is null");
            return;
        }

        const levelStorage = this.levelStoragePrefab.data.getComponent(LevelDataStorage);
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

        if (!this.cardItemPrefab) {
            console.error("LoadLevel(), CardItemPrefab is not set.");
            return;
        }

        // instantiate card items (row-major ordering)
        this._allCards.length = 0;
        for (let row = 0; row < this._currentLevelSize.y; row++) {
            for (let col = 0; col < this._currentLevelSize.x; col++) {
                const card = instantiate(this.cardItemPrefab);
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
        this.adjustGridLayoutToFitCardInRenderArea();

        // assign display sprites to cards
        this.assignSpriteToAllCard();
    }

    /**
     * Adjust the Layout spacing and child sizes to fit the configured render area.
     * 90% of each cell is used as the cellSize, and 10% used as spacing.
     */
    public adjustGridLayoutToFitCardInRenderArea() {
        // if (!this.parentTransform || !this.gridLayout) {
        //     console.error("AdjustGridLayoutToFitCardInRenderArea(), missing UI references");
        //     return;
        // }
        // const parentTransform = this.parentTransform.getComponent(UITransform);
        // if (!parentTransform) {
        //     console.error("AdjustGridLayoutToFitCardInRenderArea(), parentTransform missing UITransform");
        //     return;
        // }
        // const parentSize = parentTransform.contentSize;
        // if (parentSize.width <= 0 || parentSize.height <= 0) {
        //     console.error("AdjustGridLayoutToFitCardInRenderArea(), render area has invalid size");
        //     return;
        // }
        // const cellW = parentSize.width / this._currentLevelSize.x;
        // const cellH = parentSize.height / this._currentLevelSize.y;
        // const edge = Math.min(cellW, cellH);
        // const usableEdge = edge * 0.9; // 90% used by the cell
        // const cellSize = new Size(usableEdge, usableEdge);
        // const spacingX = edge * 0.1;
        // const spacingY = edge * 0.1;
        // // calc parent size to fit exactly the grid, and set to rootItem parent
        // if (this.rootItem) {
        //     const rootTf = this.rootItem.getComponent(UITransform);
        //     if (rootTf) {
        //         rootTf.setContentSize(this._currentLevelSize.x * (cellSize.width + spacingX) - spacingX, this._currentLevelSize.y * (cellSize.height + spacingY) - spacingY);
        //     }
        // }
        // // set new values (Layout spacing)
        // const layout = this.gridLayout;
        // layout.spacingX = spacingX;
        // layout.spacingY = spacingY;
        // // set child sizes to match calculated cell size
        // const parent = layout.node;
        // for (let i = 0; i < parent.children.length; i++) {
        //     const child = parent.children[i];
        //     const childTf = child.getComponent(UITransform);
        //     if (childTf) childTf.setContentSize(cellSize.width, cellSize.height);
        // }
        // // Force layout update so the changes are visible immediately
        // // `updateLayout` is a public API on Layout component
        // layout.updateLayout();
    }

    /**
     * Play pop-out (scale-up) animation for all instantiated cards using configured animation.
     */
    public async playBeginPopOutAnimationForAllCard() {
        // if (!this._allCards || this._allCards.length === 0) {
        //     console.warn("PlayBeginPopOutAnimationForAllCard(), no cards available");
        //     return;
        // }
        // const scaleAnimation = this.animationConfig?.scaleUpDown;
        // if (!scaleAnimation || typeof scaleAnimation.duration !== "number") {
        //     console.warn("PlayBeginPopOutAnimationForAllCard(), no popOutBegin animation configured");
        //     return;
        // }
        // const RandomDelayMax = 0.5;
        // for (let n = 0; n < this._allCards.length; n++) {
        //     const cardItem = this._allCards[n];
        //     if (!cardItem) continue;
        //     const delay = Math.random() * RandomDelayMax;
        //     if (typeof scaleAnimation.playScaleUp === "function") {
        //         try {
        //             scaleAnimation.playScaleUp(cardItem, delay);
        //         } catch (e) {
        //             // continue silently if play method fails
        //         }
        //     }
        // }
        // // Wait for the configured animation duration so callers can await completion.
        // await new Promise((resolve) => setTimeout(resolve, (scaleAnimation.duration + RandomDelayMax) * 1000));
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
        return;
        if (!this._allCards || this._allCards.length === 0) {
            console.warn("AssignSpriteToAllCard(), no cards available to assign sprites");
            return;
        }

        const storage = this.levelStoragePrefab.data.getComponent(IconSpriteStorage);
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

    // ---------------- Helpers ----------------

    private onCardItemSelected(item: GridCardItem) {
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

    // private waitWithOptionalAbort(ms: number, signal?: AbortSignal): Promise<void> {
    //     return new Promise((resolve, reject) => {
    //         if (signal && signal.aborted) return resolve();
    //         const to = setTimeout(() => {
    //             if (signal) signal.removeEventListener("abort", onAbort);
    //             resolve();
    //         }, ms);
    //         const onAbort = () => {
    //             clearTimeout(to);
    //             signal?.removeEventListener("abort", onAbort);
    //             resolve();
    //         };
    //         if (signal) signal.addEventListener("abort", onAbort);
    //     });
    // }
}
