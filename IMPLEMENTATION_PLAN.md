# Block Programming Web App — Incremental Implementation Plan

This document describes a phased, incremental implementation of the block programming web app described in `ARCHITECTURE.md`. Each phase produces a working artifact that can be loaded in a browser. Phases are ordered to maximize early visual feedback and minimize throwaway code — every line written in phase N is kept in phase N+1.

Each phase includes:
- **Goal** — what the user sees when they open the browser after this phase
- **Files created/modified** — what gets added to the repo
- **Class & interface definitions** — exact TypeScript signatures
- **Tests** — automated tests to add to the regression suite

---

## Phase 0: Project Scaffolding

**Goal:** A blank page loads in the browser with no errors. The TypeScript build pipeline compiles and serves a single HTML file. This is the "hello world" checkpoint — if this works, tooling is healthy.

### What happens
Set up the project skeleton: `package.json`, TypeScript config, a bundler (esbuild — fast, zero-config, VS Code webview friendly), a dev server, and the single HTML entry point. Wire a minimal `index.ts` that writes "Block Programming App" into the document body to prove the pipeline works end to end.

### Files created

```
package.json
tsconfig.json
esbuild.config.mjs          # build script (dev + prod)
src/
  index.ts                   # writes text into document.body
  index.html                 # single HTML entry point, loads bundle
src/styles/
  index.css                  # empty for now, linked from HTML
```

### Key configurations

**tsconfig.json**
```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

**package.json scripts**
```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs --dev",
    "build": "node esbuild.config.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/__tests__/smoke.test.ts` | Verifies the build pipeline is functional. Imports `index.ts` and asserts no exceptions are thrown. |

**Test tooling:** Vitest + `jsdom` environment. Vitest is chosen because it's fast, supports TypeScript natively, uses the same ESM pipeline as esbuild, and provides a `jsdom` environment for DOM tests without a real browser.

```
vitest.config.ts
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
```

---

## Phase 1: Type Definitions & Two-Panel Layout

**Goal:** The browser shows a two-panel layout — a narrow left panel labeled "Palette" and a wider right panel labeled "Canvas". Both panels are styled with distinct background colors. No interactive behavior yet — just the shell.

### What happens
Define all core data model interfaces and types from the architecture. Then build the `App` shell component that creates the two-panel DOM structure. This establishes the visual skeleton and the foundational types that every subsequent phase builds on.

### Files created

```
src/types/
  blocks.ts
  workspace.ts
  drag.ts
  commands.ts
  messages.ts
src/components/
  App.ts
src/styles/
  index.css                  # (modified — add panel layout styles)
src/index.ts                 # (modified — instantiate App)
```

### Class & interface definitions

**`src/types/blocks.ts`**
```typescript
export enum ParameterType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  COLOR = 'COLOR',
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  required: boolean;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: ParameterType;
  defaultValue: unknown;
  options?: SelectOption[];
  validation?: ValidationRule;
}

export interface BlockDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  inputType?: string;
  outputType?: string;
  parameters: ParameterDefinition[];
}

export interface BlockDefinitionConfig {
  blocks: BlockDefinition[];
}
```

**`src/types/workspace.ts`**
```typescript
export interface BlockInstance {
  id: string;
  definitionId: string;
  columnIndex: number;
  orderIndex: number;
  parameterValues: Record<string, unknown>;
}

export interface Column {
  index: number;
  blocks: BlockInstance[];
}

export interface WorkspaceConfig {
  columnCount: number;
  columnWidthPx: number;
  blockGapPx: number;
  canvasPaddingPx: number;
}

export interface Workspace {
  columns: Column[];
  config: WorkspaceConfig;
}
```

**`src/types/drag.ts`**
```typescript
export interface Position {
  x: number;
  y: number;
}

export interface DropTarget {
  columnIndex: number;
  orderIndex: number;
  indicatorY: number;
}

export interface DragState {
  source: 'palette' | 'canvas';
  definitionId: string;
  instanceId: string | null;
  originColumn: number | null;
  originOrder: number | null;
  mouseX: number;
  mouseY: number;
  currentDropTarget: DropTarget | null;
}
```

**`src/types/commands.ts`**
```typescript
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}
```

**`src/types/messages.ts`**
```typescript
export type WebviewMessage =
  | { type: 'save'; payload: string }
  | { type: 'ready' }
  | { type: 'dirty'; payload: boolean };

export type HostMessage =
  | { type: 'load'; payload: string }
  | { type: 'config'; payload: object };
```

**`src/components/App.ts`**
```typescript
export class App {
  private rootEl: HTMLElement;
  private paletteContainerEl: HTMLElement;
  private canvasContainerEl: HTMLElement;

  constructor(container: HTMLElement) { ... }

  /** Creates the two-panel DOM structure and appends it to the container. */
  private render(): void { ... }

  getRootElement(): HTMLElement { ... }
  getPaletteContainer(): HTMLElement { ... }
  getCanvasContainer(): HTMLElement { ... }
}
```

The `App` constructor creates:
```
<div class="app">
  <div class="app__palette">Palette</div>
  <div class="app__canvas">Canvas</div>
</div>
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/types/__tests__/blocks.test.ts` | Verifies `ParameterType` enum values exist. Verifies objects conforming to `BlockDefinition` and `ParameterDefinition` interfaces can be created with all required fields. |
| `src/types/__tests__/workspace.test.ts` | Verifies objects conforming to `Workspace`, `Column`, `BlockInstance`, and `WorkspaceConfig` can be created. Verifies default workspace construction helper (if added). |
| `src/components/__tests__/App.test.ts` | Mounts `App` into a jsdom container. Asserts the root element contains a palette container and a canvas container. Asserts both containers are in the DOM. |

---

## Phase 2: Block Registry & Sample Config

**Goal:** No visible change in the browser yet (the palette is still a static label), but the data backbone is in place. Block definitions can be loaded from a JSON config and queried by ID or category. This unblocks phases 3 and 4.

### What happens
Implement `BlockRegistry` — the read-only store for block definition templates. Create a sample `blocks.json` config file with 6–8 blocks across 2–3 categories to exercise the system. The registry loads from this config at startup.

### Files created

```
src/services/
  BlockRegistry.ts
src/config/
  blocks.json
```

### Class definitions

