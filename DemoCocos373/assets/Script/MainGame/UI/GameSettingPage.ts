import { _decorator, Button, Component, Node } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
const { ccclass, property } = _decorator;

/**
 * GameSettingPage: Singleton that manages the settings UI page for the game.
 */
@ccclass("GameSettingPage")
export class GameSettingPage extends Singleton<GameSettingPage> {
    //------------------------------
    //---- expose properties
    @property({ type: Button })
    policyButton: Button | null = null;

    @property({ type: Button })
    closeButton: Button | null = null;

    //------------------------------
    //--- Private Properties
    // Cached UIPage component for the settings page. May be null if not found.
    private uiPage: UIPage | null = null;

    //------------------------------
    //--- Lifecycle Methods

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component on this node or its children and caches it.
     * Registers button click handlers.
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
            console.error(`GameSettingPage: UIPage component not found on node "${this.node.name}" or its children.`);
        }
    }

    private registerButtonHandlers(): void {
        // Policy button
        if (this.policyButton) {
            this.policyButton.node.on(Button.EventType.CLICK, this.onPolicyButtonClicked, this);
        } else {
            console.warn("GameSettingPage: policyButton is not assigned in the inspector.");
        }

        // Close button
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        } else {
            console.warn("GameSettingPage: closeButton is not assigned in the inspector.");
        }
    }

    /**
     * Handler for the Policy button click event.
     * Currently logs a message; actual policy display logic to be implemented.
     */
    private onPolicyButtonClicked(): void {
        // console.log("Policy button clicked. Opening policy...");
    }

    /**
     * Handler for the Close button click event.
     * Currently logs a message; actual close/hide logic to be implemented.
     */
    private onCloseButtonClicked(): void {
        // console.log("Close button clicked. Closing settings...");
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GameSettingPage: UIPage component not found; cannot call hide().");
        }
    }

    //------------------------------
    //--- Cleanup

    /**
     * Clean up registered button listeners to avoid duplicate handlers on reload.
     */
    protected onDestroy(): void {
        if (this.policyButton) {
            this.policyButton.node.off(Button.EventType.CLICK, this.onPolicyButtonClicked, this);
        }
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        }
    }
}
