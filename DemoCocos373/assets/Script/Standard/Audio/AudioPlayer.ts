import { _decorator, AudioSource, Component, AudioClip } from "cc";
import { AudioManager } from "./AudioManager";
const { ccclass, property } = _decorator;

/**
 * Audio player used by AudioManager pool.
 */
export enum AudioType {
    None = 0,
    BGM = 1,
    SFX = 2,
}

@ccclass("AudioPlayer")
export class AudioPlayer extends Component {
    //------------------------------
    //--- Public Properties

    @property({ type: AudioSource })
    public audioSource: AudioSource | null = null;

    // Tracks whether this player is currently playing BGM or SFX
    public audioType: AudioType = AudioType.None;

    //------------------------------
    //--- Public Methods

    /** Play a one-shot SFX and return to the manager when finished. */
    public playOnShot(clip: AudioClip | null): void {
        if (!clip) return;

        const src = this.ensureSource();
        this.audioType = AudioType.SFX;

        const manager = AudioManager.getInstance<AudioManager>();
        src.clip = clip;
        src.loop = false;
        src.volume = manager ? manager.getVolumeSFX() : 1;
        src.play();

        // schedule a return to the pool when playback finishes. add small buffer to ensure complete.
        const duration = clip.getDuration();
        this.scheduleOnce(() => {
            const manager = AudioManager.getInstance<AudioManager>();
            if (manager) manager.returnToIdlePlayers(this);
        }, duration + 0.05);
    }

    /** Play a looped BGM. Does NOT auto-return; caller must stop/replace. */
    public playBgm(clip: AudioClip | null): void {
        if (!clip) return;

        const src = this.ensureSource();
        this.audioType = AudioType.BGM;

        const mgr = AudioManager.getInstance<AudioManager>();
        src.clip = clip;
        src.loop = true;
        src.volume = mgr ? mgr.getVolumeBGM() : 1;
        src.play();
    }

    /** Stop playback and return to the pool. */
    public stop(): void {
        if (this.audioSource) this.audioSource.stop();
        const manager = AudioManager.getInstance<AudioManager>();
        if (manager) manager.returnToIdlePlayers(this);
    }

    //------------------------------
    //--- Private Methods

    private ensureSource(): AudioSource {
        if (!this.audioSource) {
            const src = this.getComponent(AudioSource) || this.node.addComponent(AudioSource);
            this.audioSource = src;
        }
        return this.audioSource!;
    }
}
