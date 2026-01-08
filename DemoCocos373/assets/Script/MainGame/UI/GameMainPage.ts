import { _decorator, Button, Component, Node } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameSettingPage } from "./GameSettingPage";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
const { ccclass, property } = _decorator;

/**
 * Inspector group for UI references used by GameMainPage.
 */
@ccclass("GameMainPageUIReference")
class UIReference {
    @property({ type: Button })
    public playGameButton: Button | null = null;

    @property({ type: Button })
    public settingsButton: Button | null = null;
}

/** * GameMainPage: Singleton that manages the main UI page for the game.
 */
@ccclass("GameMainPage")
export class GameMainPage extends Singleton<GameMainPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the main page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component on this node or its children and caches it.
     * Logs an error if not found to help debugging.
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
            console.error(`GameMainPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    //------------------------------
    //--- Buttons Handlers

    private registerButtonHandlers(): void {
        // Play button
        const playBtn = this.uiRef.playGameButton;
        if (playBtn) {
            playBtn.node.on(Button.EventType.CLICK, this.onPlayGameButtonClicked, this);
        } else {
            console.warn("GameMainPage: playGameButton is not assigned in the inspector (uiRef.playGameButton).");
        }

        // Settings button
        const settingsBtn = this.uiRef.settingsButton;
        if (settingsBtn) {
            settingsBtn.node.on(Button.EventType.CLICK, this.onSettingsButtonClicked, this);
        } else {
            console.warn("GameMainPage: settingsButton is not assigned in the inspector (uiRef.settingsButton).");
        }
    }

    /**
     * Handler for the Play Game button click event.
     * Currently logs a message; actual game start logic to be implemented.
     */
    private onPlayGameButtonClicked(): void {
        // hide the main page
        const mainUiPage = this.getUiPage();
        if (mainUiPage) {
            mainUiPage.hide();
        } else {
            console.warn("GameMainPage: UIPage component not found; cannot call hide().");
        }

        // Open the GameLevelSelectPage UIPage.
        const levelSelectPage = GameLevelSelectPage.getInstance<GameLevelSelectPage>();
        if (!levelSelectPage) {
            console.warn("GameLevelSelectPage singleton instance not found in Main scene.");
            return;
        }

        const uiPage = levelSelectPage.getUiPage();
        if (uiPage) {
            uiPage.show();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call show().");
        }
    }

    /**
     * Handler for the Settings button click event.
     * Opens the settings UI (by showing the GameSettingPage UIPage) if present.
     */
    private onSettingsButtonClicked(): void {
        // console.log("Settings button clicked. Opening settings...");
        //  hide the main page
        const mainUiPage = this.getUiPage();
        if (mainUiPage) {
            mainUiPage.hide();
        } else {
            console.warn("GameMainPage: UIPage component not found; cannot call hide().");
        }

        // Open the GameSettingPage UIPage.
        const gameSettingPage = GameSettingPage.getInstance<GameSettingPage>();
        if (!gameSettingPage) {
            console.warn("GameSettingPage singleton instance not found in Main scene.");
            return;
        }

        const uiPage = gameSettingPage.getUiPage();
        if (uiPage) {
            uiPage.show();
        } else {
            console.warn("GameSettingPage: UIPage component not found; cannot call show().");
        }
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners to avoid duplicate handlers on reload.
     */
    protected onDestroy(): void {
        const playBtn = this.uiRef.playGameButton;
        if (playBtn) {
            playBtn.node.off(Button.EventType.CLICK, this.onPlayGameButtonClicked, this);
        }
        const settingsBtn = this.uiRef.settingsButton;
        if (settingsBtn) {
            settingsBtn.node.off(Button.EventType.CLICK, this.onSettingsButtonClicked, this);
        }
    }
}
