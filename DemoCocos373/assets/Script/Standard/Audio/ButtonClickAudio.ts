import { _decorator, Component, Node, Button, AudioClip } from "cc";
import { AudioManager } from "./AudioManager";
const { ccclass, property } = _decorator;

@ccclass("ButtonClickAudio")
export class ButtonClickAudio extends Component {
    //------------------------------
    //--- Inspector Properties

    @property({ type: AudioClip })
    public clickClip: AudioClip | null = null;

    //------------------------------
    //--- Private Properties
    private button: Button | null = null;

    //------------------------------
    //--- Lifecycle Methods

    protected onLoad(): void {
        const btn = this.getComponent(Button);
        if (!btn) return;
        this.button = btn;
        btn.node.on(Button.EventType.CLICK, this.onButtonClick, this);
    }

    protected onDestroy(): void {
        if (this.button) {
            this.button.node.off(Button.EventType.CLICK, this.onButtonClick, this);
        }
    }

    //------------------------------
    //--- Private Methods
    private onButtonClick(): void {
        if (!this.clickClip) return;
        const manager = AudioManager.getInstance<AudioManager>();
        if (!manager) return;
        manager.playOnShot(this.clickClip);
    }
}
