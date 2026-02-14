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

The top-level UI shell. `App` owns the two-panel layout and acts as the root container that later phases attach sub-components to (palette, canvas, toolbar). It is instantiated once by `init()` in `index.ts` and receives the page's root container element.

```typescript
export class App {
  private rootEl: HTMLElement;
  private paletteContainerEl: HTMLElement;
  private canvasContainerEl: HTMLElement;

  /**
   * Creates the two-panel DOM structure and appends it to `container`.
   * 1. Creates `rootEl` — a `<div class="app">` using flexbox row layout.
   * 2. Creates `paletteContainerEl` — a `<div class="app__palette">` (narrow left panel, ~250px fixed width).
   * 3. Creates `canvasContainerEl` — a `<div class="app__canvas">` (fills remaining width via flex: 1).
   * 4. Appends palette and canvas to root, then root to `container`.
   * 5. Both panels initially contain placeholder text ("Palette" / "Canvas") which later phases replace with real content.
   */
  constructor(container: HTMLElement) { ... }

  /** Creates the two-panel DOM structure and appends it to the container. */
  private render(): void { ... }

  getRootElement(): HTMLElement { ... }
  getPaletteContainer(): HTMLElement { ... }
  getCanvasContainer(): HTMLElement { ... }
}
```

The resulting DOM structure:
```html
<div class="app">                     <!-- rootEl: flexbox row, full viewport height -->
  <div class="app__palette">Palette</div>  <!-- paletteContainerEl: fixed width, scrollable overflow-y -->
  <div class="app__canvas">Canvas</div>    <!-- canvasContainerEl: flex: 1, scrollable overflow-y -->
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

The read-only catalog of block templates. `BlockRegistry` stores `BlockDefinition` objects (loaded from `blocks.json`) and provides lookup methods used by the palette (to render the block catalog), the workspace manager (to resolve a definition when creating instances), and the layout engine (to compute block heights from parameter counts). It is created once at app startup and shared by reference — it is never mutated after initial loading.

```typescript
import { BlockDefinition, BlockDefinitionConfig } from '../types/blocks';

export class BlockRegistry {
  private definitions: Map<string, BlockDefinition>;

  /** Initializes an empty `definitions` map. Call `loadFromConfig()` to populate. */
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

The palette panel's root component. It reads all block definitions from the registry, groups them by category, and creates a `CategoryGroup` for each one. The palette is the left panel of the app — it provides a scrollable catalog of available blocks that users can later drag onto the canvas.

```typescript
import { BlockRegistry } from '../../services/BlockRegistry';

export class BlockPalette {
  private containerEl: HTMLElement;
  private registry: BlockRegistry;
  private categoryGroups: CategoryGroup[];

  /**
   * 1. Stores `container` and `registry` references.
   * 2. Creates `containerEl` — a `<div class="palette">` appended to `container`.
   * 3. Calls `render()` to populate the palette.
   */
  constructor(container: HTMLElement, registry: BlockRegistry) { ... }

  /**
   * 1. Calls `registry.getCategories()` to get sorted category names.
   * 2. For each category, calls `registry.getByCategory(name)` to get its definitions.
   * 3. Creates a `CategoryGroup` for each category, passing the name and definitions.
   * 4. Appends each group's element to `containerEl`.
   * 5. Stores all groups in `categoryGroups` for later use (search filtering in Phase 11).
   */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/palette/CategoryGroup.ts`**

A collapsible section within the palette containing all blocks of a single category. Renders a clickable header (e.g., "Input", "Transform") followed by a list of `PaletteBlock` cards. Categories start expanded (not collapsed).

```typescript
import { BlockDefinition } from '../../types/blocks';

export class CategoryGroup {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private blockListEl: HTMLElement;
  private collapsed: boolean;
  private blocks: PaletteBlock[];

  /**
   * 1. Sets `collapsed = false` (expanded by default).
   * 2. Creates `containerEl` — `<div class="category-group">`.
   * 3. Creates `headerEl` — `<div class="category-group__header">` with text set to `categoryName`.
   *    Adds a click listener that calls `toggle()`.
   * 4. Creates `blockListEl` — `<div class="category-group__blocks">`.
   * 5. For each definition in `definitions`, creates a `PaletteBlock` and appends its element to `blockListEl`.
   * 6. Stores the `PaletteBlock` instances in `blocks`.
   * 7. Appends `headerEl` and `blockListEl` to `containerEl`.
   */
  constructor(categoryName: string, definitions: BlockDefinition[]) { ... }

  /**
   * Flips `collapsed` boolean. When collapsed, sets `blockListEl.style.display = 'none'`.
   * When expanded, sets it to `''` (or `'block'`). Optionally toggles a CSS class on
   * `headerEl` (e.g., `category-group__header--collapsed`) for a chevron rotation.
   */
  toggle(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/palette/PaletteBlock.ts`**

A single block card in the palette. Displays the block's name and description with a colored background matching the block definition's `color` field. In Phase 5, a `mousedown` handler will be added to initiate drag-from-palette.

```typescript
import { BlockDefinition } from '../../types/blocks';

export class PaletteBlock {
  private containerEl: HTMLElement;
  private definition: BlockDefinition;

  /**
   * 1. Stores the `definition` reference.
   * 2. Creates `containerEl` — `<div class="palette-block">`.
   * 3. Sets `containerEl.style.backgroundColor` (or `borderLeft`/`borderTop`) to `definition.color`.
   * 4. Creates a `<span class="palette-block__name">` with `definition.name`.
   * 5. Creates a `<span class="palette-block__description">` with `definition.description`.
   * 6. Appends both spans to `containerEl`.
   * 7. Stores `definition.id` as a data attribute (`data-definition-id`) for later retrieval.
   */
  constructor(definition: BlockDefinition) { ... }

  /** Returns the block definition ID (used later for drag initiation). */
  getDefinitionId(): string { ... }

  getElement(): HTMLElement { ... }
}
```

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

A lightweight publish/subscribe system for decoupling components. Components emit events (e.g., `'workspace:changed'`, `'command:executed'`) without knowing who listens. Used by `WorkspaceManager` to notify the UI of state changes and by `CommandManager` to signal undo/redo availability changes. A single `EventBus` instance is created at startup and shared across the app.

```typescript
type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback>>;

  /** Initializes an empty `listeners` map. */
  constructor() { ... }

  /** Adds `callback` to the set of listeners for `event`. Creates the set if this is the first listener for that event. */
  on(event: string, callback: EventCallback): void { ... }

  /** Removes `callback` from the listener set for `event`. No-op if not found. */
  off(event: string, callback: EventCallback): void { ... }

  /** Calls every listener registered for `event`, passing `args`. Silently does nothing if no listeners exist for the event. */
  emit(event: string, ...args: unknown[]): void { ... }
}
```

**`src/services/LayoutEngine.ts`**

Pure math service — no DOM manipulation. Given workspace state and block definitions, it computes pixel positions and sizes for all visual elements. It is the single source of truth for "where does this block go on screen?" Used by `WorkspaceManager.reflowColumn()` to position block DOM elements and by `DragManager` to determine drop targets during a drag.

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

