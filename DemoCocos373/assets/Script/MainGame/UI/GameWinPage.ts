import { _decorator, Button, Label, Node, tween, Vec3, easing } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
import { GameLevelSelectPage } from "./GameLevelSelectPage";
import { GameStats } from "../GameStats/GameStats";
import { GamePlayBoardPage } from "./GamePlayBoardPage";
const { ccclass, property } = _decorator;

/**
 * Inspector group for Win Page UI references.
 */
@ccclass("GameWinPageUIReference")
class UIReference {
    @property({ type: Button })
    public replayButton: Button | null = null;

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

        const replayBtn = this.uiRef.replayButton;
        if (replayBtn) {
            replayBtn.node.on(Button.EventType.CLICK, this.onReplayButtonClicked, this);
        } else {
            console.warn("GameWinPage: replayButton is not assigned in the inspector (uiRef.replayButton).");
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

    private onReplayButtonClicked(): void {
        // Hide this page if available.
        const uiPage = this.getUiPage();
        if (uiPage) {
            uiPage.hide();
        } else {
            console.warn("GameLevelSelectPage: UIPage component not found; cannot call hide().");
        }

        // Reopen the main page for the same current level
        const playBoardPage = GamePlayBoardPage.getInstance<GamePlayBoardPage>();
        if (!playBoardPage) {
            console.warn("GamePlayBoardPage singleton instance not found in Main scene.");
            return;
        }
        playBoardPage.showAndLoadLevelWhenFinishAnimation(GameStats.selectLevelIndex);
        // reset stats for new game
        GameStats.resetStatsForNewGame();
    }

    private onNextButtonClicked(): void {
        // hide this page
        const page = this.getUiPage();
        if (page) {
            page.hide();
        } else {
            console.warn("GameWinPage: UIPage component not found; cannot call hide().");
        }

        // Reopen the main page for next level index
        GameStats.selectLevelIndex++;
        const playBoardPage = GamePlayBoardPage.getInstance<GamePlayBoardPage>();
        if (!playBoardPage) {
            console.warn("GamePlayBoardPage singleton instance not found in Main scene.");
            return;
        }
        playBoardPage.showAndLoadLevelWhenFinishAnimation(GameStats.selectLevelIndex);
        // reset stats for new game
        GameStats.resetStatsForNewGame();
    }

    //------------------------------
    //--- Win animation flow

    /**
     * Show the win page, prepare UI, and start the win animation asynchronously.
     * "Disable" in this context means the interactive controls and star/score
     * displays are hidden or made non-interactable until the animation plays.
     */
    public openAndStartWingameAnimation(): void {
        const page = this.getUiPage();
        if (page) {
            page.show();
        } else {
            console.warn("GameWinPage: UIPage component not found; cannot call show().");
        }

        // Disable buttons (non-interactable) and prepare visual nodes for animation.
        if (this.uiRef.replayButton) {
            this.uiRef.replayButton.node.setScale(0, 0, 0);
            this.uiRef.replayButton.node.active = true;
        }
        if (this.uiRef.homeButton) {
            // ensure scale starts at 0 so the pop animation works later
            this.uiRef.homeButton.node.setScale(0, 0, 0);
            this.uiRef.homeButton.node.active = true;
        }
        if (this.uiRef.nextButton) {
            this.uiRef.nextButton.node.setScale(0, 0, 0);
            this.uiRef.nextButton.node.active = true;
        }

        // disable all star nodes and score text, we'll enable and animate them during the animation
        for (const s of this.uiRef.starOnList) {
            s.active = false;
            s.setScale(0, 0, 0);
        }

        if (this.uiRef.scoreText) {
            this.uiRef.scoreText.node.active = false;
        }

        // Start the async animation (fire-and-forget; errors are logged).
        this.wingameAnimation().catch((err) => console.error("GameWinPage: wingameAnimation failed:", err));
    }

    /**
     * Run the win animation sequence:
     * - compute star count from GameStats
     * - block page interaction
     * - pop-in each star with easing
     * - animate score value from 0 to final score
     * - pop-in home and next buttons then re-enable page interaction
     */
    public async wingameAnimation(): Promise<void> {
        // compute stars using GameStats
        const pairCount = GameStats.getCurrentLevelPairCount();
        const turns = GameStats.turnCount;
        const starsEarned = GameStats.calculateStarForScore(pairCount, turns);

        // ensure page interaction is blocked while animations play
        const page = this.getUiPage();
        if (page) page.setActiveInteraction(false);

        // Pop each earned star in sequence
        for (let i = 0; i < starsEarned && i < this.uiRef.starOnList.length; i++) {
            const starNode = this.uiRef.starOnList[i];
            starNode.active = true;
            starNode.setScale(0, 0, 0);

            // Start the star pop tween (do not await here; the sleep controls timing)
            tween(starNode)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();

            // wait a bit more so each star pop feels distinct
            await this.sleep(600);
        }

        // Animate numeric score from 0 -> final score over 1.5s
        if (this.uiRef.scoreText) {
            const label = this.uiRef.scoreText;
            label.node.active = true;
            // await this.animateNumber(label, GameStats.matchingScore, 1500);
            this.animateScoreText(0, GameStats.matchingScore, 1.5, label);
            // wait for the score animation to complete
            await this.sleep(1500);
        }

        // wait 500ms before showing buttons
        await this.sleep(500);

        // Pop-in replay button
        if (this.uiRef.replayButton) {
            const replayButton = this.uiRef.replayButton.node;
            replayButton.active = true;
            replayButton.setScale(0, 0, 0);
            // Start replay button pop tween (fire-and-forget)
            tween(replayButton)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
            await this.sleep(300);
        }

        // Pop-in home button
        if (this.uiRef.homeButton) {
            const homeButton = this.uiRef.homeButton.node;
            homeButton.active = true;
            homeButton.setScale(0, 0, 0);
            // Start home button pop tween (fire-and-forget)
            tween(homeButton)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
            await this.sleep(300);
        }

        // Pop-in next button
        if (this.uiRef.nextButton) {
            const nextButton = this.uiRef.nextButton.node;
            nextButton.active = true;
            nextButton.setScale(0, 0, 0);
            // Start next button pop tween (fire-and-forget)
            tween(nextButton)
                .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
            await this.sleep(300);
        }

        // Re-enable interactions on the page and buttons
        if (page) page.setActiveInteraction(true);
    }

    // ------------------------------
    // Helpers

    // Helper: simple sleep
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Smoothly tween a numeric label from startValue to endValue over `duration` seconds.
     * Ensures the label displays the exact final value when the tween completes.
     */
    private animateScoreText(startValue: number, endValue: number, duration: number, labelText: Label): void {
        const obj: { value: number } = { value: startValue };

        // Update label on each tween tick; set final value explicitly when done.
        tween(obj)
            .to(
                duration,
                { value: endValue },
                {
                    onUpdate: () => {
                        labelText.string = Math.floor(obj.value).toString();
                    },
                }
            )
            // make sure by the end of the tween it shows the exact final value
            .call(() => {
                labelText.string = Math.floor(endValue).toString();
            })
            .start();
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
        const replayBtn = this.uiRef.replayButton;
        if (replayBtn) {
            replayBtn.node.off(Button.EventType.CLICK, this.onReplayButtonClicked, this);
        }
    }
}
