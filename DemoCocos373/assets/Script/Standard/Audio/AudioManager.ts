import { _decorator, Component, Node, AudioSource, AudioClip } from "cc";
import { Singleton } from "../Singleton";
import { AudioPlayer, AudioType } from "./AudioPlayer";
import { CollectionUtils } from "../../Utils/CollectionUtils";
const { ccclass, property } = _decorator;

/**
 * Simple pooled audio manager that provides one-shot SFX and looped BGM players.
 */
@ccclass("AudioManager")
export class AudioManager extends Singleton<AudioManager> {
    //------------------------------
    //--- Private Properties

    // Pool of available (idle) players
    private idlePlayers: AudioPlayer[] = [];

    // Currently playing players (both SFX and BGM)
    private playingPlayers: AudioPlayer[] = [];

    // Mute flags for BGM and SFX
    private isMuteBGM: boolean = false;
    private isMuteSFX: boolean = false;

    //------------------------------
    //--- Lifecycle Methods
    protected doOnLoad(): void {
        // Pre-warm a small pool
        for (let i = 0; i < 2; i++) {
            const p = this.createPlayer();
            this.idlePlayers.push(p);
        }
    }

    //------------------------------
    //--- Public Methods

    /** Play a one-shot SFX. */
    public playOnShot(clip: AudioClip | null): void {
        if (!clip) return;
        const player = this.getIdlePlayer();
        player.playOnShot(clip);
        this.playingPlayers.push(player);
    }

    /** Play a looped BGM. */
    public playBgm(clip: AudioClip | null): void {
        if (!clip) return;
        const player = this.getIdlePlayer();
        player.playBgm(clip);
        this.playingPlayers.push(player);
    }

    /** Called by players when they finish playback and should return to the pool. */
    public returnToIdlePlayers(player: AudioPlayer): void {
        const idx = this.playingPlayers.indexOf(player);
        if (idx === -1) return;

        // Fast remove by swapping with last and popping (O(1)). Order is not preserved.
        CollectionUtils.fastRemoveAt(this.playingPlayers, idx);

        // reset player state and push to idle pool
        if (player.audioSource) {
            player.audioSource.stop();
            player.audioSource.clip = null;
        }
        player.audioType = AudioType.None;
        this.idlePlayers.push(player);
    }

    /** Currently fixed to 1.0; later make configurable. Returns 0 when BGM is muted. */
    public getVolumeBGM(): number {
        return this.isMuteBGM ? 0 : 1;
    }

    /** Currently fixed to 1.0; later make configurable. Returns 0 when SFX is muted. */
    public getVolumeSFX(): number {
        return this.isMuteSFX ? 0 : 1;
    }

    /** Toggle BGM mute state. */
    public toggleMuteBGM(): void {
        this.isMuteBGM = !this.isMuteBGM;
        this.updatePlayingVolumes();
    }

    /** Toggle SFX mute state. */
    public toggleMuteSFX(): void {
        this.isMuteSFX = !this.isMuteSFX;
        this.updatePlayingVolumes();
    }

    /** Returns whether BGM is currently muted. */
    public isBgmMuted(): boolean {
        return this.isMuteBGM;
    }

    /** Returns whether SFX is currently muted. */
    public isSfxMuted(): boolean {
        return this.isMuteSFX;
    }

    /** Update volume on currently playing players to respect mute flags. */
    private updatePlayingVolumes(): void {
        for (const p of this.playingPlayers) {
            if (!p.audioSource) continue;
            if (p.audioType === AudioType.BGM) {
                p.audioSource.volume = this.getVolumeBGM();
            } else if (p.audioType === AudioType.SFX) {
                p.audioSource.volume = this.getVolumeSFX();
            }
        }
    }

    //------------------------------
    //--- Private Methods

    /** Create a new AudioPlayer node with AudioSource attached. */
    private createPlayer(): AudioPlayer {
        const node = new Node("AudioPlayer");
        node.setParent(this.node);
        const player = node.addComponent(AudioPlayer);
        const src = node.addComponent(AudioSource);
        player.audioSource = src;
        return player;
    }

    /** Return an idle player (reuse from pool or create new). */
    private getIdlePlayer(): AudioPlayer {
        if (this.idlePlayers.length > 0) {
            return this.idlePlayers.pop()!;
        }
        return this.createPlayer();
    }
}
