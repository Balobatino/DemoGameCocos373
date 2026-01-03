import { _decorator, Component, Sprite, UITransform, Size, spriteAssembler } from 'cc';
const { ccclass, property } = _decorator;

/**
 * Component that adjusts node scale to maintain the aspect ratio of a Sprite 
 * based on its UITransform content size.
 */
@ccclass('UIPreserveAspect')
export class UIPreserveAspect extends Component {
    /**
     * Updates the node's scale to fit the sprite frame within the container 
     * without distortion.
     */
    updateAspect() {
        const sprite = this.getComponent(Sprite);
        if (!sprite || !sprite.spriteFrame) return;

        const uiTransform = this.getComponent(UITransform);
        const containerSize = uiTransform.contentSize;  // Desired container size
        const originalSize = sprite.spriteFrame.originalSize;  // Original image size

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
    }

    onLoad() {
        this.updateAspect();
    }
    
    
    // Call this if sprite changes at runtime
    // updateAspect();
}