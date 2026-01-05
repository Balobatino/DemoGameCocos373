import { Node } from "cc";

/**
 * setAsLastSibling
 *
 * Move the node to be the last child of its parent so it renders above siblings.
 * Safe no-op if node or parent is missing.
 */
export function setAsLastSibling(node: Node | null | undefined): void {
    if (!node || !node.parent) return;

    const parent = node.parent;
    const lastIndex = parent.children.length - 1;

    // If already last, nothing to do.
    if (node.getSiblingIndex() === lastIndex) return;

    // Use the engine-provided API to set sibling index.
    node.setSiblingIndex(lastIndex);
}
