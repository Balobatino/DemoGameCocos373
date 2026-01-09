import { _decorator, Component, Node } from "cc";
const { ccclass, property } = _decorator;

/**
 * Utility helpers for working with collections/arrays.
 */
export class CollectionUtils {
    /**
     * Remove element at index by swapping with last and popping.
     * O(1) removal but does not preserve order.
     */
    public static fastRemoveAt<T>(arr: T[], idx: number): void {
        if (idx < 0 || idx >= arr.length) return;
        const last = arr.length - 1;
        if (idx !== last) {
            arr[idx] = arr[last];
        }
        arr.pop();
    }
}
