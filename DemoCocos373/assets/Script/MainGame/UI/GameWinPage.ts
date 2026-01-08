import { _decorator, Button, Label, Node } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
const { ccclass, property } = _decorator;

/**
 * Inspector group for Win Page UI references.
 */
@ccclass("GameWinPageUIReference")
class UIReference {
    @property({ type: Button })
    public homeButton: Button | null = null;

    @property({ type: Button })
    public nextButton: Button | null = null;

    @property({ type: [Node] })
    public starOnList: Node[] = [];

    @property({ type: Label })
    public scoreText: Label | null = null;
}

/**
 * GameWinPage: Singleton that manages the win UI page for the game.
 */
@ccclass("GameWinPage")
export class GameWinPage extends Singleton<GameWinPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the win page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component and registers button handlers.
     */
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
    }

    //------------------------------
    //--- Public Methods

    /**
     * Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }

    // /**
    //  * Set the visible stars (0..starOnList.length).
    //  * @param count Number of stars to enable.
    //  */
    // public setStars(count: number): void {
    //     if (!this.uiRef || !this.uiRef.starOnList) return;
    //     const clamped = Math.max(0, Math.min(count, this.uiRef.starOnList.length));
    //     this.uiRef.starOnList.forEach((n, i) => {
    //         n.active = i < clamped;
    //     });
    // }

    // /**
    //  * Set the score text shown on the win page.
    //  */
    // public setScore(score: number): void {
    //     if (!this.uiRef || !this.uiRef.scoreText) return;
    //     this.uiRef.scoreText.string = String(score);
    // }

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
            console.error(`GameWinPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    //------------------------------
    //--- Buttons Handlers

    private registerButtonHandlers(): void {
        const homeBtn = this.uiRef.homeButton;
        if (homeBtn) {
            homeBtn.node.on(Button.EventType.CLICK, this.onHomeButtonClicked, this);
        } else {
            console.warn("GameWinPage: homeButton is not assigned in the inspector (uiRef.homeButton).");
        }

        const nextBtn = this.uiRef.nextButton;
        if (nextBtn) {
            nextBtn.node.on(Button.EventType.CLICK, this.onNextButtonClicked, this);
        } else {
            console.warn("GameWinPage: nextButton is not assigned in the inspector (uiRef.nextButton).");
        }
    }

    private onHomeButtonClicked(): void {
        // hide this page
        const page = this.getUiPage();
        if (page) {
            page.hide();
        } else {
            console.warn("GameWinPage: UIPage component not found; cannot call hide().");
        }

        // show main page
        const main = GameLevelSelectPage.getInstance<GameLevelSelectPage>();
        if (!main) {
            console.warn("GameLevelSelectPage singleton instance not found in Main scene.");
            return;
        }

        const uiPage = main.getUiPage();
        if (uiPage) {
            uiPage.show();
        } else {
            console.warn("GameMainPage: UIPage component not found; cannot call show().");
        }
    }

    private onNextButtonClicked(): void {
        // hide this page
        const page = this.getUiPage();
        if (page) {
            page.hide();
        } else {
            console.warn("GameWinPage: UIPage component not found; cannot call hide().");
        }
    }

    //------------------------------
    //--- Cleanup

    protected onDestroy(): void {
        const homeBtn = this.uiRef.homeButton;
        if (homeBtn) {
            homeBtn.node.off(Button.EventType.CLICK, this.onHomeButtonClicked, this);
        }
        const nextBtn = this.uiRef.nextButton;
        if (nextBtn) {
            nextBtn.node.off(Button.EventType.CLICK, this.onNextButtonClicked, this);
        }
    }
}
