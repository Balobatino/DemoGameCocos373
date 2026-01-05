import { _decorator, Component, Node } from "cc";
import { UIElement } from "./UIElement";
const { ccclass, property } = _decorator;

/**
 * UIPage: container for a page composed of multiple UIElement components.
 * Drag UIElement component instances into `uiElements` in the inspector.
 */
@ccclass("UIPage")
export class UIPage extends Component {
    //------------------------------
    //------ Properties

    // UIElement components assigned via the Cocos Creator inspector.
    private uiElements: UIElement[] = [];

    //------------------------------
    //--- Lifecycle Methods
    /**
     * onLoad: ensure `uiElements` contains all `UIElement` components found
     * on this node and its children. If the inspector already provided values,
     * we keep them; otherwise we auto-populate from children for convenience.
     */
    onLoad(): void {
        // Find all UIElement components in this node's hierarchy.
        const found = this.node.getComponentsInChildren(UIElement);
        if (found && found.length > 0) {
            this.uiElements = found;
        } else {
            this.uiElements = [];
        }
    }

    //------------------------------
    //------ Public Methods

    public show(): void {
        for (const element of this.uiElements) {
            element.playShowAnimation();
        }
    }

    public hide(): void {
        for (const element of this.uiElements) {
            element.playHideAnimation();
        }
    }
}
