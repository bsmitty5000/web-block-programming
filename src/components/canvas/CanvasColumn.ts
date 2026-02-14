export class CanvasColumn {
    private containerEl: HTMLElement;
    private headerEl: HTMLElement;
    private index: number;

    /**
     * 1. Stores `index`.
     * 2. Creates `containerEl` — `<div class="canvas-column">` with `position: relative`.
     * 3. Creates `headerEl` — `<div class="canvas-column__header">` displaying column number.
     */
    constructor(index: number)
    {
        this.index = index;

        this.containerEl = document.createElement('div');
        this.containerEl.className = 'canvas-column';
        this.containerEl.style.position = 'relative';

        this.headerEl = document.createElement('div');
        this.headerEl.className = 'canvas-column__header';
        this.headerEl.textContent = `Column ${index + 1}`;

        this.containerEl.appendChild(this.headerEl);
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }

    getIndex(): number
    {
        return this.index;
    }
}