**`src/services/BlockRegistry.ts`**
```typescript
import { BlockDefinition, BlockDefinitionConfig } from '../types/blocks';

export class BlockRegistry {
  private definitions: Map<string, BlockDefinition>;

  constructor() { ... }

  /** Register a single block definition. Throws if ID already exists. */
  register(definition: BlockDefinition): void { ... }

  /** Get a definition by ID. Throws if not found. */
  get(id: string): BlockDefinition { ... }

  /** Get all definitions in a given category. */
  getByCategory(category: string): BlockDefinition[] { ... }

  /** Get all unique category names, sorted alphabetically. */
  getCategories(): string[] { ... }

  /** Get all registered definitions. */
  getAll(): BlockDefinition[] { ... }

  /** Bulk-load definitions from a config object. */
  loadFromConfig(config: BlockDefinitionConfig): void { ... }
}
```

**`src/config/blocks.json`** — sample config with blocks like:
- **Category "Input":** `read-file` (TEXT param: file path), `http-request` (TEXT param: URL, SELECT param: method)
- **Category "Transform":** `filter` (TEXT + SELECT + TEXT params), `sort` (TEXT + SELECT params), `map` (TEXT param: expression)
- **Category "Output":** `write-file` (TEXT param: path), `log` (no params), `send-email` (TEXT params: to, subject, body)

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/BlockRegistry.test.ts` | **register & get:** Register a definition, retrieve it by ID, get back the same object. **duplicate ID:** Register same ID twice, expect throw. **not found:** Get non-existent ID, expect throw. **getByCategory:** Register 3 blocks in 2 categories, verify correct grouping. **getCategories:** Verify sorted unique category list. **loadFromConfig:** Load the full `blocks.json`, verify all blocks are registered and queryable. **getAll:** Verify total count matches config. |

---

## Phase 3: Static Palette Panel

**Goal:** The left panel displays block definitions grouped by category. Each category has a collapsible header, and each block is a colored card showing the block name. No drag behavior yet — just a visual catalog.

### What happens
Build the palette UI components. At startup, `App` creates a `BlockPalette`, which queries `BlockRegistry` for all categories and definitions, then renders category groups with block cards. The palette is scrollable if content overflows.

### Files created

```
src/components/palette/
  BlockPalette.ts
  CategoryGroup.ts
  PaletteBlock.ts
src/styles/
  index.css                  # (modified — add palette styles)
src/index.ts                 # (modified — wire registry + palette into App)
src/components/App.ts        # (modified — accept registry, create palette)
```

### Class definitions

**`src/components/palette/BlockPalette.ts`**
```typescript
import { BlockRegistry } from '../../services/BlockRegistry';

export class BlockPalette {
  private containerEl: HTMLElement;
  private registry: BlockRegistry;
  private categoryGroups: CategoryGroup[];

  constructor(container: HTMLElement, registry: BlockRegistry) { ... }

  /** Queries the registry and builds the full palette DOM. */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/palette/CategoryGroup.ts`**
```typescript
import { BlockDefinition } from '../../types/blocks';

export class CategoryGroup {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private blockListEl: HTMLElement;
  private collapsed: boolean;
  private blocks: PaletteBlock[];

  constructor(categoryName: string, definitions: BlockDefinition[]) { ... }

  /** Toggle collapsed state — hides/shows the block list. */
  toggle(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/palette/PaletteBlock.ts`**
```typescript
import { BlockDefinition } from '../../types/blocks';

export class PaletteBlock {
  private containerEl: HTMLElement;
  private definition: BlockDefinition;

  constructor(definition: BlockDefinition) { ... }

  /** Returns the block definition ID (used later for drag initiation). */
  getDefinitionId(): string { ... }

  getElement(): HTMLElement { ... }
}
```

Each `PaletteBlock` creates a `<div>` styled with the block's `color`, displaying the block `name` and a short `description`.

### Tests added

| Test file | What it covers |
|---|---|
| `src/components/palette/__tests__/BlockPalette.test.ts` | Creates a registry with blocks in 2 categories. Mounts `BlockPalette`. Asserts correct number of category groups rendered. Asserts each group contains the right number of block cards. |
| `src/components/palette/__tests__/CategoryGroup.test.ts` | Creates a `CategoryGroup` with 3 definitions. Asserts header text matches category name. Asserts 3 child block elements rendered. Simulates click on header, asserts block list is hidden (collapsed). Click again, asserts it's visible. |
| `src/components/palette/__tests__/PaletteBlock.test.ts` | Creates a `PaletteBlock` from a definition. Asserts the rendered element contains the block name. Asserts the element's background color matches the definition's color. |

---

## Phase 4: Canvas with Columns & Static Blocks

**Goal:** The right panel shows a column-based canvas. Columns are rendered as vertical lanes. A few hardcoded `BlockInstance` objects are displayed as colored cards stacked inside the columns. Blocks show their name in a header bar. No drag, no parameters — just the grid with blocks in it.

### What happens
Build the canvas UI and the core state management. Implement `LayoutEngine` for position math and `WorkspaceManager` for state + DOM synchronization. The workspace is initialized with a default config (3 columns) and a few pre-placed blocks (added programmatically) so there's something to see.

### Files created

```
src/services/
  LayoutEngine.ts
  WorkspaceManager.ts
  EventBus.ts
src/components/canvas/
  CanvasPanel.ts
  CanvasColumn.ts
  CanvasBlock.ts
  BlockHeader.ts
src/styles/
  index.css                  # (modified — add canvas/column/block styles)
src/components/App.ts        # (modified — create canvas, workspace manager)
src/index.ts                 # (modified — wire everything together)
```

### Class definitions

**`src/services/EventBus.ts`**
```typescript
type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>>;

  constructor() { ... }

  on(event: string, callback: EventCallback): void { ... }
  off(event: string, callback: EventCallback): void { ... }
  emit(event: string, ...args: unknown[]): void { ... }
}
```

**`src/services/LayoutEngine.ts`**
```typescript
import { BlockInstance, Column, Workspace, WorkspaceConfig } from '../types/workspace';
import { Position, DropTarget } from '../types/drag';
import { BlockRegistry } from './BlockRegistry';

export class LayoutEngine {
  private registry: BlockRegistry;