  /** Stores the registry reference for later use in parameter count lookups. */
  constructor(registry: BlockRegistry) { ... }

  /**
   * Convenience method: returns { x, y } for a block by combining
   * `calculateColumnX(block.columnIndex, ...)` and `calculateBlockY(block.orderIndex, ...)`.
   */
  calculateBlockPosition(block: BlockInstance, workspace: Workspace): Position { ... }

  /**
   * Returns the x pixel offset for a column.
   * Formula: `config.canvasPaddingPx + columnIndex * (config.columnWidthPx + COLUMN_GAP_PX)`.
   */
  calculateColumnX(columnIndex: number, config: WorkspaceConfig): number { ... }

  /**
   * Returns the y pixel offset for a block at `orderIndex` within `column`.
   * Iterates blocks 0..orderIndex-1 in the column, sums their heights + `config.blockGapPx`
   * between each, starting from `config.canvasPaddingPx` (or 0 if padding is on the container).
   * Needs the registry to look up each block's definition and count its parameters.
   */
  calculateBlockY(orderIndex: number, column: Column): number { ... }

  /**
   * Returns the pixel height of a block.
   * Formula: `HEADER_HEIGHT_PX + (paramCount * PARAM_ROW_HEIGHT_PX) + BLOCK_PADDING_PX`.
   * Looks up `registry.get(block.definitionId).parameters.length` to get `paramCount`.
   */
  getBlockHeight(block: BlockInstance): number { ... }

