import { _decorator, Button } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { LevelGridController } from "../Grid/LevelGridController";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
const { ccclass, property } = _decorator;

/**
 * GamePlayBoardPage: Singleton that manages the gameplay board UI page.
 * Responsibilities:
 * - expose and provide access to the LevelGridController used by gameplay
 * - handle Back button to return to the main page
 */
@ccclass("GamePlayBoardPage")
export class GamePlayBoardPage extends Singleton<GamePlayBoardPage> {
    //------------------------------
    //---- expose properties
    /** Back button that returns to the main page. Assign in inspector. */
    @property({ type: Button })
    backButton: Button | null = null;

    /** Controller for the level grid used on this page. Assign in inspector. */
    @property({ type: LevelGridController })
    levelGridController: LevelGridController | null = null;

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
        return this.levelGridController;
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

        if (!this.levelGridController) {
            console.warn("GamePlayBoardPage: levelGridController not assigned; cannot load level.");
            return;
        }

        // schedule a one-shot callback after the show animation duration
        (this as any).scheduleOnce(() => {
            this.levelGridController!.loadLevel(levelIndex);
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
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackButtonClicked, this);
        } else {
            console.warn("GamePlayBoardPage: backButton is not assigned in the inspector.");
        }
    }

    /** Handler for the Back button click event. Hides this page and re-opens the main page. */
    private onBackButtonClicked(): void {
        // call grid controller to cleanup current level
        if (this.levelGridController) {
            this.levelGridController.destroyAllCards();
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
        if (this.backButton) {
            this.backButton.node.off(Button.EventType.CLICK, this.onBackButtonClicked, this);
        }
    }
}
