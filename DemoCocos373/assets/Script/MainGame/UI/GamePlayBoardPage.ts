import { _decorator, Button } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { LevelGridController } from "../Grid/LevelGridController";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
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
    }

    /** Handler for the Back button click event. Hides this page and re-opens the main page. */
    private onBackButtonClicked(): void {
        // call grid controller to cleanup current level
        const grid = this.uiRef.levelGridController;
        if (grid) {
            grid.destroyAllCards();
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
    }
}
