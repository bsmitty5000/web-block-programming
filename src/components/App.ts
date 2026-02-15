import { BlockPalette } from "./palette/BlockPalette";
import { BlockRegistry } from "../services/BlockRegistry";
import { WorkspaceConfig } from "../types/workspace";
import { LayoutEngine } from "../services/LayoutEngine";
import { WorkspaceManager } from "../services/WorkspaceManager";
import { EventBus } from "../services/EventBus";
import { DragManager } from "../services/DragManager";
import { CanvasPanel } from "./canvas/CanvasPanel";
import { DragGhost } from "./canvas/DragGhost";
import { DropIndicator } from "./canvas/DropIndicator";
import { HostBridge } from "../services/host/HostBridge";

const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = 
{
  columnCount: 3,
  columnWidthPx: 280,
  blockGapPx: 8,
  canvasPaddingPx: 20,
};

export class App 
{
  private rootEl: HTMLElement;
  private paletteContainerEl: HTMLElement;
  private canvasContainerEl: HTMLElement;
  private dragManager: DragManager;
  private hostBridge: HostBridge | null;

  constructor(container: HTMLElement, registry: BlockRegistry, events: EventBus, hostBridge: HostBridge | null)
  {
    this.hostBridge = hostBridge;

    this.rootEl = container;
    this.rootEl.classList.add('app');

    this.paletteContainerEl = document.createElement('div');
    this.paletteContainerEl.classList.add('app__palette');

    this.canvasContainerEl = document.createElement('div');
    this.canvasContainerEl.classList.add('app__canvas');

    this.rootEl.appendChild(this.paletteContainerEl);
    this.rootEl.appendChild(this.canvasContainerEl);
    const layoutEngine = new LayoutEngine(registry);
    const workspaceManager = new WorkspaceManager(
      DEFAULT_WORKSPACE_CONFIG, registry, layoutEngine, events
    );

    // Drag manager
    this.dragManager = new DragManager(layoutEngine, workspaceManager, registry);

    // Wire canvas block drag to DragManager
    workspaceManager.registerBlockDragHandler((instanceId, mouseX, mouseY) => {
      this.dragManager.startCanvasDrag(instanceId, mouseX, mouseY);
    });

    if(this.hostBridge)
    {
      this.hostBridge.onLoadState((workspace) =>
      {
        workspaceManager.loadWorkspace(workspace);
      });
      this.hostBridge.requestLoad();

      events.on('workspace:changed', () =>
      {
        this.hostBridge?.sendState(workspaceManager.getWorkspace());
      });
    }

    // Ghost and drop indicator
    const ghost = new DragGhost();
    const indicator = new DropIndicator();
    document.body.appendChild(ghost.getElement());
    this.dragManager.registerGhostElement(ghost.getElement());
    this.dragManager.registerDropIndicatorElement(indicator.getElement());

    // Canvas
    new CanvasPanel(this.canvasContainerEl, workspaceManager);
    this.dragManager.registerCanvasElement(this.canvasContainerEl);

    // Palette with drag wiring
    new BlockPalette(this.paletteContainerEl, registry, events, (definitionId, mouseX, mouseY) => {
      this.dragManager.startPaletteDrag(definitionId, mouseX, mouseY);
    });

    // Document-level mouse events for drag
    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.dragManager.isDragging()) {
        this.dragManager.updateDrag(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.dragManager.isDragging()) {
        this.dragManager.endDrag();
      }
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.dragManager.isDragging()) {
        this.dragManager.cancelDrag();
      }
    });
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
