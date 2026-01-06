import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("BaseUIElementAnimation")
export abstract class BaseUIElementAnimation extends Component {
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

    /**
     * Returns total duration of the show animation (including any delay), in seconds.
     */
    public abstract getShowDuration(): number;

    /**
     * Returns total duration of the hide animation (including any delay), in seconds.
     */
    public abstract getHideDuration(): number;
}