  /**
   * Hit-test: given mouse coordinates (relative to the canvas container), determines
   * which column the mouse is over (by comparing mouseX against column x ranges) and
   * which insertion slot the mouse is closest to (by comparing mouseY against block
   * y positions in that column). Returns `{ columnIndex, orderIndex, indicatorY }` or
   * `null` if the mouse is outside all columns.
   *
   * `indicatorY` is the y pixel position where a drop indicator line should be drawn.
   */
  getDropTarget(mouseX: number, mouseY: number, workspace: Workspace): DropTarget | null { ... }
}
```

**`src/services/WorkspaceManager.ts`**

The central state manager for the workspace. Owns the `Workspace` data model (columns and block instances), handles all mutations (add, remove, move, copy, update parameters), and keeps the DOM in sync after each mutation via `reflowColumn()`. Also maintains maps of block/column DOM elements so it can position them. Think of it as the "model + controller" for the canvas — it holds the truth and updates the view.

In Phase 9, the public mutation methods will be refactored to go through `CommandManager` for undo/redo support (see Phase 9 architecture note).

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

  /**
   * 1. Stores references to `registry`, `layoutEngine`, and `events`.
   * 2. Initializes `nextInstanceId = 1`.
   * 3. Initializes empty `blockElements` and `columnElements` maps.
   * 4. Creates the `workspace` object: `{ config, columns: [] }`.
   * 5. Populates `workspace.columns` with `config.columnCount` empty `Column` objects,
   *    each with `{ index: i, blocks: [] }`.
   */
  constructor(
    config: WorkspaceConfig,
    registry: BlockRegistry,
    layoutEngine: LayoutEngine,
    events: EventBus
  ) { ... }

  /**
   * 1. Generates a unique instance ID via `generateId()`.
   * 2. Looks up the `BlockDefinition` from the registry using `definitionId`.
   * 3. Creates a `BlockInstance` with the generated ID, definitionId, columnIndex, orderIndex,
   *    and `parameterValues` pre-filled with each parameter's `defaultValue`.
   * 4. Splices the instance into `workspace.columns[columnIndex].blocks` at `orderIndex`.
   * 5. Updates `orderIndex` values for all subsequent blocks in the column.
   * 6. Creates a `CanvasBlock` component (or the DOM element for the block) and registers it
   *    via `registerBlockElement()`. Appends the element to the column's DOM element.
   * 7. Calls `reflowColumn(columnIndex)` to reposition all blocks in the column.
   * 8. Emits `'workspace:changed'` on the event bus.
   * 9. Returns the created `BlockInstance`.
   */
  addBlock(definitionId: string, columnIndex: number, orderIndex: number): BlockInstance { ... }

  /**
   * 1. Finds the block instance by `instanceId` (search all columns).
   * 2. Removes the block from its column's `blocks` array.
   * 3. Updates `orderIndex` values for remaining blocks in that column.
   * 4. Removes the block's DOM element from the DOM and from `blockElements`.
   * 5. Calls `reflowColumn()` for the affected column.
   * 6. Emits `'workspace:changed'`.
   */
  removeBlock(instanceId: string): void { ... }

  /**
   * 1. Finds the block by `instanceId`, records its current column/order.
   * 2. Removes it from the source column's `blocks` array.
   * 3. Updates the block's `columnIndex` and `orderIndex` to the new values.
   * 4. Splices it into the target column's `blocks` array at `toOrder`.
   * 5. Updates `orderIndex` values for both source and target columns.
   * 6. Moves the DOM element from the source column element to the target column element.
   * 7. Calls `reflowColumn()` for both affected columns.
   * 8. Emits `'workspace:changed'`.
   */
  moveBlock(instanceId: string, toColumn: number, toOrder: number): void { ... }

  /**
   * 1. Finds the source block by `instanceId`.
   * 2. Deep-copies `parameterValues` (structuredClone or JSON round-trip).
   * 3. Calls `addBlock()` with the same `definitionId`, same `columnIndex`,
   *    and `orderIndex = source.orderIndex + 1` (directly below the original).
   * 4. Overwrites the new block's `parameterValues` with the copied values.
   * 5. Returns the new `BlockInstance`.
   */
  copyBlock(instanceId: string): BlockInstance { ... }

  /** Finds the block by ID and sets `parameterValues[paramId] = value`. Emits `'workspace:changed'`. */
  updateParameter(instanceId: string, paramId: string, value: unknown): void { ... }

  /** Get a column by index. */
  getColumn(index: number): Column { ... }

  /** Get a block instance by ID. Throws if not found. */
  getBlock(instanceId: string): BlockInstance { ... }

  /** Get the full workspace state (returns the workspace object reference). */
  getWorkspace(): Workspace { ... }

  /** Stores a column's DOM element in `columnElements` map, keyed by column index. */
  registerColumnElement(index: number, el: HTMLElement): void { ... }

  /** Stores a block's DOM element in `blockElements` map, keyed by instance ID. */
  registerBlockElement(instanceId: string, el: HTMLElement): void { ... }

  /** Get the DOM element for a block instance, or undefined if not registered. */
  getBlockElement(instanceId: string): HTMLElement | undefined { ... }

  /** Subscribes to the `'workspace:changed'` event on the event bus. */
  onStateChange(callback: () => void): void { ... }

  /** Returns `'block-${nextInstanceId++}'`. */
  private generateId(): string { ... }

  /**
   * Iterates all blocks in the given column. For each block:
   * 1. Calls `layoutEngine.calculateBlockY(block.orderIndex, column)` to get its y position.
   * 2. Looks up the block's DOM element from `blockElements`.
   * 3. Sets `element.style.transform = 'translateY(${y}px)'` (or sets `top`).
   * This ensures blocks stack correctly after any add/remove/move operation.
   */
  private reflowColumn(columnIndex: number): void { ... }
}
```

**`src/components/canvas/CanvasPanel.ts`**

The canvas area's root component. It creates the column layout container and instantiates `CanvasColumn` components based on the workspace config's `columnCount`. It also registers each column's DOM element with `WorkspaceManager` so the manager can append block elements to them.

```typescript
import { WorkspaceManager } from '../../services/WorkspaceManager';

export class CanvasPanel {
  private containerEl: HTMLElement;
  private columnsContainerEl: HTMLElement;
  private columns: CanvasColumn[];
  private workspaceManager: WorkspaceManager;

  /**
   * 1. Stores `workspaceManager` reference.
   * 2. Creates `containerEl` — `<div class="canvas">` appended to `container`.
   * 3. Calls `render()`.
   */
  constructor(container: HTMLElement, workspaceManager: WorkspaceManager) { ... }

  /**
   * 1. Creates `columnsContainerEl` — `<div class="canvas__columns">` with flexbox row layout.
   * 2. Reads `workspaceManager.getWorkspace().config.columnCount`.
   * 3. For each column index, creates a `CanvasColumn` and appends its element to `columnsContainerEl`.
   * 4. Registers each column's DOM element with `workspaceManager.registerColumnElement(index, el)`.
   * 5. Stores the `CanvasColumn` instances in `columns`.
   * 6. Appends `columnsContainerEl` to `containerEl`.
   */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/CanvasColumn.ts`**

A single vertical lane in the canvas grid. Columns have a fixed width (from `WorkspaceConfig.columnWidthPx`) and are positioned side by side. Blocks are appended as children and positioned absolutely within the column using `top`/`transform` values set by `WorkspaceManager.reflowColumn()`.

```typescript
export class CanvasColumn {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private index: number;

  /**
   * 1. Stores `index`.
   * 2. Creates `containerEl` — `<div class="canvas-column">` with `position: relative`
   *    (so child blocks can be positioned absolutely within it).
   * 3. Creates `headerEl` — `<div class="canvas-column__header">` displaying
   *    `"Column ${index + 1}"` (or just the index). Appended to `containerEl`.
   */
  constructor(index: number) { ... }

  getElement(): HTMLElement { ... }
  getIndex(): number { ... }
}
```

**`src/components/canvas/CanvasBlock.ts`**

