import { _decorator, Component, Sprite, UITransform, Widget, Enum, Vec2, Size } from 'cc';
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
    private sprite: Sprite | null = null;
    private uiTransform: UITransform | null = null;
    private parentUITransform: UITransform | null = null;

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
        if (!this.sprite) {
            this.sprite = this.getComponent(Sprite);
        }
        if (!this.uiTransform) {
            this.uiTransform = this.getComponent(UITransform);
        }
        if (!this.parentUITransform) {
            this.parentUITransform = this.getParentUITransform();
        }
    }

    /**
     * Updates the node's scale to fit the sprite frame within the container 
     * without distortion. This method is a short orchestrator that defers
     * work to smaller helper methods for readability and testability.
     */
    updateAspect() {
        this.cacheComponent();
        if (!this.ensureNoNullComponents()) {
            return;
        }

        // Center and size this node to match the parent
        this.centerAndMatchParent(this.parentUITransform);

        // Compute scales
        const containerSize = this.parentUITransform.contentSize;
        const originalSize = this.sprite.spriteFrame.originalSize;

        const uniformScale = this.computeUniformScale(containerSize, originalSize);
        const { scaleX, scaleY } = this.computeScales(containerSize, originalSize, uniformScale);

        // Apply scale and optionally update widget alignment
        this.node.setScale(scaleX, scaleY, 1);

        // log the scaling for debugging
        // console.log(`UIPreserveAspect: Set scaleX=${scaleX}, scaleY=${scaleY}. Container Size: ${containerSize.width}x${containerSize.height}, Image Size: ${originalSize.width}x${originalSize.height}`);
    }

    /**
     * Check that required components are not null, logging warnings if they are missing.
     * Returns true if all components are present, false otherwise.
     */
    private ensureNoNullComponents(): boolean {
        if (!this.sprite || !this.sprite.spriteFrame) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Sprite or SpriteFrame is missing.`);
            return;
        }
        if (!this.uiTransform) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: UITransform component is missing.`);
            return;
        }
        const parentUI = this.getParentUITransform();
        if (!parentUI) {
            return; // warnings already emitted by helper
        }
        // passed all checks
        return true;
    }

    /**
     * Return parent's UITransform or null (and log a warning) if missing.
     */
    private getParentUITransform(): UITransform | null {
        const parent = this.node.parent;
        if (!parent) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Parent node is missing.`);
            return null;
        }
        const parentUI = parent.getComponent(UITransform);
        if (!parentUI) {
            console.warn(`UIPreserveAspect, node ${this.node.name}: Parent UITransform is missing.`);
            return null;
        }
        return parentUI;
    }

    /**
     * Center this node and make its contentSize match the parent container.
     */
    private centerAndMatchParent(parentUI: UITransform) {
        this.node.setPosition(0, 0, 0);
        if (this.uiTransform) {
            this.uiTransform.anchorPoint = new Vec2(0.5, 0.5);
            this.uiTransform.setContentSize(parentUI.contentSize.width, parentUI.contentSize.height);
        }
    }

    /**
     * Compute a uniform scale that fits the image entirely inside the container.
     */
    private computeUniformScale(containerSize: Size, originalSize: Size): number {
        const containerRatio = containerSize.width / containerSize.height;
        const imageRatio = originalSize.width / originalSize.height;

        if (imageRatio > containerRatio) {
            // Image is relatively wider than the container: fit by width
            return containerSize.width / originalSize.width;
        } else {
            // Image is relatively taller than the container: fit by height
            return containerSize.height / originalSize.height;
        }
    }

    /**
     * Compute axis-specific scales based on fit mode while preserving aspect ratio.
     */
    private computeScales(containerSize: Size, originalSize: Size, uniformScale: number): { scaleX: number, scaleY: number } {
        // Start with the uniform scale so the image fits the container without distortion
        let scaleX = uniformScale;
        let scaleY = uniformScale;

        switch (this.fitParentOnAxis) {
            case FitParentOnAxis.Horizontal:
                // Force width to match container width: keep scaleX = 1 (content width already equals container width),
                // compute scaleY so displayed height = containerWidth * (originalHeight/originalWidth) / containerHeight
                scaleX = 1;
                if (containerSize.height > 0 && originalSize.width > 0) {
                    scaleY = (containerSize.width * originalSize.height) / (originalSize.width * containerSize.height);
                } else {
                    scaleY = uniformScale;
                }
                break;
            case FitParentOnAxis.Vertical:
                // Force height to match container height: keep scaleY = 1 (content height already equals container height),
                // compute scaleX so displayed width = containerHeight * (originalWidth/originalHeight) / containerWidth
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

        return { scaleX, scaleY };
    }
    // #endregion Logic
}