export class DragGhost
{
    private containerEl: HTMLElement;

    /**
     * Creates `containerEl` — `<div class="drag-ghost">` with `position: fixed`,
     * `pointer-events: none`, `opacity: 0.7`, `z-index: 1000`, and `display: none`.
     */
    constructor()
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'drag-ghost';
        this.containerEl.style.position = 'fixed';
        this.containerEl.style.pointerEvents = 'none';
        this.containerEl.style.opacity = '0.7';
        this.containerEl.style.zIndex = '1000';
        this.containerEl.style.display = 'none';
    }

    /**
     * Sets `containerEl`'s text content to `name`, background color to `color`,
     * and `display` to `'block'` (makes it visible).
     */
    show(name: string, color: string): void
    {
        this.containerEl.textContent = name;
        this.containerEl.style.backgroundColor = color;
        this.containerEl.style.display = 'block';
    }

    /** Sets `display: 'none'`. */
    hide(): void
    {
        this.containerEl.style.display = 'none';
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}