A block instance rendered on the canvas. Unlike `PaletteBlock` (which represents a template), `CanvasBlock` represents a placed instance with its own ID, parameter values, and position. It renders a colored header bar (via `BlockHeader`) and, in Phase 6, inline parameter inputs below the header.

```typescript
import { BlockInstance } from '../../types/workspace';
import { BlockDefinition } from '../../types/blocks';

export class CanvasBlock {
  private containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private instance: BlockInstance;
  private definition: BlockDefinition;

  /**
   * 1. Stores `instance` and `definition`.
   * 2. Creates `containerEl` — `<div class="canvas-block">` with `position: absolute`
   *    (positioned by WorkspaceManager.reflowColumn via transform/top).
   * 3. Sets width to match the column width.
   * 4. Calls `render()`.
   */
  constructor(instance: BlockInstance, definition: BlockDefinition) { ... }

  /**
   * 1. Creates a `BlockHeader` component, passing `definition` and placeholder callbacks
   *    for delete/copy (wired in Phase 8).
   * 2. Appends the header element to `containerEl`.
   * 3. (Phase 6) Will also create parameter input rows here.
   */
  private render(): void { ... }

  getElement(): HTMLElement { ... }
  getInstanceId(): string { ... }
}
```

**`src/components/canvas/BlockHeader.ts`**

The colored top bar of a canvas block. Shows the block name and action buttons (delete, copy). The background color comes from `definition.color`. Action buttons are rendered as small icons or text buttons on the right side of the header. The header also serves as the drag handle in Phase 7 (mousedown on the header initiates a canvas drag).

```typescript
import { BlockDefinition } from '../../types/blocks';

export class BlockHeader {
  private containerEl: HTMLElement;

  /**
   * 1. Creates `containerEl` — `<div class="block-header">` with flexbox row layout.
   * 2. Sets `containerEl.style.backgroundColor` to `definition.color`.
   * 3. Creates a `<span class="block-header__name">` with `definition.name`.
   * 4. Creates a button group `<div class="block-header__actions">`:
   *    - Copy button: calls `onCopy()` on click (if provided).
   *    - Delete button: calls `onDelete()` on click (if provided).
   *    - Buttons are disabled/hidden if callbacks are undefined (Phase 4 has no wiring yet).
   * 5. Appends name and button group to `containerEl`.
   */
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

Orchestrates the entire drag-and-drop lifecycle. It tracks drag state (where the drag started, where the cursor is, what the current drop target is), manages the ghost preview and drop indicator visuals, and commits the result on drop. There are two drag origins: palette (creates a new block) and canvas (moves an existing block, added in Phase 7). The drag flow is:

1. `startPaletteDrag()` / `startCanvasDrag()` → creates `DragState`, shows ghost
2. `updateDrag()` (called on every mousemove) → moves ghost, computes drop target via `LayoutEngine.getDropTarget()`, shows/hides indicator
3. `endDrag()` (called on mouseup) → reads final drop target, calls `WorkspaceManager.addBlock()` or `.moveBlock()`, cleans up visuals
4. `cancelDrag()` (called on Escape) → cleans up visuals, restores original state if canvas drag

The `DragManager` is created once in `App` and wired to document-level mouse/keyboard events.

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

  /**
   * 1. Stores `layoutEngine` and `workspaceManager` references.
   * 2. Sets `currentDrag = null`, `ghostEl = null`, `dropIndicatorEl = null`.
   * 3. Initializes empty `blockElements` map.
   */
  constructor(layoutEngine: LayoutEngine, workspaceManager: WorkspaceManager) { ... }

  /**
   * 1. Creates a `DragState` with `source: 'palette'`, the given `definitionId`,
   *    `instanceId: null`, `originColumn: null`, `originOrder: null`.
   * 2. Sets `mouseX`/`mouseY` on the state.
   * 3. Shows the ghost element with the block's name and color (looked up from the registry
   *    via workspaceManager or passed in).
   * 4. Positions the ghost at the cursor via `updateGhostPosition()`.
   */
  startPaletteDrag(definitionId: string, mouseX: number, mouseY: number): void { ... }

  /**
   * (Phase 7) 1. Looks up the block instance and its current column/order.
   * 2. Creates a `DragState` with `source: 'canvas'`, the block's `definitionId`,
   *    `instanceId`, and `originColumn`/`originOrder` recorded for cancel-restore.
   * 3. Hides the original block element (opacity: 0).
   * 4. Shows the ghost and positions it at the cursor.
   */
  startCanvasDrag(instanceId: string, mouseX: number, mouseY: number): void { ... }

  /**
   * 1. Updates `currentDrag.mouseX`/`mouseY`.
   * 2. Calls `updateGhostPosition()` to move the ghost.
   * 3. Calls `layoutEngine.getDropTarget(mouseX, mouseY, workspace)` to compute the target.
   * 4. Stores the result in `currentDrag.currentDropTarget`.
   * 5. Calls `updateDropIndicator(target)` to show/move/hide the indicator line.
   */
  updateDrag(mouseX: number, mouseY: number): void { ... }

  /**
   * 1. If no `currentDropTarget`, calls `cancelDrag()` and returns (dropped outside canvas).
   * 2. If `source === 'palette'`: calls `workspaceManager.addBlock(definitionId, columnIndex, orderIndex)`.
   * 3. If `source === 'canvas'`: calls `workspaceManager.moveBlock(instanceId, columnIndex, orderIndex)`.
   * 4. Calls `cleanupDragVisuals()`.
   * 5. Sets `currentDrag = null`.
   */
  endDrag(): void { ... }

  /**
   * 1. If `source === 'canvas'`, restores the original block element's opacity to 1.
   * 2. Calls `cleanupDragVisuals()`.
   * 3. Sets `currentDrag = null`.
   */
  cancelDrag(): void { ... }

  /** Returns `currentDrag !== null`. */
  isDragging(): boolean { ... }

  /** Returns `currentDrag` (or null). */
  getDragState(): DragState | null { ... }

  /** Stores the ghost DOM element reference for positioning during drags. */
  registerGhostElement(el: HTMLElement): void { ... }

  /** Stores the drop indicator DOM element reference. */
  registerDropIndicatorElement(el: HTMLElement): void { ... }

  /** Stores a canvas block DOM element for opacity manipulation during canvas drags. */
  registerBlockElement(instanceId: string, el: HTMLElement): void { ... }

  /** Removes a block element from the map (called when a block is deleted). */
  unregisterBlockElement(instanceId: string): void { ... }

  /**
   * Sets `ghostEl.style.left = mouseX + 'px'` and `ghostEl.style.top = mouseY + 'px'`
   * (with an offset so the ghost appears beside the cursor, not directly under it).
   */
  private updateGhostPosition(mouseX: number, mouseY: number): void { ... }

  /**
   * If `target` is null, hides the indicator. Otherwise, shows it at `target.indicatorY`
   * within the target column's DOM element.
   */
  private updateDropIndicator(target: DropTarget | null): void { ... }

  /** Hides the ghost element and the drop indicator. Resets any block opacity changes. */
  private cleanupDragVisuals(): void { ... }
}
```

