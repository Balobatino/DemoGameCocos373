import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("BaseUIElementAnimation")
export class BaseUIElementAnimation extends Component {
    /**
     * Called to play show animation on the element.
     * Default implementation is empty; override in subclasses.
     */
    public playShowAnimation(): void {}

    /**
     * Called to play hide animation on the element.
     * Default implementation is empty; override in subclasses.
     */
    public playHideAnimation(): void {}
}
