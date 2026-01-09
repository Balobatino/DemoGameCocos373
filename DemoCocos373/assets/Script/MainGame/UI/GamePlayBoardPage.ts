import { _decorator, Button } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { LevelGridController } from "../Grid/LevelGridController";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
import { GridCardItem } from "../Grid/GridCardItem";
import { GameStats } from "../GameStats/GameStats";
const { ccclass, property } = _decorator;

/**
 * Inspector group for UI references used by GamePlayBoardPage.
 */
@ccclass("GamePlayBoardPageUIReference")
class UIReference {
    @property({ type: Button })
    public backButton: Button | null = null;

    @property({ type: LevelGridController })
    public levelGridController: LevelGridController | null = null;
}

/**
 * GamePlayBoardPage: Singleton that manages the gameplay board UI page.
 * Responsibilities:
 * - expose and provide access to the LevelGridController used by gameplay
 * - handle Back button to return to the main page
 */
@ccclass("GamePlayBoardPage")
export class GamePlayBoardPage extends Singleton<GamePlayBoardPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the play-board page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
    }

    //------------------------------
    //--- Public Methods
    /** Return the cached UIPage instance, or null when not available. */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }

    /** Return the assigned LevelGridController instance, or null when not assigned. */
    public getLevelGridController(): LevelGridController | null {
        return this.uiRef.levelGridController;
    }

    /**
     * Show the UI page and load the specified level when the show animation finishes.
     * @param levelIndex - index of the level to load
     */
    public showAndLoadLevelWhenFinishAnimation(levelIndex: number): void {
        const uiPage = this.getUiPage();
        if (!uiPage) {
            console.warn("GamePlayBoardPage: UIPage component not found; cannot call show()");
            return;
        }

        uiPage.show();
        const delay = uiPage.getShowDuration ? uiPage.getShowDuration() : 0;

        const grid = this.uiRef.levelGridController;
        if (!grid) {
            console.warn("GamePlayBoardPage: levelGridController not assigned; cannot load level.");
            return;
        }

        // schedule a one-shot callback after the show animation duration
        (this as any).scheduleOnce(() => {
            // make sure no UI is blocked interaction to wait for level load, animation
            uiPage.setActiveInteraction(false);
            // reset data before loading new level
            this.resetDataBeforeNewMatch();
            grid.loadLevel(levelIndex);
        }, delay);
    }

    //------------------------------
    //--- Private
    private cacheComponents(): void {
        // Try to get UIPage on this node first, then search children.
        const onNode = this.node.getComponent(UIPage);
        if (onNode) {
            this.uiPage = onNode;
            return;
        }

        const inChildren = this.node.getComponentsInChildren(UIPage);
        this.uiPage = inChildren && inChildren.length > 0 ? inChildren[0] : null;

        if (!this.uiPage) {
            console.error(`GamePlayBoardPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Back button
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.on(Button.EventType.CLICK, this.onBackButtonClicked, this);
        } else {
            console.warn("GamePlayBoardPage: backButton is not assigned in the inspector (uiRef.backButton).");
        }

        // Subscribe to card selection events from the LevelGridController
        const grid = this.uiRef.levelGridController;
        if (grid) {
            grid.onCardItemButtonClickedHandler.add(this.onGridCardItemSelected);
        } else {
            console.warn("GamePlayBoardPage: levelGridController not assigned; cannot subscribe to card selection events.");
        }
    }

    /** Handler for the Back button click event. Hides this page and re-opens the main page. */
    private onBackButtonClicked(): void {
        // call grid controller to cleanup current level
        const grid = this.uiRef.levelGridController;
        if (grid) {
            grid.scaleDownAndDestroyRemainCards();
        }
        // Hide this page
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GamePlayBoardPage: UIPage component not found; cannot call hide().");
        }

        // Reopen the main page
        const levelSelectPage = GameLevelSelectPage.getInstance<GameLevelSelectPage>();
        if (!levelSelectPage) {
            console.warn("GameLevelSelectPage singleton instance not found in Main scene.");
            return;
        }

        const mainUiPage = levelSelectPage.getUiPage();
        if (mainUiPage) {
            mainUiPage.show();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call show().");
        }
    }

    //------------------------------
    //--- Cleanup
    protected onDestroy(): void {
        const backBtn = this.uiRef.backButton;
        if (backBtn) {
            backBtn.node.off(Button.EventType.CLICK, this.onBackButtonClicked, this);
        }

        // Unsubscribe from grid card click events
        const grid = this.uiRef.levelGridController;
        if (grid) {
            grid.onCardItemButtonClickedHandler.remove(this.onGridCardItemSelected);
        }
    }

    //-----------------------------------
    //--- Game Logic for Card Matching

    private _firstSelectedCard: GridCardItem | null = null;
    private _secondSelectedCard: GridCardItem | null = null;

    // Grid card click handler (arrow function to preserve `this` when used as listener)
    private onGridCardItemSelected = (cardItem: GridCardItem): void => {
        if (!cardItem) {
            console.warn("GamePlayBoardPage: onGridCardItemSelected called with null/undefined item.");
            return;
        }

        // console.log(`GamePlayBoardPage: onGridCardItemSelected: grid pos ${cardItem.gridPosition.x}, ${cardItem.gridPosition.y}`);

        // both cards are null, set first selected card, simple reveal first card, wait for second selection
        if (this._firstSelectedCard == null && this._secondSelectedCard == null) {
            this._firstSelectedCard = cardItem;
            // disable interaction on selected card, so user can't click it again
            cardItem.setActiveInteraction(false);
            // flip card to reveal (GridCardItem handles animation)
            cardItem.playFlipBackToFrontAnimation();
            // TODO: play flip audio
            return;
        }

        // first card is selected, second is null, then perform matching check
        if (this._firstSelectedCard != null && this._secondSelectedCard == null) {
            this._secondSelectedCard = cardItem;
            // disable interaction on selected card, so user can't click it again
            cardItem.setActiveInteraction(false);
            // check matching asynchronously
            void this.checkMatchingForTwoSelectedCards();
            return;
        }

        // if both already set, ignore further clicks until evaluation completes
    };

    private async checkMatchingForTwoSelectedCards(): Promise<void> {
        if (!this._firstSelectedCard || !this._secondSelectedCard) {
            console.warn("GamePlayBoardPage: checkMatchingForTwoSelectedCards called with null selections.");
            return;
        }

        // Play flip for second card and flip audio
        // TODO: play flip audio
        this._secondSelectedCard.playFlipBackToFrontAnimation();

        // Wait for flip animation to finish (duration from GridCardItem.flipAnimation)
        const flipDuration = this._firstSelectedCard.flipAnimation.duration;
        await new Promise((res) => setTimeout(res, Math.floor(flipDuration * 1000)));

        // Compare sprites
        if (this._firstSelectedCard.isSameSpriteToCard(this._secondSelectedCard)) {
            await this.onMatchingSuccess(this._firstSelectedCard, this._secondSelectedCard);
        } else {
            await this.onMatchingFail(this._firstSelectedCard, this._secondSelectedCard);
        }
    }

    private async onMatchingSuccess(item1: GridCardItem, item2: GridCardItem): Promise<void> {
        // TODO: play match success audio
        console.log("GamePlayBoardPage: Matching success");

        // Update scoring and UI (placeholders, implement when game data exists)
        this.updateScoreForSuccessMatching();
        // TODO: update UI for success matching (update score, turns, matches)

        // reset selected refs , so it won't affect matching logic later when user click other cards during animation
        this._firstSelectedCard = null;
        this._secondSelectedCard = null;

        // play scale down / disappear animation for matched cards
        item1.playPopDownAnimation();
        item2.playPopDownAnimation();
        const duration = Math.max(item1.popDownAnimation?.duration ?? 0.15, item2.popDownAnimation?.duration ?? 0.15);
        await new Promise((res) => setTimeout(res, Math.floor(duration * 1000)));

        // TODO: play SFX/VFX for matched cards disappear

        // Check win condition (placeholder)
        if (this.isLevelClear()) {
            await this.onLevelCleared();
        }
    }

    private async onMatchingFail(item1: GridCardItem, item2: GridCardItem): Promise<void> {
        // TODO: play match fail audio (e.g. audioData.matchFailAudioCommand.Execute())
        console.log("GamePlayBoardPage: Matching fail");

        // Update stats and UI (placeholders)
        this.updateStatsForFailedMatching();
        // TODO: update UI for failed matching (turn count)

        // TODO: reset combo bar / cooldown: this.uiRef.comboBar?.onUserMatchingFailed();

        // play flip back animations concurrently
        item1.playFlipFrontToBackAnimation();
        item2.playFlipFrontToBackAnimation();

        // reset selections
        this._firstSelectedCard = null;
        this._secondSelectedCard = null;

        // wait for flip animation to finish before re-enable interaction
        const flipDuration = item1.flipAnimation.duration;
        await new Promise((res) => setTimeout(res, Math.floor(flipDuration * 1000)));
        item1.setActiveInteraction(true);
        item2.setActiveInteraction(true);
    }

    private resetDataBeforeNewMatch(): void {
        this._firstSelectedCard = null;
        this._secondSelectedCard = null;
    }

    private updateScoreForSuccessMatching(): void {
        // Award points and increment match counter using GameStats helper.
        GameStats.recordMatchSuccess();
    }

    private updateStatsForFailedMatching(): void {
        // Increment turn count for failed attempt
        GameStats.recordMatchFail();
    }

    private isLevelClear(): boolean {
        // TODO: implement proper level clear logic using gameStats and level storage
        const grid = this.uiRef.levelGridController;
        if (!grid) {
            console.warn("GamePlayBoardPage.isLevelClear(): grid controller not assigned; cannot determine level clear.");
            return false;
        }
        return false;
    }

    private async onLevelCleared(): Promise<void> {
        // TODO: show level cleared UI, SFX, VFX and save score
        console.log("GamePlayBoardPage.onLevelCleared(): TODO - show win UI and handle level clear flow.");
        // await new Promise((res) => setTimeout(res, 0));
    }
}
