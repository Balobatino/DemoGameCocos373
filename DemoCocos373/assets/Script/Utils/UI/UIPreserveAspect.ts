import { _decorator, Component, Sprite, UITransform, Size, spriteAssembler, Enum } from 'cc';
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

    /** Axis to force-fit the parent container on while preserving the other axis to maintain the image ratio. */
    @property({ type: FitParentOnAxisEnum })
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
        
        const containerSize = this._uiTransform.contentSize;  // Desired container size
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

        // Then, if requested, force-fit the chosen parent axis and preserve the image ratio in the other axis
        switch (this.fitParentOnAxis) {
            case FitParentOnAxis.Horizontal:
                // Make the scaled width exactly match container width, preserve ratio by using the same scale for Y
                scaleX = containerSize.width / originalSize.width;
                scaleY = scaleX;
                break;
            case FitParentOnAxis.Vertical:
                // Make the scaled height exactly match container height, preserve ratio by using the same scale for X
                scaleY = containerSize.height / originalSize.height;
                scaleX = scaleY;
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