**`src/components/canvas/DragGhost.ts`**

A semi-transparent floating preview that follows the cursor during a drag. It's a single `<div>` that gets repositioned on every mousemove. Created once at app startup and appended to the document body (so it floats above all other content). Hidden by default — shown only during an active drag.

```typescript
export class DragGhost {
  private containerEl: HTMLElement;

  /**
   * Creates `containerEl` — `<div class="drag-ghost">` with `position: fixed`,
   * `pointer-events: none`, `opacity: 0.7`, `z-index: 1000`, and `display: none`.
   */
  constructor() { ... }

  /**
   * Sets `containerEl`'s text content to `name`, background color to `color`,
   * and `display` to `'block'` (makes it visible).
   */
  show(name: string, color: string): void { ... }

  /** Sets `display: 'none'`. */
  hide(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/DropIndicator.ts`**

A horizontal line that appears between blocks during a drag to show where the dropped block will be inserted. Created once at startup and repositioned as the drag target changes. It's a thin `<div>` (e.g., 2-3px tall, colored blue or accent) with `position: absolute`.

```typescript
export class DropIndicator {
  private containerEl: HTMLElement;

  /**
   * Creates `containerEl` — `<div class="drop-indicator">` with `position: absolute`,
   * `height: 2px` (or 3px), a bright accent color background, `display: none`,
   * and full column width.
   */
  constructor() { ... }

  /**
   * Appends (or moves) `containerEl` into `columnEl`, sets `top = y + 'px'`,
   * and sets `display: 'block'`.
   */
  show(y: number, columnEl: HTMLElement): void { ... }

  /** Sets `display: 'none'`. */
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

A static factory that maps `ParameterType` enum values to the correct input component class. This is the only place where the switch/map from type to component lives — `CanvasBlock` calls `InlineParam.create()` without knowing which specific input class is used.

```typescript
import { ParameterDefinition, ParameterType } from '../../../types/blocks';

