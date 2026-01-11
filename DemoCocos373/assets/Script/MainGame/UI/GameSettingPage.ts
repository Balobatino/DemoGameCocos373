import { _decorator, Button, Component, Node, Toggle } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { AudioManager } from "../../Standard/Audio/AudioManager"; // for reading/setting mute state
const { ccclass, property } = _decorator;

/**
 * GameSettingPage: Singleton that manages the settings UI page for the game.
 */
/**
 * Inspector group for Settings Page UI references.
 */
@ccclass("GameSettingPageUIReference")
export class UIReference {
    @property({ type: Button })
    public policyButton: Button | null = null;

    @property({ type: Button })
    public closeButton: Button | null = null;

    @property({ type: Toggle })
    public muteBgmToggle: Toggle | null = null;

    @property({ type: Toggle })
    public muteSfxToggle: Toggle | null = null;
}

/**
 * GameSettingPage: Singleton that manages the settings UI page for the game.
 */
@ccclass("GameSettingPage")
export class GameSettingPage extends Singleton<GameSettingPage> {
    //------------------------------
    //---- Inspector grouped UI references
    @property({ type: UIReference })
    public uiRef: UIReference = new UIReference();

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
        const policyBtn = this.uiRef.policyButton;
        if (policyBtn) {
            policyBtn.node.on(Button.EventType.CLICK, this.onPolicyButtonClicked, this);
        } else {
            console.warn("GameSettingPage: policyButton is not assigned in the inspector (uiRef.policyButton).");
        }

        // Close button
        const closeBtn = this.uiRef.closeButton;
        if (closeBtn) {
            closeBtn.node.on(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        } else {
            console.warn("GameSettingPage: closeButton is not assigned in the inspector (uiRef.closeButton).");
        }

        // Mute BGM toggle
        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            muteBgm.node.on(Toggle.EventType.TOGGLE, this.onMuteBgmToggled, this);
        } else {
            console.warn("GameSettingPage: muteBgmToggle is not assigned in the inspector (uiRef.muteBgmToggle).");
        }

        // Mute SFX toggle
        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.node.on(Toggle.EventType.TOGGLE, this.onMuteSfxToggled, this);
        } else {
            console.warn("GameSettingPage: muteSfxToggle is not assigned in the inspector (uiRef.muteSfxToggle).");
        }
    }

    /**
     * Handler for the Policy button click event.
     * Currently logs a message; actual policy display logic to be implemented.
     */
    private onPolicyButtonClicked(): void {
        // console.log("Policy button clicked. Opening policy...");
        // open web link : https://doc-hosting.flycricket.io/funny-memory-card-matching-game-privacy-policy/645b03e8-8258-4d27-88ad-054ace69d2da/privacy
        const policyUrl = "https://doc-hosting.flycricket.io/funny-memory-card-matching-game-privacy-policy/645b03e8-8258-4d27-88ad-054ace69d2da/privacy";
        window.open(policyUrl, "_blank");
    }

    // Initialize toggle states from AudioManager once the node is enabled and start runs
    protected start(): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) return;

        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            // Set without notifying to avoid firing handlers when initializing
            muteBgm.setIsCheckedWithoutNotify(audioMgr.isBgmMuted());
        }

        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.setIsCheckedWithoutNotify(audioMgr.isSfxMuted());
        }
    }

    // Handler for BGM mute toggle changed
    private onMuteBgmToggled(toggle: Toggle): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) {
            console.warn("GameSettingPage: AudioManager singleton instance not found; cannot set BGM mute.");
            return;
        }
        audioMgr.setMuteBGM(toggle.isChecked);
    }

    // Handler for SFX mute toggle changed
    private onMuteSfxToggled(toggle: Toggle): void {
        const audioMgr = AudioManager.getInstance<AudioManager>();
        if (!audioMgr) {
            console.warn("GameSettingPage: AudioManager singleton instance not found; cannot set SFX mute.");
            return;
        }
        audioMgr.setMuteSFX(toggle.isChecked);
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

        // reopen the main page
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

    /**
     * Clean up registered button listeners to avoid duplicate handlers on reload.
     */
    protected onDestroy(): void {
        const policyBtn = this.uiRef.policyButton;
        if (policyBtn) {
            policyBtn.node.off(Button.EventType.CLICK, this.onPolicyButtonClicked, this);
        }
        const closeBtn = this.uiRef.closeButton;
        if (closeBtn) {
            closeBtn.node.off(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        }

        const muteBgm = this.uiRef.muteBgmToggle;
        if (muteBgm) {
            muteBgm.node.off(Toggle.EventType.TOGGLE, this.onMuteBgmToggled, this);
        }
        const muteSfx = this.uiRef.muteSfxToggle;
        if (muteSfx) {
            muteSfx.node.off(Toggle.EventType.TOGGLE, this.onMuteSfxToggled, this);
        }
    }
}
