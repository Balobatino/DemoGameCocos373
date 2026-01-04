import { _decorator, Component, Sprite, UITransform, Widget, Enum, Vec2 } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

/** Enum to specify which axis to fit the parent container on.*/
export enum FitParentOnAxis {
    Horizontal = 0,
    Vertical = 1,
}
/**Create a runtime Cocos Enum so the editor shows a dropdown. */
const FitParentOnAxisEnum = Enum(FitParentOnAxis);

/**
 * Component that adjusts node scale to maintain the aspect ratio of a Sprite 
 * based on its UITransform content size.
 */
@ccclass('UIPreserveAspect')
@executeInEditMode(true)
export class UIPreserveAspect extends Component {
    // #region Properties
    private _sprite: Sprite | null = null;
    private _uiTransform: UITransform | null = null;
    private _uiWidget: Widget | null = null;

    /** Axis to force-fit the parent container on while preserving the other axis to maintain the image ratio. */
    @property({ type: FitParentOnAxis })
    fitParentOnAxis: FitParentOnAxis = FitParentOnAxis.Horizontal;
    // #endregion Properties

    // #region Lifecycle
    onEnable() {
        this.updateAspect();
    }

    onDisable() {
        // Logic for when component/node is disabled
    }
    // #endregion Lifecycle

    // #region Logic
    /**
     * Caches the required components if they haven't been cached yet.
     */
    private cacheComponent() {
        if (!this._sprite) {
            this._sprite = this.getComponent(Sprite);
        }
        if (!this._uiTransform) {
            this._uiTransform = this.getComponent(UITransform);
        }
        if (!this._uiWidget) {
            this._uiWidget = this.getComponent(Widget);
        }

        if (this._uiWidget) {
            this._uiWidget.alignMode = Widget.AlignMode.ALWAYS;
        }

    }

    /**
     * Updates the node's scale to fit the sprite frame within the container 
     * without distortion.
     */
    updateAspect() {
        this.cacheComponent();

        // Ensure both components are available
        if (!this._sprite || !this._sprite.spriteFrame) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Sprite or SpriteFrame is missing.`);
            return;
        }
        if (!this._uiTransform) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: UITransform component is missing.`);
            return;
        }
        
        // Use the parent's UITransform as the container we should fit into
        const parent = this.node.parent;
        if (!parent) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Parent node is missing.`);
            return;
        }
        const parentUI = parent.getComponent(UITransform);
        if (!parentUI) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Parent UITransform is missing.`);
            return;
        }

        // Make this node centered and sized to match the parent container
        this.node.setPosition(0, 0, 0);
        this._uiTransform.anchorPoint = new Vec2(0.5, 0.5);
        this._uiTransform.setContentSize(parentUI.contentSize.width, parentUI.contentSize.height);

        const containerSize = parentUI.contentSize;  // Desired container size
        const originalSize = this._sprite.spriteFrame.originalSize;  // Original image size

        const containerRatio = containerSize.width / containerSize.height;
        const imageRatio = originalSize.width / originalSize.height;

        // First: compute a uniform scale that fits the image entirely inside the container
        let uniformScale: number;
        if (imageRatio > containerRatio) {
            // Image is relatively wider than the container: fit by width
            uniformScale = containerSize.width / originalSize.width;
        } else {
            // Image is relatively taller than the container: fit by height
            uniformScale = containerSize.height / originalSize.height;
        }

        // Start with the uniform scale so the image fits the container without distortion
        let scaleX = uniformScale;
        let scaleY = uniformScale;

        // Then, if requested, force-fit the chosen parent axis and preserve the image ratio in the other axis.
        // Note: we set the node's contentSize to match the parent, so setting scale=1 on the forced axis keeps that axis matching the parent.
        // We compute the other axis scale so the displayed image preserves the original aspect ratio.
        switch (this.fitParentOnAxis) {
            case FitParentOnAxis.Horizontal:
                // Force width to match container width: keep scaleX = 1 (content width already equals container width),
                // compute scaleY so displayed height = containerWidth * (originalHeight/originalWidth)
                // scaleY = (containerWidth * originalHeight / originalWidth) / containerHeight
                scaleX = 1;
                if (containerSize.height > 0 && originalSize.width > 0) {
                    scaleY = (containerSize.width * originalSize.height) / (originalSize.width * containerSize.height);
                } else {
                    scaleY = uniformScale;
                }
                break;
            case FitParentOnAxis.Vertical:
                // Force height to match container height: keep scaleY = 1 (content height already equals container height),
                // compute scaleX so displayed width = containerHeight * (originalWidth/originalHeight)
                // scaleX = (containerHeight * originalWidth / originalHeight) / containerWidth
                scaleY = 1;
                if (containerSize.width > 0 && originalSize.height > 0) {
                    scaleX = (containerSize.height * originalSize.width) / (originalSize.height * containerSize.width);
                } else {
                    scaleX = uniformScale;
                }
                break;
            default:
                console.warn(`UIPreserveAspect, node ${this.node.name}: Unknown fitParentOnAxis value (${this.fitParentOnAxis}). Using uniform scale.`);
                break;
        }

        this.node.setScale(scaleX, scaleY, 1);
        // log the scaling for debugging
        console.log(`UIPreserveAspect: Set scaleX=${scaleX}, scaleY=${scaleY}. Container Size: ${containerSize.width}x${containerSize.height}, Image Size: ${originalSize.width}x${originalSize.height}`);
    }

    onLoad() {
        this.updateAspect();
    }
    // #endregion Logic
}