  // Layout constants (derived from block structure)
  static readonly HEADER_HEIGHT_PX = 36;
  static readonly PARAM_ROW_HEIGHT_PX = 32;
  static readonly BLOCK_PADDING_PX = 8;
  static readonly COLUMN_GAP_PX = 16;

  constructor(registry: BlockRegistry) { ... }

  /** Compute the pixel position of a block given the workspace state. */
  calculateBlockPosition(block: BlockInstance, workspace: Workspace): Position { ... }

  /** Compute the x pixel position for a column. */
  calculateColumnX(columnIndex: number, config: WorkspaceConfig): number { ... }

  /** Compute the y pixel position for a block at a given order index within a column. */
  calculateBlockY(orderIndex: number, column: Column): number { ... }

  /** Compute the pixel height of a block based on its parameter count. */
  getBlockHeight(block: BlockInstance): number { ... }

  /** Given a mouse position, determine the target column and insertion index. */
  getDropTarget(mouseX: number, mouseY: number, workspace: Workspace): DropTarget | null { ... }
}
```

**`src/services/WorkspaceManager.ts`**
```typescript
import { BlockInstance, Column, Workspace, WorkspaceConfig } from '../types/workspace';
import { BlockRegistry } from './BlockRegistry';
import { LayoutEngine } from './LayoutEngine';
import { EventBus } from './EventBus';

export class WorkspaceManager {
  private workspace: Workspace;
  private blockElements: Map<string, HTMLElement>;
  private columnElements: Map<number, HTMLElement>;
  private registry: BlockRegistry;
  private layoutEngine: LayoutEngine;
  private events: EventBus;
  private nextInstanceId: number;

  constructor(
    config: WorkspaceConfig,
    registry: BlockRegistry,
    layoutEngine: LayoutEngine,
    events: EventBus
  ) { ... }

  /** Create a new block instance and its DOM element, insert into the specified column. */
  addBlock(definitionId: string, columnIndex: number, orderIndex: number): BlockInstance { ... }

  /** Remove a block instance and its DOM element from the workspace. */
  removeBlock(instanceId: string): void { ... }

  /** Move a block to a new column and/or order position. */
  moveBlock(instanceId: string, toColumn: number, toOrder: number): void { ... }

  /** Deep-copy a block and insert the copy directly below the original. */
  copyBlock(instanceId: string): BlockInstance { ... }

  /** Update a parameter value on a block instance. */
  updateParameter(instanceId: string, paramId: string, value: unknown): void { ... }

  /** Get a column by index. */
  getColumn(index: number): Column { ... }

  /** Get a block instance by ID. */
  getBlock(instanceId: string): BlockInstance { ... }

  /** Get the full workspace state. */
  getWorkspace(): Workspace { ... }

  /** Register a column's DOM element (called during canvas setup). */
  registerColumnElement(index: number, el: HTMLElement): void { ... }

  /** Register a block's DOM element (called when block is created). */
  registerBlockElement(instanceId: string, el: HTMLElement): void { ... }

  /** Get the DOM element for a block instance. */
  getBlockElement(instanceId: string): HTMLElement | undefined { ... }

  /** Subscribe to workspace state changes. */
  onStateChange(callback: () => void): void { ... }

  /** Generate a unique instance ID. */
  private generateId(): string { ... }

  /** Recalculate and apply positions for all blocks in a column. */
  private reflowColumn(columnIndex: number): void { ... }
}
```

**`src/components/canvas/CanvasPanel.ts`**
```typescript
import { WorkspaceManager } from '../../services/WorkspaceManager';

export class CanvasPanel {
  private containerEl: HTMLElement;
  private columnsContainerEl: HTMLElement;
  private columns: CanvasColumn[];
  private workspaceManager: WorkspaceManager;

  constructor(container: HTMLElement, workspaceManager: WorkspaceManager) { ... }

  /** Creates the column container and individual column elements. */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/CanvasColumn.ts`**
```typescript
export class CanvasColumn {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private index: number;

  constructor(index: number) { ... }

  getElement(): HTMLElement { ... }
  getIndex(): number { ... }
}
```

**`src/components/canvas/CanvasBlock.ts`**
```typescript
import { BlockInstance } from '../../types/workspace';
import { BlockDefinition } from '../../types/blocks';

export class CanvasBlock {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private instance: BlockInstance;
  private definition: BlockDefinition;

  constructor(instance: BlockInstance, definition: BlockDefinition) { ... }

  /** Build the block DOM: colored header with name, action buttons placeholder. */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
  getInstanceId(): string { ... }
}
```

**`src/components/canvas/BlockHeader.ts`**
```typescript
import { BlockDefinition } from '../../types/blocks';

export class BlockHeader {
  private containerEl: HTMLElement;

  constructor(
    definition: BlockDefinition,
    onDelete?: () => void,
    onCopy?: () => void
  ) { ... }

