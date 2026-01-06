import { _decorator, Component, SpriteFrame, assetManager, CCString } from "cc";
const { ccclass, property } = _decorator;

// Editor is only available inside the Cocos Creator Editor. Declare it so TypeScript compilation
// succeeds for editor-guarded code paths. This declaration keeps the runtime check (typeof Editor) intact.
declare const Editor: any;

/**
 * Serializable container for a named pack of sprites.
 */
@ccclass("IconPackData")
export class IconPackData {
    /** The identifier / name of the pack. */
    @property({ type: CCString })
    public packName;
    //

    /** Sprites contained within this pack. */
    @property([SpriteFrame])
    public sprites: SpriteFrame[] = [];
}

/**
 * A storage component for grouped icon sprite packs.
 * Similar in purpose to the Unity ScriptableObject version, but implemented as a Cocos component.
 */
@ccclass("IconSpriteStorage")
export class IconSpriteStorage extends Component {
    /** Icon packs exposed to the editor/inspector. */
    @property({ type: [IconPackData] })
    public packs: IconPackData[] = [];

    // ----------------
    // Public API
    // ----------------

    /**
     * Return a random IconPackData. If there are no packs, returns null and logs a warning.
     */
    public getRandomPack(): IconPackData | null {
        if (!this.packs || this.packs.length === 0) {
            console.warn("IconSpriteStorage: No icon packs available to return.");
            return null;
        }

        const index = Math.floor(Math.random() * this.packs.length);
        return this.packs[index] || null;
    }

    // // ----------------
    // // Editor Helpers (Editor-only apis)
    // // ----------------

    // /**
    //  * Editor-only helper to load sprite frames found under a folder and group them by first-level child folders.
    //  * NOTE: This relies on Cocos Creator Editor APIs and should be run from the Editor only (not at runtime).
    //  *
    //  * Example (in Editor developer console):
    //  *  const comp = someNode.getComponent('IconSpriteStorage');
    //  *  comp.loadAllSpritesInFolder('db://assets/polyperfect/Low Poly Icon Pack/Images/Icons');
    //  *
    //  * The implementation below uses the Editor.assetdb APIs where available. Depending on your Editor version
    //  * you might need to tweak the query (type filter) string.
    //  *
    //  * @param rootFolderPath - Path under the project (db://assets/... or Assets/...). Defaults to a common example folder.
    //  */
    // public async loadAllSpritesInFolder(rootFolderPath = "db://assets/polyperfect/Low Poly Icon Pack/Images/Icons") {
    //     // Guard: Editor-only API
    //     // `Editor` is injected by Cocos Creator Editor; avoid referencing it in builds.
    //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //     // @ts-ignore
    //     if (typeof Editor === "undefined" || !Editor.assetdb) {
    //         console.warn("IconSpriteStorage: Editor APIs are not available. This method must be run in the Cocos Creator Editor.");
    //         return;
    //     }

    //     // Normalize the folder path to the "db://assets" style the Editor expects.
    //     let dbFolder = rootFolderPath;
    //     if (!dbFolder.startsWith("db://")) {
    //         dbFolder = dbFolder.replace(/^Assets/, "db://assets");
    //     }

    //     try {
    //         // Get first-level child folders under the root.
    //         // Editor.assetdb.queryAssets can be used to find assets of a type under a path.
    //         // We attempt to list subfolders; fall back to querying assets and grouping by folder.
    //         const childFolders: string[] = Editor.assetdb.getSubFolders ? Editor.assetdb.getSubFolders(dbFolder) : [];

    //         // If getSubFolders wasn't available or returned nothing, fall back to deriving folders from sprite asset results.
    //         let foldersToScan: string[] = childFolders && childFolders.length > 0 ? childFolders : [dbFolder];

    //         const newPacks: IconPackData[] = [];

    //         for (const folder of foldersToScan) {
    //             // Query for sprite-frame assets inside this folder. The exact type filter may vary across Editor versions.
    //             // Try a couple of common filters; the Editor will return an array of UUIDs.
    //             const candidates = Editor.assetdb.queryAssets("t:SpriteFrame", folder) || Editor.assetdb.queryAssets("type:sp.SpriteFrame", folder) || [];

    //             const sprites: SpriteFrame[] = [];

    //             for (const uuid of candidates) {
    //                 // Load asset via Editor.assetdb.load or Editor.assetdb.loadToInstance depending on API availability.
    //                 let asset: any = null;

    //                 if (Editor.assetdb.load) {
    //                     // Editor.assetdb.load accepts uuid and returns the loaded asset.
    //                     asset = Editor.assetdb.load(uuid);
    //                 } else if (Editor.assetdb.loadToInstance) {
    //                     // @ts-ignore
    //                     asset = await new Promise((resolve) => Editor.assetdb.loadToInstance(uuid, (err: any, instance: any) => resolve(instance)));
    //                 } else {
    //                     // As a last resort, try assetManager to load by url if the editor provides a url helper.
    //                     const url = Editor.assetdb.uuidToUrl ? Editor.assetdb.uuidToUrl(uuid) : null;
    //                     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //                     // @ts-ignore
    //                     if (url && typeof assetManager !== "undefined" && assetManager.loadRemote) {
    //                         // @ts-ignore
    //                         asset = await new Promise((resolve) => assetManager.loadRemote(url, (err: any, a: any) => resolve(a)));
    //                     }
    //                 }

    //                 if (asset && ((asset.constructor && asset.constructor.name === "SpriteFrame") || asset instanceof SpriteFrame)) {
    //                     sprites.push(asset as SpriteFrame);
    //                 }
    //             }

    //             if (sprites.length > 0) {
    //                 const pack = new IconPackData();
    //                 // Use folder name as pack name
    //                 const name = folder.split("/").pop() || folder;
    //                 pack.packName = name;
    //                 pack.sprites = sprites;
    //                 newPacks.push(pack);
    //             }
    //         }

    //         // Overwrite current packs and ask the Editor to mark this asset dirty and save.
    //         this.packs = newPacks;

    //         if (Editor.Ipc && Editor.Ipc.sendToPanel) {
    //             // Try to save assets/refresh the DB - APIs differ across Editor versions.
    //             try {
    //                 // Mark the scene or asset dirty so that changes persist; may require an explicit save depending on workflow.
    //                 // Best-effort: try to save the component's asset if it's part of an asset file.
    //                 if (Editor.assetdb.save) Editor.assetdb.save();
    //             } catch (e) {
    //                 // ignore save errors; we still updated the in-memory state.
    //             }
    //         }

    //         console.log(`IconSpriteStorage: Loaded ${newPacks.length} icon packs from '${dbFolder}'.`);
    //     } catch (e) {
    //         console.error("IconSpriteStorage: Failed to load sprites from folder.", e);
    //     }
    // }
}
