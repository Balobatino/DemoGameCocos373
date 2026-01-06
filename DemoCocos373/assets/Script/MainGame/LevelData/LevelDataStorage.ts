import { _decorator, Component, Vec2 } from "cc";
const { ccclass, property: prop } = _decorator;

/**
 * Serializable data object representing a single level.
 */
@ccclass("LevelData")
export class LevelData {
    /**
     * The size of the level in grid units (columns, rows).
     */
    @prop
    public size: Vec2 = new Vec2();
}

/**
 * Editor-friendly container for level data.
 * Attach this component to a Node, configure `levels` in the inspector
 * and save the Node as a prefab to persist configuration in the Assets panel.
 */
@ccclass("LevelDataStorage")
export class LevelDataStorage extends Component {
    /**
     * Configured list of levels (editable in the inspector).
     */
    @prop([LevelData])
    public levels: LevelData[] = [];

    /**
     * Return a LevelData by index. Index will be clamped to the available range.
     * If the list is empty, returns null and logs a warning.
     * @param levelIndex - Requested level index (0-based)
     * @returns LevelData or null if none available
     */
    public getLevel(levelIndex: number): LevelData | null {
        if (!this.levels || this.levels.length === 0) {
            console.warn("LevelDataStorageComponent: No levels available to return.");
            return null;
        }

        const clampedIndex = Math.min(Math.max(levelIndex, 0), this.levels.length - 1);

        if (clampedIndex !== levelIndex) {
            console.warn(`LevelDataStorageComponent: Requested levelIndex ${levelIndex} was clamped to ${clampedIndex}.`);
        }

        return this.levels[clampedIndex];
    }

    /**
     * Number of configured levels.
     */
    public get levelCount(): number {
        return this.levels ? this.levels.length : 0;
    }
}