  getElement(): HTMLElement { ... }
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/EventBus.test.ts` | **on/emit:** Register callback, emit event, callback is called with correct args. **off:** Unregister callback, emit, callback is NOT called. **multiple listeners:** Two callbacks on same event, both called. **no listeners:** Emit with no listeners, no error. |
| `src/services/__tests__/LayoutEngine.test.ts` | **calculateColumnX:** Given config with padding=20, width=280, verify column 0 x=20, column 1 x=316, column 2 x=612. **calculateBlockY:** Given a column with 2 blocks (known heights), verify y positions. **getBlockHeight:** Block with 0 params, 1 param, 3 params — verify correct heights. **getDropTarget:** Mock workspace with blocks, verify correct column and order index for various mouse positions. Verify null return for mouse outside canvas. |
| `src/services/__tests__/WorkspaceManager.test.ts` | **addBlock:** Add a block to column 0, verify it appears in `getColumn(0).blocks`. Verify `getBlock(id)` returns it. **addBlock ordering:** Add 3 blocks, verify orderIndex values. **removeBlock:** Add then remove, verify column is empty. **moveBlock:** Add to column 0, move to column 1, verify it's in column 1 and gone from column 0. **copyBlock:** Copy a block, verify new instance has different ID but same definitionId and parameterValues. **updateParameter:** Update a param, verify value is stored. **reflowColumn:** Add 3 blocks, remove middle one, verify remaining blocks have correct positions. |
| `src/components/canvas/__tests__/CanvasPanel.test.ts` | Mount a `CanvasPanel` with a 3-column config. Assert 3 column elements are rendered. |
| `src/components/canvas/__tests__/CanvasBlock.test.ts` | Create a `CanvasBlock` from a definition and instance. Assert the element contains the block name. Assert the header has the correct background color. |

---

## Phase 5: Drag from Palette to Canvas

**Goal:** The user can click and drag a block from the palette and drop it onto a column in the canvas. A ghost preview follows the cursor during the drag. A horizontal line indicator shows where the block will land. On drop, a new block appears in the target column. This is the first real interactive behavior.

### What happens
Implement `DragManager` for palette-to-canvas dragging. Add the `DragGhost` and `DropIndicator` components. Wire mouse events: `mousedown` on `PaletteBlock` starts a drag, `mousemove` on `document` updates the ghost and indicator, `mouseup` on the canvas completes the drop.

### Files created

```
src/services/
  DragManager.ts
src/components/canvas/
  DragGhost.ts
  DropIndicator.ts
src/components/palette/
  PaletteBlock.ts            # (modified — add mousedown handler)
src/components/canvas/
  CanvasPanel.ts             # (modified — add mouse event listeners)
src/components/App.ts        # (modified — create DragManager, wire everything)
src/styles/
  index.css                  # (modified — ghost + indicator styles)
```

### Class definitions

**`src/services/DragManager.ts`**
```typescript
import { DragState, DropTarget } from '../types/drag';
import { LayoutEngine } from './LayoutEngine';
import { WorkspaceManager } from './WorkspaceManager';

export class DragManager {
  private currentDrag: DragState | null;
  private layoutEngine: LayoutEngine;
  private workspaceManager: WorkspaceManager;
  private ghostEl: HTMLElement | null;
  private dropIndicatorEl: HTMLElement | null;
  private blockElements: Map<string, HTMLElement>;

  constructor(layoutEngine: LayoutEngine, workspaceManager: WorkspaceManager) { ... }

  /** Begin a drag originating from the palette. */
  startPaletteDrag(definitionId: string, mouseX: number, mouseY: number): void { ... }

  /** Begin a drag originating from an existing canvas block. */
  startCanvasDrag(instanceId: string, mouseX: number, mouseY: number): void { ... }

  /** Called on every mousemove during a drag. Updates ghost position and drop target. */
  updateDrag(mouseX: number, mouseY: number): void { ... }

  /** Called on mouseup. Commits the drag by adding/moving the block. */
  endDrag(): void { ... }

  /** Called on Escape key. Aborts the drag and restores original state. */
  cancelDrag(): void { ... }

  /** Whether a drag is currently active. */
  isDragging(): boolean { ... }

  /** Get the current drag state (for UI queries). */
  getDragState(): DragState | null { ... }

  /** Register the ghost overlay element. */
  registerGhostElement(el: HTMLElement): void { ... }

  /** Register the drop indicator line element. */
  registerDropIndicatorElement(el: HTMLElement): void { ... }

  /** Register a canvas block element for position manipulation during drag. */
  registerBlockElement(instanceId: string, el: HTMLElement): void { ... }

  /** Unregister a block element (called on block deletion). */
  unregisterBlockElement(instanceId: string): void { ... }

  /** Position the ghost element at the cursor. */
  private updateGhostPosition(mouseX: number, mouseY: number): void { ... }

  /** Show/hide and position the drop indicator line. */
  private updateDropIndicator(target: DropTarget | null): void { ... }

  /** Hide all drag-related visual elements. */
  private cleanupDragVisuals(): void { ... }
}
```

**`src/components/canvas/DragGhost.ts`**
```typescript
export class DragGhost {
  private containerEl: HTMLElement;

  constructor() { ... }

  /** Show the ghost with a given block name and color. */
  show(name: string, color: string): void { ... }

