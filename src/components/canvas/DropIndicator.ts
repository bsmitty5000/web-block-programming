export class DropIndicator
{
    private containerEl: HTMLElement;

    /**
     * Creates `containerEl` — `<div class="drop-indicator">` with `position: absolute`,
     * `height: 3px`, a bright accent color background, `display: none`,
     * and full column width.
     */
    constructor()
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'drop-indicator';
        this.containerEl.style.position = 'absolute';
        this.containerEl.style.height = '3px';
        this.containerEl.style.backgroundColor = '#2196F3';
        this.containerEl.style.width = '100%';
        this.containerEl.style.display = 'none';
    }

    /**
     * Appends (or moves) `containerEl` into `columnEl`, sets `top = y + 'px'`,
     * and sets `display: 'block'`.
     */
    show(y: number, columnEl: HTMLElement): void
    {
        columnEl.appendChild(this.containerEl);
        this.containerEl.style.top = `${y}px`;
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
