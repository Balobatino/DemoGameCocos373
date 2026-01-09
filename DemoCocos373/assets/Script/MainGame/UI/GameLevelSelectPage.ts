import { _decorator, Button } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameMainPage } from "./GameMainPage";
import { GamePlayBoardPage } from "./GamePlayBoardPage";
import { GameLevelSelectItem } from "./LevelSelectPage/GameLevelSelectItem";
import { GameStats } from "../GameStats/GameStats";
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

    // Map storing unsubscribe functions for item event subscriptions.
    private itemUnsubscribes = new Map<GameLevelSelectItem, () => void>();

    // Cached list of GameLevelSelectItem components for quick lookup.
    private gameLevelSelectItems: GameLevelSelectItem[] = [];

    //------------------------------
    //--- Lifecycle Methods
    protected doOnLoad(): void {
        this.cacheComponents();
        this.registerButtonHandlers();
        this.loadAndRegisterItemListeners();
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
        this.cacheUIPage();
    }

    private cacheUIPage(): void {
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

    /**
     * Find GameLevelSelectItem components in children and subscribe to their onSelected events.
     * Keeps unsubscribe functions so we can cleanly remove listeners on destroy.
     */
    private loadAndRegisterItemListeners(): void {
        const items = this.node.getComponentsInChildren(GameLevelSelectItem);
        if (!items || items.length === 0) {
            this.gameLevelSelectItems = [];
            return;
        }

        // Cache items for fast lookups later (e.g., updating stars).
        this.gameLevelSelectItems = items;

        // Use an indexed loop so we can assign levelIndex based on list order (0-based).
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) continue;

            // Avoid double-subscribe by checking map
            if (this.itemUnsubscribes.has(item)) continue;

            // Set level index according to the order in the list.
            item.setLevelIndex(i);

            const unsubscribe = item.onSelected.add((levelIndex: number) => {
                this.onItemSelected(levelIndex, item);
            });

            this.itemUnsubscribes.set(item, unsubscribe);
        }
    }

    private onItemSelected(levelIndex: number, item: GameLevelSelectItem): void {
        // console.log(`Level selected: index=${levelIndex}, item node='${item.node.name}'`);

        // Hide this page if available.
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call hide().");
        }

        // Reopen the main page
        const playBoardPage = GamePlayBoardPage.getInstance<GamePlayBoardPage>();
        if (!playBoardPage) {
            console.warn("GamePlayBoardPage singleton instance not found in Main scene.");
            return;
        }
        playBoardPage.showAndLoadLevelWhenFinishAnimation(levelIndex);

        // save select level index to GameStats, reset stats for new game
        GameStats.selectLevelIndex = levelIndex;
        GameStats.resetStatsForNewGame();
    }

    /**
     * Update the star display for a given level index by finding the matching item
     * and forwarding the call to its `updateStarDisplay` method.
     * If items are not yet cached, tries to rescan children.
     * @param levelIndex - zero-based index of the level
     * @param starCount - number of stars to display
     */
    public updateStarDisplayForLevel(levelIndex: number, starCount: number): void {
        if (!Number.isInteger(levelIndex) || levelIndex < 0) {
            console.warn(`GameLevelSelectPage: invalid levelIndex ${levelIndex} passed to updateStarDisplayForLevel.`);
            return;
        }

        if (!this.gameLevelSelectItems || this.gameLevelSelectItems.length === 0) {
            console.warn(`GameLevelSelectPage: no cached GameLevelSelectItems available to update stars for level ${levelIndex}. Ensure loadAndRegisterItemListeners() has run.`);
            return;
        }

        const item = this.gameLevelSelectItems.find((it) => it.levelIndex === levelIndex);
        if (!item) {
            console.warn(`GameLevelSelectPage: no GameLevelSelectItem found with levelIndex ${levelIndex}.`);
            return;
        }

        item.updateStarDisplay(starCount);
    }

    //------------------------------
    //--- Cleanup
    protected onDestroy(): void {
        if (this.closeButton) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        }

        // Unsubscribe all item listeners
        for (const unsubscribe of this.itemUnsubscribes.values()) {
            try {
                unsubscribe();
            } catch (e) {
                console.warn("Error while unsubscribing item listener:", e);
            }
        }
        this.itemUnsubscribes.clear();
        // Clear cached items list
        this.gameLevelSelectItems = [];
    }
}
