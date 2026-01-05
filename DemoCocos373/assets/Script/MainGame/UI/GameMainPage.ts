import { _decorator, Component, Node } from "cc";
import { Singleton } from "../../Standard/Singleton";
import { UIPage } from "../../Standard/UIPage/UIPage";
const { ccclass, property } = _decorator;

/**
 * GameMainPage: Singleton that manages the main UI page for the game.
 */
@ccclass("GameMainPage")
export class GameMainPage extends Singleton<GameMainPage> {
    // Cached UIPage component for the main page. May be null if not found.
    private uiPage: UIPage | null = null;

    /**
     * Load-time initialization hook for the singleton.
     * Finds the UIPage component on this node or its children and caches it.
     * Logs an error if not found to help debugging.
     */
    protected doOnLoad(): void {
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

    /**
     * Return the cached UIPage instance, or null when not available.
     */
    public getUiPage(): UIPage | null {
        return this.uiPage;
    }
}
