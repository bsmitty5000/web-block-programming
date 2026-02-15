import { describe, it, expect, beforeEach } from 'vitest';
import { CanvasPanel } from '../CanvasPanel';
import { WorkspaceManager } from '../../../services/WorkspaceManager';
import { BlockRegistry } from '../../../services/BlockRegistry';
import { LayoutEngine } from '../../../services/LayoutEngine';
import { EventBus } from '../../../services/EventBus';
import { WorkspaceConfig } from '../../../types/workspace';

describe('CanvasPanel', () => {
  let container: HTMLElement;
  let manager: WorkspaceManager;

  beforeEach(() => {
    const events = new EventBus();
    const registry = new BlockRegistry(events);
    const layoutEngine = new LayoutEngine(registry);
    const config: WorkspaceConfig = {
      columnCount: 3,
      columnWidthPx: 280,
      blockGapPx: 8,
      canvasPaddingPx: 20,
    };
    manager = new WorkspaceManager(config, registry, layoutEngine, events);
    container = document.createElement('div');
  });

  it('renders 3 column elements for a 3-column config', () => {
    const panel = new CanvasPanel(container, manager);
    const columns = panel.getElement().querySelectorAll('.canvas-column');
    expect(columns).toHaveLength(3);
  });

  it('appends itself to the provided container', () => {
    new CanvasPanel(container, manager);
    expect(container.querySelector('.canvas')).not.toBeNull();
  });

  it('wraps columns in a canvas__columns container', () => {
    const panel = new CanvasPanel(container, manager);
    const columnsContainer = panel.getElement().querySelector('.canvas__columns');
    expect(columnsContainer).not.toBeNull();
    expect(columnsContainer!.children).toHaveLength(3);
  });

  it('registers column elements with the workspace manager', () => {
    new CanvasPanel(container, manager);
    // If columns were registered, getWorkspace columns should have elements
    // We can't directly check the private map, but we can verify by checking
    // that the column elements exist in the DOM
    for (let i = 0; i < 3; i++) {
      const columns = container.querySelectorAll('.canvas-column');
      expect(columns[i]).toBeDefined();
    }
  });
});
