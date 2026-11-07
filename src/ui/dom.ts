/** Tiny DOM helpers to keep the UI code terse and readable. */

export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string,
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

/** Remove an element after its next animation ends (or a fallback timeout). */
export function removeAfterAnimation(node: HTMLElement, fallbackMs: number): void {
    let done = false;
    const finish = () => {
        if (done) {
            return;
        }
        done = true;
        node.remove();
    };
    node.addEventListener('animationend', finish, { once: true });
    window.setTimeout(finish, fallbackMs);
}
