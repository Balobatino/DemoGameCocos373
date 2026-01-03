import { _decorator, Component, Sprite, UITransform, Size, spriteAssembler } from 'cc';
const { ccclass, property, executeInEditMode } = _decorator;

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

        let scale: number;
        if (imageRatio > containerRatio) {
            // Fit based on width if image is wider than container ratio
            scale = containerSize.width / originalSize.width;
        } else {
            // Fit based on height if image is taller than container ratio
            scale = containerSize.height / originalSize.height;
        }

        this.node.setScale(scale, scale, 1);
        // log the scaling for debugging
        console.log(`UIPreserveAspect: Set scale to ${scale}. Container Size: ${containerSize.width}x${containerSize.height}, Image Size: ${originalSize.width}x${originalSize.height}`);
    }

    onLoad() {
        this.updateAspect();
    }
    // #endregion Logic
}