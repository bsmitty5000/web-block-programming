
export class App {
  private rootEl: HTMLElement;
  private paletteContainerEl: HTMLElement;
  private canvasContainerEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.rootEl = container;
    this.rootEl.classList.add('app')

    this.paletteContainerEl = document.createElement('div');
    this.paletteContainerEl.classList.add('app__palette');

    this.canvasContainerEl = document.createElement('div');
    this.canvasContainerEl.classList.add('app__canvas');

    this.rootEl.appendChild(this.paletteContainerEl);
    this.rootEl.appendChild(this.canvasContainerEl);
   }

  getRootElement(): HTMLElement {
    return this.rootEl;
   }

  getPaletteContainer(): HTMLElement {
    return this.paletteContainerEl;
   }
   
  getCanvasContainer(): HTMLElement {
    return this.canvasContainerEl;
   }
}