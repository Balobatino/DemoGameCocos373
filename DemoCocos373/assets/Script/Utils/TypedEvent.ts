/**
 * TypedEvent: lightweight, strongly-typed event helper similar to C# Action<T>.
 * Subscribe with add/remove/once and dispatch with invoke().
 */
export class TypedEvent<T> {
    // Registered listeners.
    private listeners = new Set<(arg: T) => void>();

    /**
     * Subscribe to the event. Returns an unsubscribe function for convenience.
     */
    add(listener: (arg: T) => void): () => void {
        if (!listener) return () => {};
        this.listeners.add(listener);
        return () => this.remove(listener);
    }

    /**
     * Subscribe once; listener is removed after first invoke.
     */
    once(listener: (arg: T) => void): void {
        if (!listener) return;
        const wrapper = (arg: T) => {
            this.remove(wrapper);
            listener(arg);
        };
        this.listeners.add(wrapper);
    }

    /**
     * Unsubscribe a listener.
     */
    remove(listener: (arg: T) => void): void {
        this.listeners.delete(listener);
    }

    /**
     * Invoke all listeners with the provided argument.
     */
    invoke(arg: T): void {
        if (this.listeners.size === 0) return;
        for (const l of Array.from(this.listeners)) {
            try {
                l(arg);
            } catch (e) {
                console.error("TypedEvent listener error:", e);
            }
        }
    }

    /**
     * Remove all listeners.
     */
    clear(): void {
        this.listeners.clear();
    }
}
