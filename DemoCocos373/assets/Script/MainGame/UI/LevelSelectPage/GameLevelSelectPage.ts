import { _decorator, Button } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
const { ccclass, property } = _decorator;

/**
 * GameLevelSelectPage: Singleton that manages the level selection UI page.
 */
@ccclass("GameLevelSelectPage")
export class GameLevelSelectPage extends Singleton<GameLevelSelectPage> {
    //------------------------------
    //---- expose properties
    @property({ type: Button })
    closeButton: Button | null = null;

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the level-select page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods
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
            console.error(`GameLevelSelectPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Close button
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        } else {
            console.warn("GameLevelSelectPage: closeButton is not assigned in the inspector.");
        }
    }

    /**
     * Handler for the Close button click event.
     * Hides this page and re-opens the main page.
     */
    private onCloseButtonClicked(): void {
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call hide().");
        }

        // Reopen the main page
        const gameMainPage = GameMainPage.getInstance<GameMainPage>();
        if (!gameMainPage) {
            console.warn("GameMainPage singleton instance not found in Main scene.");
            return;
        }

        const mainUiPage = gameMainPage.getUiPage();
        if (mainUiPage) {
            mainUiPage.show();
        } else {
            console.warn("GameMainPage: UIPage component not found; cannot call show().");
        }
    }

    //------------------------------
    //--- Cleanup
    protected onDestroy(): void {
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        }
    }
}
