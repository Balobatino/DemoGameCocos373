import { _decorator, Component, Node } from "cc";
import { BaseUIElementAnimation } from "./BaseUIElementAnimation";
const { ccclass, property } = _decorator;

@ccclass("UIElement")
export class UIElement extends Component {
    //------------------------------
    //--- Private Properties
    private animationList: BaseUIElementAnimation[] = [];

    //------------------------------
    //--- Lifecycle Methods
    onLoad(): void {
        // Get all components of this animation base type on the node and store them.
        const comps = this.node.getComponents(BaseUIElementAnimation);
        if (comps && comps.length > 0) {
            this.animationList = comps;
        } else {
            this.animationList = [];
        }
    }

    //------------------------------
    //--- Public Methods

    public playShowAnimation(): void {
        for (const anim of this.animationList) {
            anim.playShowAnimation();
        }
    }

    public playHideAnimation(): void {
        for (const anim of this.animationList) {
            anim.playHideAnimation();
        }
    }
}
