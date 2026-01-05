import { _decorator, Component, Node, easing, Enum } from "cc";
const { ccclass, property } = _decorator;

/**
 * EasingType
 *
 * Enum of available easing choices. Use this in components to expose an editor
 * dropdown and to look up the corresponding easing function.
 */
export enum EasingType {
    Linear = 0,
    QuadIn = 1,
    QuadOut = 2,
    QuadInOut = 3,
    CubicIn = 4,
    CubicOut = 5,
    CubicInOut = 6,
    QuartIn = 7,
    QuartOut = 8,
    QuartInOut = 9,
    QuintIn = 10,
    QuintOut = 11,
    QuintInOut = 12,
    SineIn = 13,
    SineOut = 14,
    SineInOut = 15,
    ExpoIn = 16,
    ExpoOut = 17,
    ExpoInOut = 18,
    CircIn = 19,
    CircOut = 20,
    CircInOut = 21,
    BackIn = 22,
    BackOut = 23,
    BackInOut = 24,
    ElasticIn = 25,
    ElasticOut = 26,
    ElasticInOut = 27,
    BounceIn = 28,
    BounceOut = 29,
    BounceInOut = 30,
}

/**
 * EasingMap
 *
 * Centralized, cached mapping between `EasingType` and the actual Cocos easing
 * functions. The map is built lazily on first request and can be initialized
 * eagerly via `initialize()` to warm the cache early (e.g. on first scene load).
 */
export class EasingMap {
    private static map: Map<EasingType, (t: number) => number> | null = null;

    /**
     * Initialize (build) the easing map if not already built.
     * Safe to call multiple times.
     */
    public static initialize() {
        if (!this.map) this.buildMap();
    }

    /**
     * Get the easing function for the given EasingType.
     * Falls back to `easing.linear` and logs a warning if the value is not mapped.
     */
    public static get(e: EasingType): (t: number) => number {
        if (!this.map) this.buildMap();

        const fn = this.map!.get(e);
        if (!fn) {
            console.warn(`EasingMap: Unhandled easing value: ${e} - falling back to linear.`);
            return easing.linear;
        }
        return fn;
    }

    /**
     * Private builder for the map. Keeps all mapping in one place.
     */
    private static buildMap() {
        const m = new Map<EasingType, (t: number) => number>();

        m.set(EasingType.Linear, easing.linear);

        m.set(EasingType.QuadIn, easing.quadIn);
        m.set(EasingType.QuadOut, easing.quadOut);
        m.set(EasingType.QuadInOut, easing.quadInOut);

        m.set(EasingType.CubicIn, easing.cubicIn);
        m.set(EasingType.CubicOut, easing.cubicOut);
        m.set(EasingType.CubicInOut, easing.cubicInOut);

        m.set(EasingType.QuartIn, easing.quartIn);
        m.set(EasingType.QuartOut, easing.quartOut);
        m.set(EasingType.QuartInOut, easing.quartInOut);

        m.set(EasingType.QuintIn, easing.quintIn);
        m.set(EasingType.QuintOut, easing.quintOut);
        m.set(EasingType.QuintInOut, easing.quintInOut);

        m.set(EasingType.SineIn, easing.sineIn);
        m.set(EasingType.SineOut, easing.sineOut);
        m.set(EasingType.SineInOut, easing.sineInOut);

        m.set(EasingType.ExpoIn, easing.expoIn);
        m.set(EasingType.ExpoOut, easing.expoOut);
        m.set(EasingType.ExpoInOut, easing.expoInOut);

        m.set(EasingType.CircIn, easing.circIn);
        m.set(EasingType.CircOut, easing.circOut);
        m.set(EasingType.CircInOut, easing.circInOut);

        m.set(EasingType.BackIn, easing.backIn);
        m.set(EasingType.BackOut, easing.backOut);
        m.set(EasingType.BackInOut, easing.backInOut);

        m.set(EasingType.ElasticIn, easing.elasticIn);
        m.set(EasingType.ElasticOut, easing.elasticOut);
        m.set(EasingType.ElasticInOut, easing.elasticInOut);

        m.set(EasingType.BounceIn, easing.bounceIn);
        m.set(EasingType.BounceOut, easing.bounceOut);
        m.set(EasingType.BounceInOut, easing.bounceInOut);

        this.map = m;
    }
}
