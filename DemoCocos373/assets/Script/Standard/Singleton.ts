import { Component, director } from 'cc';

/**
 * Generic Component singleton base.
 *
 * - Extend Singleton<T> where T is the concrete subclass.
 * - Duplicate nodes are destroyed automatically in onLoad().
 * - Access via ConcreteClass.getInstance().
 *
 * Notes:
 * - The instance is stored on the constructor so each subclass has its own singleton.
 * - Call makePersistent() in onLoad/onEnable if you want the node to persist across scenes.
 */
export abstract class Singleton<T extends Component> extends Component {
    // Per-subclass instance is stored on the constructor at runtime.
    // We use `any` because TypeScript cannot express per-subclass static generics well.
    private static instance: any = null;

    /**
     * Return the singleton instance for this subclass, or null if none exists.
     */
    public static getInstance<T>(): T | null {
        return (this as any).instance as T | null;
    }

    /**
     * Check if an instance exists for this subclass.
     * @returns True if an instance exists, false otherwise.
     */
    public static hasInstance(): boolean {
        return (this as any).instance != null;
    }

    /**
     * Finalized onLoad: claim singleton and destroy duplicates.
     * Subclasses should not override this method. Use `doOnEnable()` for enable-time logic.
     */
    protected onLoad(): void {
        // If a different instance exists already, destroy this duplicate node.
        if ((this.constructor as any).instance && (this.constructor as any).instance !== this) {
            console.warn(`Duplicate singleton ${this.constructor.name} destroyed.`);
            this.node.destroy();
            return;
        }
        // Claim singleton instance for this subclass.
        (this.constructor as any).instance = this;
    }

    /**
     * Finalized onDestroy: clears the singleton reference for this subclass.
     * Subclasses should not override this method.
     */
    protected onDestroy(): void {
        // Clear instance reference when this node is destroyed.
        if ((this.constructor as any).instance === this) {
            (this.constructor as any).instance = null;
        }
    }

    /**
     * Make this node persistent across scene loads.
     */
    protected makePersistent(): void {
        director.addPersistRootNode(this.node);
    }

    /**
     * Final onEnable implementation: performs singleton-check and then calls hook.
     *
     * Subclasses MUST NOT override onEnable directly. Instead override `doOnEnable`
     * to run subclass-specific enable logic. This ensures singleton checks always run.
     */
    protected onEnable(): void {
        // Only run enable logic for the claimed singleton instance.
        if ((this.constructor as any).instance !== this) return;

        this.doOnEnable();
    }

    /**
     * Final onDisable implementation: performs singleton-check and then calls hook.
     *
     * Subclasses MUST NOT override onDisable directly. Instead override `doOnDisable`
     * to run subclass-specific disable logic.
     */
    protected onDisable(): void {
        // Only run disable logic for the claimed singleton instance.
        if ((this.constructor as any).instance !== this) return;

        this.doOnDisable();
    }

    /**
     * Subclass hook called when the singleton instance is enabled.
     * Default implementation does nothing; override to add behavior.
     */
    protected doOnEnable(): void {
        // Intentionally empty: override in subclasses for enable-time logic.
    }

    /**
     * Subclass hook called when the singleton instance is disabled.
     * Default implementation does nothing; override to add behavior.
     */
    protected doOnDisable(): void {
        // Intentionally empty: override in subclasses for disable-time logic.
    }
}