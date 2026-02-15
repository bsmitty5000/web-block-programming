# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
npm run dev          # Dev server with hot reload (port 3000)
npm run build        # Production build (minified, source maps)
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode
```

Run a single test file:
```bash
npx vitest run src/services/__tests__/BlockRegistry.test.ts
```

## Architecture

Vanilla TypeScript block programming editor (no framework). Direct DOM manipulation with incremental updates — no virtual DOM or render cycle. Designed to run both standalone in a browser and inside a VS Code webview.

### Layered Design

**Types** (`src/types/`) → **Services** (`src/services/`) → **Components** (`src/components/`)

- **Types**: `BlockDefinition` (template), `BlockInstance` (placed block with param values), `Workspace` (columns + config), `DragState`, `Command`
- **Services**: Stateful singletons wired together at startup in `App`
- **Components**: Each owns a DOM element via `getElement()`, created in constructor

### Key Services

- **WorkspaceManager** — Central state owner. All workspace mutations (add/remove/move/copy blocks, update params) go through here. Public methods create `Command` objects routed through `CommandManager`; `_internal*` methods do the actual mutation + DOM sync. Calls `reflowColumn()` after each change to reposition blocks via CSS transforms.
- **BlockRegistry** — Read-only catalog of `BlockDefinition` objects loaded from `src/config/blocks.json`. Shared by reference; never mutated after init.
- **LayoutEngine** — Pure math: computes pixel positions/sizes for blocks and columns. Used by `WorkspaceManager.reflowColumn()` and `DragManager` for drop target hit-testing.
- **DragManager** — Handles palette→canvas (new block) and canvas→canvas (move block) drag-and-drop. During drag, only `style.transform` updates occur (no model changes). Model mutates once on drop.
- **CommandManager** — Undo/redo stacks wrapping all mutations. Emits `'command:stateChanged'` on EventBus.
- **EventBus** — Lightweight pub/sub (`on`/`off`/`emit`) decoupling services.
- **SerializationService** — Stateless JSON serialization. `columnIndex`/`orderIndex` are derived from array position, not stored in JSON.
- **HostBridge** — Interface abstracting persistence. `WebHostBridge` uses localStorage; `VSCodeHostBridge` uses `postMessage`/`acquireVsCodeApi`. Environment auto-detected at startup.

### Component Tree

```
App
├── BlockPalette → CategoryGroup[] → PaletteBlock[]
└── CanvasPanel → CanvasColumn[] → CanvasBlock[] → BlockHeader + InlineParam[]
    ├── DragGhost (floating preview during drag)
    └── DropIndicator (insertion line during drag)
```

`InlineParam` is a factory dispatching to `TextInput`, `NumberInput`, `BooleanToggle`, `SelectDropdown`, or `ColorPicker` based on `ParameterType`.

### Build Pipeline

esbuild in **IIFE format** (required for VS Code webview). CSS is imported from TypeScript; esbuild produces `dist/bundle.js` + `dist/bundle.css`. Entry point: `src/index.ts` exports `init(container)`.

## Code Style

- **Allman brace style** — opening braces on new lines for classes, methods, and control flow
- **2-space indentation**
- **BEM-like CSS classes**: `.component__element--modifier` (e.g., `.block-header__name`)
- **No `I` prefix** on interfaces
- **Explicit return types** on all methods
- DOM created via `document.createElement()` — no `innerHTML`

## Project Status

Phases 0–9 complete (scaffolding through undo/redo). See `ARCHITECTURE.md` for full design and `IMPLEMENTATION_PLAN.md` for phased build plan.

## Key Gotcha

`skipLibCheck: true` in tsconfig.json is required — vitest/vite have conflicting node type definitions that break compilation without it.