/** Factory that creates the correct input component based on parameter type. */
export class InlineParam {
  /**
   * Switches on `paramDef.type`:
   * - `TEXT` → creates a `TextInput`
   * - `NUMBER` → creates a `NumberInput`
   * - `BOOLEAN` → creates a `BooleanToggle`
   * - `SELECT` → creates a `SelectDropdown`
   * - `COLOR` → creates a `ColorPicker`
   * Returns the component's root `HTMLElement` (via `getElement()`).
   * Passes `paramDef`, `initialValue`, and `onChange` through to the component constructor.
   */
  static create(
    paramDef: ParameterDefinition,
    initialValue: unknown,
    onChange: (paramId: string, value: unknown) => void
  ): HTMLElement { ... }
}
```

**`src/components/canvas/params/TextInput.ts`**

A labeled text input row rendered inside a canvas block. Each parameter input component follows the same pattern: a container `<div>` with a `<label>` and an input element side by side.

```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class TextInput {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  /**
   * 1. Creates `containerEl` — `<div class="param-row">` (flexbox row, fixed height = PARAM_ROW_HEIGHT_PX).
   * 2. Creates `labelEl` — `<label>` with text from `paramDef.name`.
   * 3. Creates `inputEl` — `<input type="text">` with `value = initialValue`.
   * 4. If `paramDef.validation?.pattern`, sets `inputEl.pattern`.
   * 5. If `paramDef.validation?.required`, sets `inputEl.required`.
   * 6. Adds an `'input'` (or `'change'`) event listener on `inputEl` that calls
   *    `onChange(paramDef.id, inputEl.value)`.
   * 7. Appends label and input to container.
   */
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

Same layout pattern as `TextInput` but with `<input type="number">`. Respects `min`, `max`, and `step` from the parameter's `ValidationRule`.

```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class NumberInput {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  /**
   * 1. Creates container, label (from `paramDef.name`), and `<input type="number">`.
   * 2. Sets `inputEl.value = String(initialValue)`.
   * 3. If `paramDef.validation?.min` is defined, sets `inputEl.min`.
   * 4. If `paramDef.validation?.max` is defined, sets `inputEl.max`.
   * 5. If `paramDef.validation?.step` is defined, sets `inputEl.step`.
   * 6. Adds `'change'` listener that calls `onChange(paramDef.id, Number(inputEl.value))`.
   *    (Uses `Number()` to ensure the callback receives a number, not a string.)
   */
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

A labeled checkbox for boolean parameters.

```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class BooleanToggle {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  /**
   * 1. Creates container, label (from `paramDef.name`), and `<input type="checkbox">`.
   * 2. Sets `inputEl.checked = initialValue`.
   * 3. Adds `'change'` listener that calls `onChange(paramDef.id, inputEl.checked)`.
   */
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

A labeled `<select>` dropdown for parameters with a fixed set of options (defined in `paramDef.options`).

```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class SelectDropdown {
  private containerEl: HTMLElement;
  private selectEl: HTMLSelectElement;
  private labelEl: HTMLLabelElement;

  /**
   * 1. Creates container and label (from `paramDef.name`).
   * 2. Creates `selectEl` — `<select>`.
   * 3. Iterates `paramDef.options!` (guaranteed to exist for SELECT type) and creates
   *    an `<option value="opt.value">opt.label</option>` for each.
   * 4. Sets `selectEl.value = initialValue`.
   * 5. Adds `'change'` listener that calls `onChange(paramDef.id, selectEl.value)`.
   */
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

A labeled `<input type="color">` for hex color parameters.

```typescript
import { ParameterDefinition } from '../../../types/blocks';

export class ColorPicker {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;
  private labelEl: HTMLLabelElement;

  /**
   * 1. Creates container and label (from `paramDef.name`).
   * 2. Creates `inputEl` — `<input type="color">` with `value = initialValue` (e.g., `"#ff0000"`).
   * 3. Adds `'input'` listener that calls `onChange(paramDef.id, inputEl.value)`.
   *    (Uses `'input'` rather than `'change'` so the callback fires as the user drags
   *    the color picker, giving live feedback.)
   */
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

Manages the undo/redo stacks. Every user action that mutates workspace state is wrapped in a `Command` object and executed through this manager. This gives free undo/redo for all mutations. The manager emits `'command:stateChanged'` on the event bus after every execute/undo/redo so the toolbar can update button states.

```typescript
import { Command } from '../types/commands';
import { EventBus } from './EventBus';

export class CommandManager {
  private undoStack: Command[];
  private redoStack: Command[];
  private events: EventBus;

  /**
   * 1. Stores `events` reference.
   * 2. Initializes `undoStack = []` and `redoStack = []`.
   */
  constructor(events: EventBus) { ... }

  /**
   * 1. Calls `command.execute()`.
   * 2. Pushes `command` onto `undoStack`.
   * 3. Clears `redoStack` (a new action invalidates the redo history).
   * 4. Emits `'command:stateChanged'` on the event bus.
   */
  execute(command: Command): void { ... }

  /**
   * 1. Pops the last command from `undoStack`.
   * 2. Calls `command.undo()`.
   * 3. Pushes the command onto `redoStack`.
   * 4. Emits `'command:stateChanged'`.
   * No-op if `undoStack` is empty.
   */
  undo(): void { ... }

  /**
   * 1. Pops the last command from `redoStack`.
   * 2. Calls `command.execute()`.
   * 3. Pushes the command onto `undoStack`.
   * 4. Emits `'command:stateChanged'`.
   * No-op if `redoStack` is empty.
   */
  redo(): void { ... }

  canUndo(): boolean { ... }
  canRedo(): boolean { ... }
}
```

**`src/commands/AddBlockCommand.ts`**

Wraps the "add a new block to the canvas" action. On execute, creates the block. On undo, removes it. Stores the created instance ID so undo knows which block to remove, and so re-execute can restore the same ID.

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

  /**
   * Stores all parameters. Sets `createdInstanceId = null` (populated on first execute).
   * Sets `description` to something like `"Add ${definitionId} to column ${columnIndex}"`.
   */
  constructor(
    workspaceManager: WorkspaceManager,
    definitionId: string,
    columnIndex: number,
    orderIndex: number
  ) { ... }

  /**
   * Calls `workspaceManager._internalAddBlock(...)` (the internal method that bypasses
   * CommandManager). Stores the returned instance's ID in `createdInstanceId`.
   */
  execute(): void { ... }

  /** Calls `workspaceManager._internalRemoveBlock(createdInstanceId)`. */
  undo(): void { ... }
}
```

**`src/commands/RemoveBlockCommand.ts`**

Wraps block deletion. On execute, removes the block. On undo, re-creates it at the same position with the same parameter values. Snapshots the full `BlockInstance` before removal so undo has all the data it needs.

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

  /**
   * Stores `instanceId`. Sets `removedBlock = null` (populated on execute).
   * `removedColumnIndex` and `removedOrderIndex` are also populated on execute
   * by reading the block's current position before removing it.
   */
  constructor(workspaceManager: WorkspaceManager, instanceId: string) { ... }

  /**
   * 1. Reads the block via `workspaceManager.getBlock(instanceId)`.
   * 2. Snapshots `removedBlock = deepCopy(block)`, `removedColumnIndex`, `removedOrderIndex`.
   * 3. Calls `workspaceManager._internalRemoveBlock(instanceId)`.
   */
  execute(): void { ... }

  /**
   * Re-creates the block: calls `workspaceManager._internalAddBlock(...)` using the
   * snapshotted `removedBlock.definitionId`, `removedColumnIndex`, `removedOrderIndex`,
   * and restores `parameterValues` from the snapshot.
   */
  undo(): void { ... }
}
```

**`src/commands/MoveBlockCommand.ts`**

Wraps block movement (reorder within column or cross-column move). Records the from/to positions so both execute and undo are simple `moveBlock` calls with swapped arguments.

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

  /**
   * Stores all parameters. The caller (DragManager) provides both the original
   * position (from) and the target position (to).
   */
  constructor(
    workspaceManager: WorkspaceManager,
    instanceId: string,
    fromColumn: number,
    fromOrder: number,
    toColumn: number,
    toOrder: number
  ) { ... }

  /** Calls `workspaceManager._internalMoveBlock(instanceId, toColumn, toOrder)`. */
  execute(): void { ... }

  /** Calls `workspaceManager._internalMoveBlock(instanceId, fromColumn, fromOrder)`. */
  undo(): void { ... }
}
```

**`src/commands/CopyBlockCommand.ts`**

Wraps block duplication. On execute, copies the block (placed directly below the original). On undo, removes the copy. Stores the copy's instance ID for undo.

```typescript
import { Command } from '../types/commands';
import { WorkspaceManager } from '../services/WorkspaceManager';

export class CopyBlockCommand implements Command {
  description: string;

  private workspaceManager: WorkspaceManager;
  private sourceInstanceId: string;
  private createdInstanceId: string | null;

  /** Stores `sourceInstanceId`. Sets `createdInstanceId = null`. */
  constructor(workspaceManager: WorkspaceManager, sourceInstanceId: string) { ... }

  /**
   * Calls `workspaceManager._internalCopyBlock(sourceInstanceId)`.
   * Stores the returned copy's ID in `createdInstanceId`.
   */
  execute(): void { ... }

  /** Calls `workspaceManager._internalRemoveBlock(createdInstanceId)`. */
  undo(): void { ... }
}
```

**`src/commands/UpdateParamCommand.ts`**

Wraps a single parameter value change. Stores both old and new values so execute sets the new value and undo restores the old value.

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

  /**
   * Stores all parameters. The caller reads the old value from the model before
   * creating this command and passes both old and new values in.
   */
  constructor(
    workspaceManager: WorkspaceManager,
    instanceId: string,
    paramId: string,
    oldValue: unknown,
    newValue: unknown
  ) { ... }

  /** Calls `workspaceManager._internalUpdateParameter(instanceId, paramId, newValue)`. */
  execute(): void { ... }

  /** Calls `workspaceManager._internalUpdateParameter(instanceId, paramId, oldValue)`. */
  undo(): void { ... }
}
```

**`src/components/canvas/CanvasToolbar.ts`**

A toolbar rendered above the canvas columns. Contains undo/redo buttons and listens for keyboard shortcuts (Ctrl+Z, Ctrl+Y / Ctrl+Shift+Z). Buttons are grayed out (disabled) when their respective stack is empty.

```typescript
import { CommandManager } from '../../services/CommandManager';
import { EventBus } from '../../services/EventBus';

export class CanvasToolbar {
  private containerEl: HTMLElement;
  private undoBtn: HTMLButtonElement;
  private redoBtn: HTMLButtonElement;
  private commandManager: CommandManager;

  /**
   * 1. Stores `commandManager` reference.
   * 2. Creates `containerEl` — `<div class="canvas-toolbar">`.
   * 3. Creates `undoBtn` — `<button>` with text "Undo". Click listener calls `commandManager.undo()`.
   * 4. Creates `redoBtn` — `<button>` with text "Redo". Click listener calls `commandManager.redo()`.
   * 5. Appends both buttons to `containerEl`, appends `containerEl` to `container`.
   * 6. Subscribes to `'command:stateChanged'` on `events` to call `updateButtonStates()`.
   * 7. Adds a `keydown` listener on `document` for Ctrl+Z (undo) and Ctrl+Y / Ctrl+Shift+Z (redo).
   * 8. Calls `updateButtonStates()` to set initial disabled states.
   */
  constructor(container: HTMLElement, commandManager: CommandManager, events: EventBus) { ... }

  /**
   * Sets `undoBtn.disabled = !commandManager.canUndo()` and
   * `redoBtn.disabled = !commandManager.canRedo()`.
   */
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

Handles conversion between the in-memory `Workspace` model and its JSON string representation. The serialized format includes a `version` field for future migration support. Block instances are stored as arrays within their column arrays (position is implicit from array index, so `columnIndex` and `orderIndex` are not serialized). This service is stateless — it has no constructor dependencies.

```typescript
import { Workspace } from '../types/workspace';
import { BlockRegistry } from './BlockRegistry';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class SerializationService {
  /**
   * Converts the workspace to a JSON string. The output format:
   * ```json
   * {
   *   "version": 1,
   *   "config": { "columnCount": 3, "columnWidthPx": 280, ... },
   *   "columns": [
   *     [
   *       { "id": "block-1", "definitionId": "filter", "parameterValues": { ... } },
   *       ...
   *     ],
   *     ...
   *   ]
   * }
   * ```
   * Note: `columnIndex` and `orderIndex` are omitted — they're derived from array position.
   */
  serialize(workspace: Workspace): string { ... }

  /**
   * Parses the JSON string and reconstructs a `Workspace` object.
   * 1. Parses JSON and reads `version` field (currently expects 1).
   * 2. Reconstructs `WorkspaceConfig` from the `config` object.
   * 3. For each column array, creates `Column` objects with `BlockInstance` entries,
   *    setting `columnIndex` and `orderIndex` from the array positions.
   * 4. Validates that each block's `definitionId` exists in the `registry` (throws if not found).
   * 5. Returns the reconstructed `Workspace`.
   */
  deserialize(json: string, registry: BlockRegistry): Workspace { ... }

  /**
   * Lightweight validation without full deserialization. Checks:
   * - Valid JSON syntax
   * - Has `version` field (number)
   * - Has `config` object with required fields
   * - Has `columns` array
   * Returns `{ valid: true, errors: [] }` or `{ valid: false, errors: [...] }`.
   */
  validate(json: string): ValidationResult { ... }
}
```

**`src/services/host/HostBridge.ts`**

The abstraction layer between the app and its host environment. The app doesn't know or care whether it's running in a standalone browser tab or inside a VS Code webview — it talks to a `HostBridge`. This interface has two implementations: `WebHostBridge` (localStorage, Phase 10) and `VSCodeHostBridge` (postMessage, Phase 12).

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

The standalone-browser implementation of `HostBridge`. Persists workspace state to `localStorage` as a JSON string. Used when the app is opened directly in a browser (not inside VS Code).

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

  /**
   * Stores `serializer` and `registry` references. Sets `loadCallback = null`.
   */
  constructor(serializer: SerializationService, registry: BlockRegistry) { ... }

  /**
   * Serializes the workspace via `serializer.serialize()` and writes the
   * JSON string to `localStorage` under `STORAGE_KEY`.
   */
  sendState(workspace: Workspace): void { ... }

  /** Stores the callback for later use by `requestLoad()`. */
  onLoadState(callback: (workspace: Workspace) => void): void { ... }

  /** Delegates to `sendState()` (in the web environment, save is immediate). */
  requestSave(): void { ... }

  /**
   * Reads `localStorage.getItem(STORAGE_KEY)`. If a value exists, deserializes it
   * via `serializer.deserialize(json, registry)` and calls `loadCallback(workspace)`.
   * If no saved state exists, does nothing (app starts with empty workspace).
   */
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

A text input at the top of the palette panel for filtering blocks by name. Fires the `onSearch` callback on every keystroke (via `'input'` event) with the current query string. `BlockPalette` uses this to toggle visibility of `PaletteBlock` elements.

```typescript
export class PaletteSearchBar {
  private containerEl: HTMLElement;
  private inputEl: HTMLInputElement;

  /**
   * 1. Creates `containerEl` — `<div class="palette-search">`.
   * 2. Creates `inputEl` — `<input type="text" placeholder="Search blocks...">`.
   * 3. Adds an `'input'` event listener that calls `onSearch(inputEl.value)` on every keystroke.
   * 4. Appends `inputEl` to `containerEl`.
   */
  constructor(onSearch: (query: string) => void) { ... }

  /** Sets `inputEl.value = ''` and calls the search callback with `''`. */
  clear(): void { ... }

  getElement(): HTMLElement { ... }
}
```

**`src/components/canvas/ConnectionPort.ts`**

A small visual dot/circle rendered at the top or bottom edge of a canvas block to indicate data flow connectivity. A top port means the block has a predecessor in the column; a bottom port means it has a successor. These are purely visual — no interactive behavior.

```typescript
export class ConnectionPort {
  private containerEl: HTMLElement;

  /**
   * 1. Creates `containerEl` — `<div class="connection-port connection-port--${position}">`.
   * 2. Styled as a small circle (e.g., 8px wide, 8px tall, border-radius: 50%).
   * 3. Positioned absolutely at the top-center or bottom-center of the parent block.
   * 4. Starts hidden (`display: none`).
   */
  constructor(position: 'top' | 'bottom') { ... }

  /** Sets `display: 'block'` or `'none'` based on `visible`. */
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

The VS Code webview implementation of `HostBridge`. Communicates with the VS Code extension host via `postMessage` (outgoing) and `window.addEventListener('message', ...)` (incoming). Also uses VS Code's `getState()`/`setState()` API for webview state persistence across tab switches.

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

  /**
   * 1. Calls `acquireVsCodeApi()` and stores the result in `vscodeApi`.
   *    (This function can only be called once per webview session — VS Code enforces this.)
   * 2. Stores `serializer` and `registry` references.
   * 3. Sets `loadCallback = null`.
   * 4. Calls `setupMessageListener()` to start listening for messages from the extension host.
   */
  constructor(serializer: SerializationService, registry: BlockRegistry) { ... }

  /**
   * 1. Serializes the workspace via `serializer.serialize()`.
   * 2. Calls `vscodeApi.postMessage({ type: 'save', payload: json })` to send to the extension host.
   * 3. Also calls `vscodeApi.setState(json)` to persist in webview state (survives tab switches).
   */
  sendState(workspace: Workspace): void { ... }

  /** Stores the callback for later use when a `'load'` message arrives. */
  onLoadState(callback: (workspace: Workspace) => void): void { ... }

  /** Calls `vscodeApi.postMessage({ type: 'ready' })` to signal the extension that the webview is ready to receive data. */
  requestSave(): void { ... }

  /**
   * 1. First checks `vscodeApi.getState()` for previously persisted state.
   *    If found, deserializes and calls `loadCallback`.
   * 2. If no state, sends a `{ type: 'ready' }` message to the extension host,
   *    which should respond with a `'load'` message handled by `setupMessageListener`.
   */
  requestLoad(): void { ... }

  /**
   * Adds a `window.addEventListener('message', ...)` listener.
   * When a message with `event.data.type === 'load'` arrives:
   * 1. Deserializes `event.data.payload` via `serializer.deserialize(payload, registry)`.
   * 2. Calls `loadCallback(workspace)` if registered.
   * When a message with `event.data.type === 'config'` arrives:
   * handles config updates (future use).
   */
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