  /** Hide the ghost. */
  hide(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/DropIndicator.ts`**
```typescript
export class DropIndicator {
  private containerEl: HTMLElement;

  constructor() { ... }

  /** Show the indicator at a given y position within a column. */
  show(y: number, columnEl: HTMLElement): void { ... }

  /** Hide the indicator. */
  hide(): void { ... }

  getElement(): HTMLElement { ... }
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/DragManager.test.ts` | **startPaletteDrag:** Call it, verify `isDragging()` is true, `getDragState()` has `source='palette'` and correct `definitionId`. **updateDrag:** Start a drag, call `updateDrag` with coordinates, verify `currentDropTarget` is computed. **endDrag (palette→canvas):** Start palette drag, update to valid position, end drag — verify `WorkspaceManager.addBlock` was called with correct column/order. **cancelDrag:** Start drag, cancel, verify `isDragging()` is false and no block was added. **endDrag outside canvas:** Start drag, update to coordinates outside any column, end drag — verify no block added. |
| `src/components/canvas/__tests__/DragGhost.test.ts` | Create `DragGhost`. Call `show()`, verify element is visible and contains block name. Call `hide()`, verify element is hidden. |
| `src/components/canvas/__tests__/DropIndicator.test.ts` | Create `DropIndicator`. Call `show()`, verify element is visible. Call `hide()`, verify hidden. |

### Integration test

| Test file | What it covers |
|---|---|
| `src/__tests__/palette-to-canvas.integration.test.ts` | Full flow: set up App with registry, simulate `mousedown` on a palette block, simulate `mousemove` over column 1, simulate `mouseup`. Assert a new block element is now a child of column 1's DOM element. Assert the workspace model has 1 block in column 1. |

---

## Phase 6: Inline Parameters

**Goal:** Blocks on the canvas now display inline input fields for each of their parameters. A "Filter" block shows text inputs for "Field" and "Value" and a dropdown for "Operator". Changing a value updates the model. Blocks resize vertically based on parameter count.

### What happens
Build the parameter input components. When `CanvasBlock` is created, it inspects the block's `ParameterDefinition` list and creates the appropriate input control for each one, pre-filled with the default value. On input change, `WorkspaceManager.updateParameter()` is called to sync the model. Block height is now dynamic (driven by `LayoutEngine.getBlockHeight()`).

### Files created

```
src/components/canvas/params/
  InlineParam.ts
  TextInput.ts
  NumberInput.ts
  BooleanToggle.ts
  SelectDropdown.ts
  ColorPicker.ts
src/components/canvas/
  CanvasBlock.ts             # (modified — render parameter inputs)
src/services/
  WorkspaceManager.ts        # (modified — addBlock now sets default param values)
```

### Class definitions

**`src/components/canvas/params/InlineParam.ts`**
```typescript
import { ParameterDefinition, ParameterType } from '../../../types/blocks';

/** Factory that creates the correct input component based on parameter type. */
export class InlineParam {
  /** Create an input component for the given parameter definition. */
  static create(
    paramDef: ParameterDefinition,
    initialValue: unknown,
    onChange: (paramId: string, value: unknown) => void
  ): HTMLElement { ... }
}
```

**`src/components/canvas/params/TextInput.ts`**
```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class TextInput {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  constructor(
    paramDef: ParameterDefinition,
    initialValue: string,
    onChange: (paramId: string, value: string) => void
  ) { ... }

  getValue(): string { ... }
  setValue(value: string): void { ... }
  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/params/NumberInput.ts`**
```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class NumberInput {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  constructor(
    paramDef: ParameterDefinition,
    initialValue: number,
    onChange: (paramId: string, value: number) => void
  ) { ... }

  getValue(): number { ... }
  setValue(value: number): void { ... }
  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/params/BooleanToggle.ts`**
```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class BooleanToggle {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  constructor(
    paramDef: ParameterDefinition,
    initialValue: boolean,
    onChange: (paramId: string, value: boolean) => void
  ) { ... }

  getValue(): boolean { ... }
  setValue(value: boolean): void { ... }
  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/params/SelectDropdown.ts`**
```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class SelectDropdown {
  private containerEl: HTMLElement;
  private selectEl: HTMLSelectElement;
  private labelEl: HTMLLabelElement;

  constructor(
    paramDef: ParameterDefinition,
    initialValue: string,
    onChange: (paramId: string, value: string) => void
  ) { ... }

  getValue(): string { ... }
  setValue(value: string): void { ... }
  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/params/ColorPicker.ts`**
```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class ColorPicker {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  constructor(
    paramDef: ParameterDefinition,
    initialValue: string,
    onChange: (paramId: string, value: string) => void
  ) { ... }

  getValue(): string { ... }
  setValue(value: string): void { ... }
  getElement(): HTMLElement { ... }
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/components/canvas/params/__tests__/InlineParam.test.ts` | Call `InlineParam.create()` for each `ParameterType`. Verify correct element types are returned (input[type=text], input[type=number], input[type=checkbox], select, input[type=color]). |
| `src/components/canvas/params/__tests__/TextInput.test.ts` | Create with initial value "hello". Assert input displays "hello". Simulate typing "world" + blur. Assert onChange callback is called with ("paramId", "world"). |
| `src/components/canvas/params/__tests__/NumberInput.test.ts` | Create with initial value 42. Assert input displays "42". Simulate change to 99. Assert callback called with number 99 (not string). Test min/max validation from `ValidationRule`. |
| `src/components/canvas/params/__tests__/BooleanToggle.test.ts` | Create with initial false. Assert checkbox is unchecked. Simulate click. Assert callback called with true. |
| `src/components/canvas/params/__tests__/SelectDropdown.test.ts` | Create with 3 options and initial "b". Assert select has 3 options and value is "b". Simulate change to "c". Assert callback called with "c". |
| `src/components/canvas/params/__tests__/ColorPicker.test.ts` | Create with initial "#ff0000". Assert input value is "#ff0000". Simulate change. Assert callback called with new hex value. |
| `src/components/canvas/__tests__/CanvasBlock.test.ts` | **(Updated)** Create a `CanvasBlock` for a definition with 3 parameters. Assert 3 input elements are rendered inside the block. Assert block height accounts for parameter count. |

---

## Phase 7: Canvas Block Reordering & Cross-Column Movement

**Goal:** Blocks already on the canvas can be picked up and dragged to reorder within their column or moved to a different column. During the drag, neighboring blocks slide apart to show the insertion point. Pressing Escape cancels the drag and snaps everything back.

### What happens
Extend `DragManager` to support canvas-originating drags. On `mousedown` on a block header, the block is hidden and a ghost takes its place. During `mousemove`, neighboring blocks shift via CSS transforms. On `mouseup`, the model is updated and the block element is moved to its new DOM position. On `Escape`, all transforms are reset.

### Files modified

```
src/services/
  DragManager.ts             # (modified — implement startCanvasDrag, shift logic)
src/components/canvas/
  CanvasBlock.ts             # (modified — add mousedown on header for drag)
  CanvasPanel.ts             # (modified — add keydown listener for Escape)
src/styles/
  index.css                  # (modified — add CSS transition on block transforms)
```

### Key implementation details

- **Block shifting during drag:** When the drop target changes, the `DragManager` iterates the target column's block elements and applies `style.transform = translateY(±blockHeight)` to shift them up or down. CSS `transition: transform 150ms ease` handles the animation.
- **Original block hiding:** When a canvas drag starts, the original block's element gets `style.opacity = 0` (not `display: none`, to preserve layout space until the model updates).
- **Escape key handling:** `document.addEventListener('keydown', ...)` checks for Escape, calls `cancelDrag()`, which resets all shifted block transforms and restores the original block's opacity.

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/DragManager.test.ts` | **(Updated — additional tests)** **startCanvasDrag:** Call it with an instance ID, verify drag state has `source='canvas'`, `instanceId` set, `originColumn`/`originOrder` recorded. **reorder within column:** Start canvas drag on block at order 0 in column 0 (3 blocks in column). Update drag to position after block 2. End drag. Verify model has block at order 2. **move between columns:** Start drag on block in column 0. Update to position in column 1. End drag. Verify block is in column 1, removed from column 0. **cancelDrag (canvas):** Start canvas drag, cancel, verify block is still at its original position in the model. |

### Integration test

| Test file | What it covers |
|---|---|
| `src/__tests__/canvas-drag.integration.test.ts` | Set up workspace with 3 blocks in column 0. Simulate mousedown on block 0's header, mousemove to position between blocks 1 and 2, mouseup. Assert model order is [1, 0, 2]. Assert DOM order matches. Repeat for cross-column move. |

---

## Phase 8: Block Operations — Delete & Copy

**Goal:** Each block on the canvas has a delete button (removes the block) and a copy button (duplicates the block directly below). After delete, remaining blocks slide up to close the gap. After copy, blocks below slide down to make room.

### What happens
Wire the `BlockHeader` action buttons to `WorkspaceManager.removeBlock()` and `WorkspaceManager.copyBlock()`. Both methods already exist from Phase 4 — this phase connects them to the UI and ensures the DOM updates (reflow) are smooth.

### Files modified

```
src/components/canvas/
  BlockHeader.ts             # (modified — wire delete/copy button click handlers)
  CanvasBlock.ts             # (modified — pass callbacks to BlockHeader)
src/services/
  WorkspaceManager.ts        # (modified — ensure removeBlock/copyBlock update DOM correctly)
  DragManager.ts             # (modified — unregister deleted block elements)
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/__tests__/block-operations.integration.test.ts` | **Delete:** Set up workspace with 3 blocks in column 0. Click delete on block 1. Assert column has 2 blocks. Assert the deleted block's DOM element is removed. Assert remaining blocks have correct y positions. **Copy:** Set up with 1 block. Click copy. Assert column has 2 blocks with identical `definitionId` and `parameterValues` but different `id`. Assert copy is at orderIndex 1. Assert the copy's DOM element exists in the column. |

---

## Phase 9: Undo / Redo

**Goal:** A toolbar above the canvas has Undo and Redo buttons. Every action (add, remove, move, copy, parameter edit) can be undone and redone. Ctrl+Z and Ctrl+Y keyboard shortcuts work. Buttons are grayed out when their stack is empty.

### What happens
Implement `CommandManager` and individual `Command` classes for each mutation type. Modify `WorkspaceManager` mutation methods to go through `CommandManager` instead of directly mutating. `CanvasToolbar` renders the undo/redo buttons and listens to keyboard shortcuts.

### Files created

```
src/services/
  CommandManager.ts
src/commands/
  AddBlockCommand.ts
  RemoveBlockCommand.ts
  MoveBlockCommand.ts
  CopyBlockCommand.ts
  UpdateParamCommand.ts
src/components/canvas/
  CanvasToolbar.ts
```

### Class definitions

**`src/services/CommandManager.ts`**
```typescript
import { Command } from '../types/commands';
import { EventBus } from './EventBus';

export class CommandManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private events: EventBus;

  constructor(events: EventBus) { ... }

  /** Execute a command and push it onto the undo stack. Clears the redo stack. */
  execute(command: Command): void { ... }

  /** Undo the most recent command. */
  undo(): void { ... }

  /** Redo the most recently undone command. */
  redo(): void { ... }

  canUndo(): boolean { ... }
  canRedo(): boolean { ... }
}
```

**`src/commands/AddBlockCommand.ts`**
```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';

export class AddBlockCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private definitionId: string;
  private columnIndex: number;
  private orderIndex: number;
  private createdInstanceId: string | null;

  constructor(
    workspaceManager: WorkspaceManager,
    definitionId: string,
    columnIndex: number,
    orderIndex: number
  ) { ... }

  execute(): void { ... }
  undo(): void { ... }
}
```

**`src/commands/RemoveBlockCommand.ts`**
```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';
import { BlockInstance } from '../types/workspace';

export class RemoveBlockCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private instanceId: string;
  private removedBlock: BlockInstance | null;
  private removedColumnIndex: number;
  private removedOrderIndex: number;

  constructor(workspaceManager: WorkspaceManager, instanceId: string) { ... }

  execute(): void { ... }
  undo(): void { ... }
}
```

**`src/commands/MoveBlockCommand.ts`**
```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';

export class MoveBlockCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private instanceId: string;
  private fromColumn: number;
  private fromOrder: number;
  private toColumn: number;
  private toOrder: number;

  constructor(
    workspaceManager: WorkspaceManager,
    instanceId: string,
    fromColumn: number,
    fromOrder: number,
    toColumn: number,
    toOrder: number
  ) { ... }

  execute(): void { ... }
  undo(): void { ... }
}
```

**`src/commands/CopyBlockCommand.ts`**
```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';

export class CopyBlockCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private sourceInstanceId: string;
  private createdInstanceId: string | null;

  constructor(workspaceManager: WorkspaceManager, sourceInstanceId: string) { ... }

  execute(): void { ... }
  undo(): void { ... }
}
```

**`src/commands/UpdateParamCommand.ts`**
```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';

export class UpdateParamCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private instanceId: string;
  private paramId: string;
  private oldValue: unknown;
  private newValue: unknown;

  constructor(
    workspaceManager: WorkspaceManager,
    instanceId: string,
    paramId: string,
    oldValue: unknown,
    newValue: unknown
  ) { ... }

  execute(): void { ... }
  undo(): void { ... }
}
```

**`src/components/canvas/CanvasToolbar.ts`**
```typescript
import { CommandManager } from '../../services/CommandManager';
import { EventBus } from '../../services/EventBus';

export class CanvasToolbar {
  private containerEl: HTMLElement;
  private undoBtn: HTMLButtonElement;
  private redoBtn: HTMLButtonElement;
  private commandManager: CommandManager;

  constructor(container: HTMLElement, commandManager: CommandManager, events: EventBus) { ... }

  /** Update button enabled/disabled state based on stack status. */
  private updateButtonStates(): void { ... }

  getElement(): HTMLElement { ... }
}
```

### Architecture note on WorkspaceManager refactor

At this phase, `WorkspaceManager`'s public mutation methods (`addBlock`, `removeBlock`, etc.) are split into two tiers:

1. **Public methods** (called by UI and commands) — create a `Command` and pass it to `CommandManager.execute()`.
2. **Internal methods** (called by the commands' `execute()`/`undo()`) — perform the actual model mutation + DOM update. These are prefixed `_internal` or made accessible via a separate interface to keep the API clean.

This avoids double-wrapping when a command calls back into the manager.

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/CommandManager.test.ts` | **execute:** Execute a mock command, verify `execute()` was called. **undo:** Execute then undo, verify `undo()` was called. **redo:** Execute, undo, redo, verify `execute()` called again. **canUndo/canRedo:** Verify correct boolean states through the execute→undo→redo cycle. **redo cleared on new execute:** Execute A, undo A, execute B, verify redo is empty. |
| `src/commands/__tests__/AddBlockCommand.test.ts` | Execute: block added to workspace. Undo: block removed. Re-execute: block added again with same ID. |
| `src/commands/__tests__/RemoveBlockCommand.test.ts` | Execute: block removed. Undo: block restored at original position with original parameter values. |
| `src/commands/__tests__/MoveBlockCommand.test.ts` | Execute: block at (col0, order1) moved to (col1, order0). Undo: block back at (col0, order1). |
| `src/commands/__tests__/CopyBlockCommand.test.ts` | Execute: copy created below original. Undo: copy removed. |
| `src/commands/__tests__/UpdateParamCommand.test.ts` | Execute: param value changed. Undo: param restored to old value. |

### Integration test

| Test file | What it covers |
|---|---|
| `src/__tests__/undo-redo.integration.test.ts` | Add a block. Undo — block is gone. Redo — block is back. Delete the block. Undo — block is back. Change a parameter. Undo — parameter has old value. Verify DOM matches model after each step. |

---

## Phase 10: Serialization & Persistence

**Goal:** The workspace auto-saves to `localStorage` on every change. Reloading the page restores the last-saved state. A "New Workspace" action in the toolbar clears everything. The serialization format matches the spec in the architecture doc.

### What happens
Implement `SerializationService` for JSON conversion and `WebHostBridge` for localStorage-based persistence. Wire them into `WorkspaceManager` so every state change triggers a save. On startup, the app checks for saved state and loads it.

### Files created

```
src/services/
  SerializationService.ts
  host/
    HostBridge.ts
    WebHostBridge.ts
```

### Class definitions

**`src/services/SerializationService.ts`**
```typescript
import { Workspace } from '../types/workspace';
import { BlockRegistry } from './BlockRegistry';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SerializationService {
  /** Convert a workspace to its JSON string representation. */
  serialize(workspace: Workspace): string { ... }

  /** Parse a JSON string and reconstruct a Workspace. Requires registry to resolve definition IDs. */
  deserialize(json: string, registry: BlockRegistry): Workspace { ... }

  /** Validate a JSON string against the expected schema without fully deserializing. */
  validate(json: string): ValidationResult { ... }
}
```

**`src/services/host/HostBridge.ts`**
```typescript
import { Workspace } from '../../types/workspace';

export interface HostBridge {
  /** Send the current workspace state to the host for persistence. */
  sendState(workspace: Workspace): void;

  /** Register a callback to be called when the host provides saved state to load. */
  onLoadState(callback: (workspace: Workspace) => void): void;

  /** Request the host to persist the current state. */
  requestSave(): void;

  /** Request the host to load saved state. */
  requestLoad(): void;
}
```

**`src/services/host/WebHostBridge.ts`**
```typescript
import { Workspace } from '../../types/workspace';
import { HostBridge } from './HostBridge';
import { SerializationService } from '../SerializationService';
import { BlockRegistry } from '../BlockRegistry';

export class WebHostBridge implements HostBridge {
  private static STORAGE_KEY = 'block-programming-workspace';
  private serializer: SerializationService;
  private registry: BlockRegistry;
  private loadCallback: ((workspace: Workspace) => void) | null;

  constructor(serializer: SerializationService, registry: BlockRegistry) { ... }

  sendState(workspace: Workspace): void { ... }
  onLoadState(callback: (workspace: Workspace) => void): void { ... }
  requestSave(): void { ... }
  requestLoad(): void { ... }
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/__tests__/SerializationService.test.ts` | **Round-trip:** Create a workspace with blocks and params, serialize, deserialize, verify deep equality. **Version field:** Serialized output includes `"version": 1`. **No columnIndex/orderIndex in block output:** Verify blocks don't store these fields (derived from array position). **Invalid JSON:** Deserialize garbage, expect error. **Missing required fields:** Validate JSON missing `columns`, expect error. **Empty workspace:** Serialize workspace with no blocks, deserialize, verify empty columns. |
| `src/services/host/__tests__/WebHostBridge.test.ts` | **sendState:** Call `sendState`, verify `localStorage` is written. **requestLoad:** Seed `localStorage` with valid JSON, call `requestLoad`, verify callback receives correct workspace. **requestLoad empty:** No localStorage entry, verify callback is not called (or receives null). **requestSave:** Verify it delegates to `sendState`. |

---

## Phase 11: Palette Search & Connection Ports

**Goal:** A search bar at the top of the palette filters blocks by name as the user types. Blocks on the canvas show small connection port indicators — a dot at the top of blocks that have a predecessor and a dot at the bottom of blocks that have a successor in the column.

### What happens
Add `PaletteSearchBar` to the palette and `ConnectionPort` to the canvas blocks. These are visual polish features that improve usability without changing the core data flow.

### Files created

```
src/components/palette/
  PaletteSearchBar.ts
src/components/canvas/
  ConnectionPort.ts
src/components/palette/
  BlockPalette.ts            # (modified — add search bar, wire filtering)
src/components/canvas/
  CanvasBlock.ts             # (modified — add connection port rendering)
```

### Class definitions

**`src/components/palette/PaletteSearchBar.ts`**
```typescript
export class PaletteSearchBar {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;

  constructor(onSearch: (query: string) => void) { ... }

  /** Clear the search input and trigger the callback with empty string. */
  clear(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/ConnectionPort.ts`**
```typescript
export class ConnectionPort {
  private containerEl: HTMLElement;

  constructor(position: 'top' | 'bottom') { ... }

  /** Show or hide the port. */
  setVisible(visible: boolean): void { ... }

  getElement(): HTMLElement { ... }
}
```

The `BlockPalette.render()` method is updated to accept a filter callback. When the search input fires, the palette iterates all `PaletteBlock` elements and toggles their visibility (`display: none` vs `display: block`) based on whether the block name contains the search query (case-insensitive).

Connection ports are shown/hidden by `WorkspaceManager` during `reflowColumn()` — after recalculating positions, it checks each block's neighbors: if a block has a block above it, the top port is visible; if it has a block below it, the bottom port is visible.

### Tests added

| Test file | What it covers |
|---|---|
| `src/components/palette/__tests__/PaletteSearchBar.test.ts` | Create search bar. Simulate typing "fil". Assert callback is called with "fil". Clear, assert callback called with "". |
| `src/components/palette/__tests__/BlockPalette.test.ts` | **(Updated)** Register 5 blocks. Simulate search for "filter". Assert only matching blocks are visible. Clear search, all visible again. |
| `src/components/canvas/__tests__/ConnectionPort.test.ts` | Create top port. Assert element has "top" class. `setVisible(true)` — not hidden. `setVisible(false)` — hidden. |
| `src/__tests__/connection-ports.integration.test.ts` | Column with 3 blocks. First block: no top port, has bottom port. Middle block: has both. Last block: has top port, no bottom port. Single block in column: no ports visible. |

---

## Phase 12: VS Code Host Bridge & Environment Detection

**Goal:** No visible change in standalone mode. However, the codebase is now fully portable to a VS Code extension. A `VSCodeHostBridge` implementation exists and the app auto-detects its environment at startup. This phase completes the architecture's portability requirement.

### What happens
Implement `VSCodeHostBridge` that communicates via `postMessage`. Add environment detection to the startup sequence. Define the message protocol types. This phase does not include the actual VS Code extension scaffolding — that's a separate repo concern — but the web app side is fully ready.

### Files created

```
src/services/host/
  VSCodeHostBridge.ts
src/types/
  messages.ts                # (already exists from Phase 1, now fully used)
src/index.ts                 # (modified — add environment detection)
```

### Class definitions

**`src/services/host/VSCodeHostBridge.ts`**
```typescript
import { Workspace } from '../../types/workspace';
import { HostBridge } from './HostBridge';
import { SerializationService } from '../SerializationService';
import { BlockRegistry } from '../BlockRegistry';

declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
};

export class VSCodeHostBridge implements HostBridge {
  private vscodeApi: ReturnType<typeof acquireVsCodeApi>;
  private serializer: SerializationService;
  private registry: BlockRegistry;
  private loadCallback: ((workspace: Workspace) => void) | null;

  constructor(serializer: SerializationService, registry: BlockRegistry) { ... }

  sendState(workspace: Workspace): void { ... }
  onLoadState(callback: (workspace: Workspace) => void): void { ... }
  requestSave(): void { ... }
  requestLoad(): void { ... }

  /** Listen for messages from the extension host. */
  private setupMessageListener(): void { ... }
}
```

**Environment detection in `index.ts`:**
```typescript
function createHostBridge(serializer: SerializationService, registry: BlockRegistry): HostBridge {
  if (typeof acquireVsCodeApi === 'function') {
    return new VSCodeHostBridge(serializer, registry);
  }
  return new WebHostBridge(serializer, registry);
}
```

### Tests added

| Test file | What it covers |
|---|---|
| `src/services/host/__tests__/VSCodeHostBridge.test.ts` | Mock `acquireVsCodeApi` on `globalThis`. Create bridge. **sendState:** Call it, verify `vscodeApi.postMessage` was called with `{ type: 'save', payload: ... }`. **onLoadState:** Register callback, simulate incoming `{ type: 'load', payload: ... }` via `window.dispatchEvent(new MessageEvent(...))`, verify callback receives workspace. **requestSave:** Verify it calls `postMessage` with `{ type: 'save' }`. |
| `src/__tests__/environment-detection.test.ts` | When `acquireVsCodeApi` is undefined, verify `WebHostBridge` is created. When it's defined (mock), verify `VSCodeHostBridge` is created. |

---

## Test Summary by Phase

| Phase | Unit tests | Integration tests | Cumulative total (approx) |
|---|---|---|---|
| 0 | 1 | 0 | 1 |
| 1 | 3 | 0 | 4 |
| 2 | 1 | 0 | 5 |
| 3 | 3 | 0 | 8 |
| 4 | 5 | 0 | 13 |
| 5 | 3 | 1 | 17 |
| 6 | 7 | 0 | 24 |
| 7 | 1 (extended) | 1 | 26 |
| 8 | 0 | 1 | 27 |
| 9 | 6 | 1 | 34 |
| 10 | 2 | 0 | 36 |
| 11 | 4 | 1 | 41 |
| 12 | 2 | 0 | 43 |

All tests use **Vitest + jsdom**. No browser automation is required — DOM interactions are tested via `jsdom`'s event simulation (`element.dispatchEvent(new MouseEvent(...))`, `element.click()`, etc.). This keeps the test suite fast (sub-second for the full suite through at least Phase 8).

---

## Dependency Graph

```
Phase 0: Scaffolding
  │
  └─► Phase 1: Types + Two-Panel Layout
        │
        ├─► Phase 2: Block Registry
        │     │
        │     └─► Phase 3: Static Palette
        │
        └─► Phase 4: Canvas + Columns + LayoutEngine + WorkspaceManager
              │
              ├─► Phase 5: Palette → Canvas Drag
              │     │
              │     └─► Phase 7: Canvas Drag (reorder/move)
              │
              ├─► Phase 6: Inline Parameters
              │
              ├─► Phase 8: Delete & Copy
              │
              └─► Phase 9: Undo / Redo (depends on all mutation phases)
                    │
                    └─► Phase 10: Serialization & Persistence
                          │
                          ├─► Phase 11: Search + Connection Ports (parallel with 12)
                          └─► Phase 12: VS Code Host Bridge (parallel with 11)
```

Phases 11 and 12 are independent and can be done in either order or in parallel.

---

## Open Design Decisions (from Architecture Doc)

These questions from the architecture doc's Section 16 should be decided before or during the phase where they become relevant:

| Question | Relevant phase | Current assumption |
|---|---|---|
| Block height — fixed or dynamic? | Phase 4 (LayoutEngine) | Dynamic, based on parameter count |
| Chain validation — enforce or warn? | Phase 5 (drop logic) | Warn only (allow drop, show visual indicator) |
| Keyboard shortcuts beyond Ctrl+Z/Y? | Phase 9 (CanvasToolbar) | Delete key for selected block; Ctrl+Z/Y for undo/redo |
| Multi-select? | Not planned | Out of scope for initial implementation |
| Max blocks per column? | Phase 4 (WorkspaceManager) | Unlimited, column scrolls |
| Canvas scrolling/zoom? | Phase 4 (CanvasPanel) | Vertical scroll yes, zoom no (for now) |
