import { _decorator, Component, Node } from "cc";
import { BaseUIElementAnimation } from "./BaseUIElementAnimation";
const { ccclass, property } = _decorator;

@ccclass("UIElement")
export class UIElement extends Component {
    //------------------------------
    //--- Private Properties
    private animationList: BaseUIElementAnimation[] = [];
    // Cache duration values. A negative sentinel (-99) indicates the duration has
    // not been computed / cached yet; valid animation durations are expected to be >= 0.
    private cacheShowDuration: number = -99;
    private cacheHideDuration: number = -99;

    //------------------------------
    //--- Lifecycle Methods
    onLoad(): void {
        // Get all components of this animation base type on the node and store them.
        // BaseUIElementAnimation is an abstract base class so cast to any for getComponents.
        const comps = this.node.getComponents(BaseUIElementAnimation as any) as BaseUIElementAnimation[];
        if (comps && comps.length > 0) {
            this.animationList = comps;
        } else {
            this.animationList = [];
        }
    }

    //------------------------------
    //--- Public Methods

    public getShowDuration(): number {
        if (this.cacheShowDuration >= 0) return this.cacheShowDuration;
        let max = 0;
        for (const anim of this.animationList) {
            const d = anim.getShowDuration();
            if (d > max) max = d;
        }
        this.cacheShowDuration = max;
        return max;
    }

    public getHideDuration(): number {
        if (this.cacheHideDuration >= 0) return this.cacheHideDuration;
        let max = 0;
        for (const anim of this.animationList) {
            const d = anim.getHideDuration();
            if (d > max) max = d;
        }
        this.cacheHideDuration = max;
        return max;
    }

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
