import { _decorator, Component, Node, UIOpacity } from "cc";
import { UIElement } from "./UIElement";
import { setAsLastSibling } from "../../Utils/NodeUtils";
const { ccclass, property } = _decorator;

/**
 * UIPage: container for a page composed of multiple UIElement components.
 * Drag UIElement component instances into `uiElements` in the inspector.
 */
@ccclass("UIPage")
export class UIPage extends Component {
    //------------------------------
    //------ Properties

    // Whether the page should be hidden when enabled (inspector-visible). Default: true.
    @property({ tooltip: "If true, the page will start hidden (opacity = 0) when enabled." })
    hideByDefault = true;

    // Whether to automatically call `show()` in `onEnable()` when the page is not hidden by default.
    @property({ tooltip: "If true and hideByDefault is false, the page will call show() when enabled." })
    showAtOnEnable = false;

    // UIElement components assigned via the Cocos Creator inspector.
    private uiElements: UIElement[] = [];

    // Cached UIOpacity component (initialized in onLoad and assumed non-null afterwards).
    private uiOpacity!: UIOpacity;

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

        // Cache UIOpacity so we can control page visibility via opacity.
        this.uiOpacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
    }

    //------------------------------
    //------ Lifecycle Methods (continued)
    /**
     * onEnable: apply hide-by-default behavior by setting node opacity to 0 when requested.
     * Uses the cached `uiOpacity` component that is initialized in `onLoad`.
     * If the page is not hidden by default and `showAtOnEnable` is enabled, call `show()`.
     */
    onEnable(): void {
        // Apply hide-by-default using cached uiOpacity (populated in onLoad).
        if (this.hideByDefault) {
            this.uiOpacity.opacity = 0;
        } else if (this.showAtOnEnable) {
            // When not hidden by default, optionally show the page immediately on enable.
            this.show();
        }
    }

    //------------------------------
    //------ Public Methods

    public show(): void {
        // Ensure page is visible immediately by setting node opacity to fully opaque
        // (use cached uiOpacity from onLoad; do not query/add components here).
        this.uiOpacity.opacity = 255;

        // Ensure this page is rendered above sibling pages by moving it to the
        // last sibling position in the parent.
        setAsLastSibling(this.node);

        for (const element of this.uiElements) {
            element.playShowAnimation();
        }
    }

    public hide(): void {
        // Ensure page is visible during hide animation by setting node opacity to fully opaque
        // (use cached uiOpacity from onLoad; do not query/add components here).
        this.uiOpacity.opacity = 255;

        // Keep the same stacking behavior on hide to ensure animations are
        // visible if other UI overlaps during the hide animation.
        setAsLastSibling(this.node);

        for (const element of this.uiElements) {
            element.playHideAnimation();
        }
    }
}
