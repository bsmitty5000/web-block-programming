# Vanilla TypeScript → React Conversion Guide

This guide maps every pattern in the current vanilla TS codebase to its React equivalent, with side-by-side code snippets. It's organized from foundational concepts up to the most complex conversions.

---

## Table of Contents

1. [Mental Model Shift](#1-mental-model-shift)
2. [Types Layer — No Changes](#2-types-layer--no-changes)
3. [Component Pattern: Class with DOM Element → Function Component](#3-component-pattern-class-with-dom-element--function-component)
4. [Component Composition: appendChild → JSX Children](#4-component-composition-appendchild--jsx-children)
5. [Event Handling: addEventListener → JSX Props](#5-event-handling-addeventlistener--jsx-props)
6. [Callback Props: Constructor Callbacks → React Props](#6-callback-props-constructor-callbacks--react-props)
7. [Factory/Switch Pattern → Conditional Rendering](#7-factoryswitch-pattern--conditional-rendering)
8. [State Management: Mutable Object + Manual DOM Sync → useState/useReducer](#8-state-management-mutable-object--manual-dom-sync--usestateuseReducer)
9. [EventBus → React Context + useReducer](#9-eventbus--react-context--usereducer)
10. [Service Singletons → Custom Hooks and Context](#10-service-singletons--custom-hooks-and-context)
11. [DOM Element Registration → useRef](#11-dom-element-registration--useref)
12. [CSS Transforms & Positioning → Style Props + Refs](#12-css-transforms--positioning--style-props--refs)
13. [Drag & Drop: The Performance-Critical Case](#13-drag--drop-the-performance-critical-case)
14. [HostBridge: Environment Detection → Custom Hook](#14-hostbridge-environment-detection--custom-hook)
15. [Command Pattern (Undo/Redo) → useReducer with History](#15-command-pattern-undoredo--usereducer-with-history)
16. [Full Component Mapping Table](#16-full-component-mapping-table)
17. [Recommended Migration Order](#17-recommended-migration-order)

---

## 1. Mental Model Shift

The biggest conceptual change is **who owns the DOM**.

| Vanilla TS | React |
|---|---|
| You create DOM elements (`document.createElement`) | React creates them from your JSX |
| You mutate the DOM directly (`el.style.top = ...`) | You update state; React reconciles the DOM |
| State and DOM are synced manually in each method | State change → automatic re-render → DOM updated |
| Components hold references to their DOM elements | Components describe what the DOM *should* look like |

**The key rule:** In React, you describe **what** the UI should look like given the current state. You don't describe **how** to update it step by step.

Your current `WorkspaceManager.addBlock()` does this:
1. Create BlockInstance (model)
2. Create `<div>` (DOM)
3. Append `<div>` to column `<div>`
4. Reflow column positions

In React, `addBlock()` would only do step 1. Steps 2–4 happen automatically because the component re-renders when state changes.

---

## 2. Types Layer — No Changes

Your entire `src/types/` directory ports unchanged:

```typescript
// These files move as-is:
// types/blocks.ts      — BlockDefinition, ParameterDefinition, ParameterType
// types/workspace.ts   — Workspace, Column, BlockInstance, WorkspaceConfig
// types/drag.ts        — DragState, DropTarget
// types/commands.ts    — Command interface
// types/messages.ts    — WebviewMessage, HostMessage
```

This is a big advantage of your current architecture — the data model has zero DOM coupling.

---

## 3. Component Pattern: Class with DOM Element → Function Component

**Current pattern** — every component is a class that creates and owns a DOM element:

```typescript
// Vanilla TS: src/components/canvas/BlockHeader.ts
export class BlockHeader
{
  private containerEl: HTMLElement;

  constructor(definition: BlockDefinition, onDelete?: () => void, onCopy?: () => void)
  {
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'block-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'block-header__name';
    nameEl.textContent = definition.name;
    this.containerEl.appendChild(nameEl);

    this.containerEl.style.backgroundColor = definition.color;

    if (onDelete)
    {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'block-header__action';
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', onDelete);
      this.containerEl.appendChild(deleteBtn);
    }
  }

  getElement(): HTMLElement
  {
    return this.containerEl;
  }
}
```

**React equivalent:**

```tsx
// React: src/components/canvas/BlockHeader.tsx
interface BlockHeaderProps
{
  definition: BlockDefinition;
  onDelete?: () => void;
  onCopy?: () => void;
}

export function BlockHeader({ definition, onDelete, onCopy }: BlockHeaderProps): JSX.Element
{
  return (
    <div className="block-header" style={{ backgroundColor: definition.color }}>
      <span className="block-header__name">{definition.name}</span>
      {onDelete && (
        <button className="block-header__action" onClick={onDelete}>
          ✕
        </button>
      )}
      {onCopy && (
        <button className="block-header__action" onClick={onCopy}>
          ⧉
        </button>
      )}
    </div>
  );
}
```

**What changed:**
- Class → function. No `this`, no constructor.
- `getElement()` → the function's return value (JSX).
- Constructor args → a props interface.
- `document.createElement` + `appendChild` → declarative JSX.
- `addEventListener('click', fn)` → `onClick={fn}`.
- Conditional DOM creation (`if (onDelete)`) → conditional rendering (`{onDelete && ...}`).

---

## 4. Component Composition: appendChild → JSX Children

**Current pattern** — parent creates children and appends their elements:

```typescript
// Vanilla TS: CanvasBlock.ts
private render(onDelete?: () => void, onCopy?: () => void): void
{
  const header = new BlockHeader(this.definition, onDelete, onCopy);
  this.headerEl = header.getElement();
  this.containerEl.appendChild(this.headerEl);

  for (const paramDef of this.definition.parameters)
  {
    const paramEl = InlineParam.create(paramDef, initialValue, onChange);
    this.paramsContainerEl.appendChild(paramEl);
  }
  this.containerEl.appendChild(this.paramsContainerEl);
}
```

**React equivalent:**

```tsx
// React: CanvasBlock.tsx
export function CanvasBlock({ instance, definition, onDelete, onCopy, onParamChange }: CanvasBlockProps): JSX.Element
{
  return (
    <div className="canvas-block" data-instance-id={instance.id}>
      <BlockHeader definition={definition} onDelete={onDelete} onCopy={onCopy} />
      <div className="canvas-block__params">
        {definition.parameters.map((paramDef) => (
          <InlineParam
            key={paramDef.id}
            paramDef={paramDef}
            value={instance.parameterValues[paramDef.id] ?? paramDef.defaultValue}
            onChange={(value) => onParamChange?.(paramDef.id, value)}
          />
        ))}
      </div>
    </div>
  );
}
```

**What changed:**
- No `appendChild` — children are nested in JSX.
- `for` loop creating elements → `.map()` returning JSX (each needs a `key` prop).
- Parent doesn't call `getElement()` — it just uses `<ChildComponent />`.

---

## 5. Event Handling: addEventListener → JSX Props

**Current pattern:**

```typescript
// Vanilla TS
this.headerEl.addEventListener('mousedown', (e: MouseEvent) => {
  e.preventDefault();
  onDragStart(this.instance.id, e.clientX, e.clientY);
});
```

**React equivalent:**

```tsx
// React
<div
  className="block-header"
  onMouseDown={(e) => {
    e.preventDefault();
    onDragStart(instance.id, e.clientX, e.clientY);
  }}
>
```

**Document-level listeners** (like in App.ts for mousemove/mouseup during drag) use `useEffect`:

```typescript
// Vanilla TS: App.ts constructor
document.addEventListener('mousemove', (e: MouseEvent) => {
  if (this.dragManager.isDragging()) {
    this.dragManager.updateDrag(e.clientX, e.clientY);
  }
});
```

```tsx
// React: App.tsx
useEffect(() =>
{
  const handleMouseMove = (e: MouseEvent) =>
  {
    if (dragManagerRef.current.isDragging())
    {
      dragManagerRef.current.updateDrag(e.clientX, e.clientY);
    }
  };

  document.addEventListener('mousemove', handleMouseMove);
  return () => document.removeEventListener('mousemove', handleMouseMove);
}, []);
```

**Important:** The `useEffect` cleanup function (`return () => ...`) removes the listener. In vanilla TS you never cleaned up because the app lives for the page lifetime. React components can mount/unmount, so cleanup matters.

---

## 6. Callback Props: Constructor Callbacks → React Props

Your vanilla code passes callbacks through constructors, sometimes 4+ levels deep:

```typescript
// Vanilla TS: App creates WorkspaceManager, which creates CanvasBlock,
// which creates BlockHeader, which wires the delete button.
// The callback chain: App → WorkspaceManager → CanvasBlock → BlockHeader → button.onClick

const canvasBlock = new CanvasBlock(
  instance,
  definition,
  () => this.removeBlock(id),      // onDelete
  () => this.copyBlock(id),        // onCopy
  (paramId, value) => this.updateParameter(id, paramId, value),  // onParamChange
  this.onBlockDragStart ?? undefined  // onDragStart
);
```

**React equivalent** — same concept, but props instead of constructor args:

```tsx
// React: parent renders child with callback props
<CanvasBlock
  instance={instance}
  definition={definition}
  onDelete={() => dispatch({ type: 'REMOVE_BLOCK', id: instance.id })}
  onCopy={() => dispatch({ type: 'COPY_BLOCK', id: instance.id })}
  onParamChange={(paramId, value) => dispatch({ type: 'UPDATE_PARAM', id: instance.id, paramId, value })}
  onDragStart={handleDragStart}
/>
```

**For deeply nested callbacks**, React offers two escape hatches:
1. **Context** — put the dispatch function in a context so any descendant can call it without prop drilling.
2. **Event delegation** — handle events at a higher level.

```tsx
// Context approach: any component can dispatch workspace actions
const WorkspaceDispatchContext = createContext<React.Dispatch<WorkspaceAction>>(null!);

// In a deeply nested component:
function BlockHeader({ definition, instanceId }: BlockHeaderProps): JSX.Element
{
  const dispatch = useContext(WorkspaceDispatchContext);

  return (
    <div className="block-header">
      <button onClick={() => dispatch({ type: 'REMOVE_BLOCK', id: instanceId })}>
        ✕
      </button>
    </div>
  );
}
```

---

## 7. Factory/Switch Pattern → Conditional Rendering

**Current pattern** — `InlineParam` is a static factory with a switch:

```typescript
// Vanilla TS: InlineParam.ts
export class InlineParam
{
  static create(paramDef: ParameterDefinition, initialValue: unknown,
                onChange: (paramId: string, value: unknown) => void): HTMLElement
  {
    switch (paramDef.type)
    {
      case ParameterType.TEXT:
        return new TextInput(paramDef, initialValue as string, onChange).getElement();
      case ParameterType.NUMBER:
        return new NumberInput(paramDef, initialValue as number, onChange).getElement();
      case ParameterType.BOOLEAN:
        return new BooleanToggle(paramDef, initialValue as boolean, onChange).getElement();
      case ParameterType.SELECT:
        return new SelectDropdown(paramDef, initialValue as string, onChange).getElement();
      case ParameterType.COLOR:
        return new ColorPicker(paramDef, initialValue as string, onChange).getElement();
      default:
        throw new Error(`Unknown parameter type: ${paramDef.type}`);
    }
  }
}
```

**React equivalent** — the switch returns JSX instead of DOM elements:

```tsx
// React: InlineParam.tsx
interface InlineParamProps
{
  paramDef: ParameterDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function InlineParam({ paramDef, value, onChange }: InlineParamProps): JSX.Element
{
  switch (paramDef.type)
  {
    case ParameterType.TEXT:
      return <TextInput paramDef={paramDef} value={value as string} onChange={onChange} />;
    case ParameterType.NUMBER:
      return <NumberInput paramDef={paramDef} value={value as number} onChange={onChange} />;
    case ParameterType.BOOLEAN:
      return <BooleanToggle paramDef={paramDef} value={value as boolean} onChange={onChange} />;
    case ParameterType.SELECT:
      return <SelectDropdown paramDef={paramDef} value={value as string} onChange={onChange} />;
    case ParameterType.COLOR:
      return <ColorPicker paramDef={paramDef} value={value as string} onChange={onChange} />;
    default:
      throw new Error(`Unknown parameter type: ${paramDef.type}`);
  }
}
```

**What changed:** Almost nothing structurally. A static factory returning DOM elements becomes a component returning JSX. The switch logic is identical.

---

## 8. State Management: Mutable Object + Manual DOM Sync → useState/useReducer

This is the **biggest architectural change**. Currently, `WorkspaceManager` is a god object that:
1. Holds the `Workspace` state (model)
2. Mutates it directly (`column.blocks.splice(...)`)
3. Creates/destroys DOM elements in the same method
4. Tracks DOM references (`blockElements` map)
5. Calls `reflowColumn()` to update positions

In React, this splits into two concerns:

### State (useReducer)

```typescript
// React: useWorkspace.ts — pure state logic, NO DOM references

type WorkspaceAction =
  | { type: 'ADD_BLOCK'; definitionId: string; columnIndex: number; orderIndex: number }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'MOVE_BLOCK'; id: string; toColumn: number; toOrder: number }
  | { type: 'COPY_BLOCK'; id: string }
  | { type: 'UPDATE_PARAM'; id: string; paramId: string; value: unknown }
  | { type: 'LOAD_WORKSPACE'; workspace: Workspace };

function workspaceReducer(state: Workspace, action: WorkspaceAction): Workspace
{
  switch (action.type)
  {
    case 'ADD_BLOCK':
    {
      // Return a NEW state object (immutable update)
      const newColumns = state.columns.map((col, i) =>
      {
        if (i !== action.columnIndex) return col;

        const newBlocks = [...col.blocks];
        const instance: BlockInstance = {
          id: generateId(),
          definitionId: action.definitionId,
          columnIndex: action.columnIndex,
          orderIndex: action.orderIndex,
          parameterValues: getDefaultParams(action.definitionId),
        };
        newBlocks.splice(action.orderIndex, 0, instance);

        // Re-index
        return {
          ...col,
          blocks: newBlocks.map((b, idx) => ({ ...b, orderIndex: idx })),
        };
      });

      return { ...state, columns: newColumns };
    }

    case 'REMOVE_BLOCK':
    {
      const newColumns = state.columns.map((col) =>
      {
        const idx = col.blocks.findIndex(b => b.id === action.id);
        if (idx === -1) return col;

        const newBlocks = col.blocks.filter(b => b.id !== action.id);
        return {
          ...col,
          blocks: newBlocks.map((b, i) => ({ ...b, orderIndex: i })),
        };
      });

      return { ...state, columns: newColumns };
    }

    // ... other cases follow the same immutable pattern
  }
}
```

### Rendering (automatic)

```tsx
// React: CanvasPanel.tsx — rendering is driven by state, not imperative calls

function CanvasPanel(): JSX.Element
{
  const { workspace, dispatch } = useWorkspaceContext();
  const registry = useBlockRegistry();

  return (
    <div className="canvas-panel">
      {workspace.columns.map((column) => (
        <CanvasColumn key={column.index} column={column}>
          {column.blocks.map((block) => (
            <CanvasBlock
              key={block.id}
              instance={block}
              definition={registry.get(block.definitionId)}
              style={{ top: calculateBlockY(block.orderIndex, column, workspace.config) }}
              onDelete={() => dispatch({ type: 'REMOVE_BLOCK', id: block.id })}
            />
          ))}
        </CanvasColumn>
      ))}
    </div>
  );
}
```

**The key insight:** `reflowColumn()` disappears entirely. Block positions are *computed from state* during render, not imperatively set after mutations. The `blockElements` map disappears too — React manages the DOM elements.

### Comparison: addBlock flow

```
VANILLA TS:
  addBlock() → mutate model → create <div> → appendChild → reflowColumn → emit event

REACT:
  dispatch({ type: 'ADD_BLOCK', ... }) → reducer returns new state → React re-renders
  → CanvasBlock component renders with calculated position → DOM updated automatically
```

---

## 9. EventBus → React Context + useReducer

**Current pattern** — `EventBus` decouples services:

```typescript
// Vanilla TS: EventBus.ts
export class EventBus
{
  private listeners: Map<string, Set<Function>>;

  on(event: string, callback: Function): void { ... }
  off(event: string, callback: Function): void { ... }
  emit(event: string, ...args: unknown[]): void { ... }
}

// Usage:
events.on('workspace:changed', () => {
  hostBridge.sendState(workspaceManager.getWorkspace());
});
```

**React equivalent** — Context replaces pub/sub for UI state; effects replace event listeners:

```tsx
// React: WorkspaceContext.tsx
const WorkspaceContext = createContext<{
  workspace: Workspace;
  dispatch: React.Dispatch<WorkspaceAction>;
}>(null!);

export function WorkspaceProvider({ children }: { children: React.ReactNode }): JSX.Element
{
  const [workspace, dispatch] = useReducer(workspaceReducer, initialWorkspace);

  return (
    <WorkspaceContext.Provider value={{ workspace, dispatch }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// Any component can read state and dispatch actions:
function SomeDeepComponent(): JSX.Element
{
  const { workspace, dispatch } = useContext(WorkspaceContext);
  // ...
}
```

**For the `workspace:changed` → save flow**, use `useEffect`:

```tsx
// React: replaces events.on('workspace:changed', ...)
function AutoSave(): JSX.Element
{
  const { workspace } = useWorkspaceContext();
  const hostBridge = useHostBridge();

  useEffect(() =>
  {
    hostBridge.sendState(workspace);
  }, [workspace]); // Runs whenever workspace state changes

  return null; // This component renders nothing — it's pure side-effect
}
```

**When you still want EventBus:** For non-UI events (e.g., drag start/end coordination between unrelated systems), an EventBus can still be useful in React. Wrap it in a ref or context. But most of your current events (`workspace:changed`, `command:stateChanged`) become unnecessary because React's re-rendering handles them.

---

## 10. Service Singletons → Custom Hooks and Context

Your services fall into two categories:

### Pure logic services (keep as classes or plain functions)

These have no DOM coupling and can stay exactly as they are:

```typescript
// These classes port unchanged — they're already framework-agnostic:
// - LayoutEngine (pure math)
// - SerializationService (pure data transform)
// - BlockRegistry (read-only data store)

// Provide them via Context:
const LayoutEngineContext = createContext<LayoutEngine>(null!);
const RegistryContext = createContext<BlockRegistry>(null!);

// Consume via custom hooks:
function useLayoutEngine(): LayoutEngine
{
  return useContext(LayoutEngineContext);
}
```

### Stateful services (absorb into React state)

```typescript
// WorkspaceManager → useReducer (state logic moves into reducer)
// CommandManager   → useReducer with undo/redo middleware
// EventBus         → React context + useEffect (mostly eliminated)
// DragManager      → useRef + event handlers (see Section 13)
```

### Wiring it all together

**Current pattern** — imperative wiring in `App.ts` constructor:

```typescript
// Vanilla TS: App.ts
const layoutEngine = new LayoutEngine(registry);
const workspaceManager = new WorkspaceManager(config, registry, layoutEngine, events);
this.dragManager = new DragManager(layoutEngine, workspaceManager, registry);
workspaceManager.registerBlockDragHandler((id, x, y) => {
  this.dragManager.startCanvasDrag(id, x, y);
});
```

**React equivalent** — Context providers nest to form the dependency tree:

```tsx
// React: App.tsx
export function App(): JSX.Element
{
  return (
    <RegistryProvider>
      <WorkspaceProvider>
        <DragProvider>
          <div className="app">
            <BlockPalette />
            <CanvasPanel />
            <DragGhost />
          </div>
        </DragProvider>
      </WorkspaceProvider>
    </RegistryProvider>
  );
}
```

---

## 11. DOM Element Registration → useRef

**Current pattern** — manual element tracking maps:

```typescript
// Vanilla TS: WorkspaceManager
private blockElements: Map<string, HTMLElement>;
private columnElements: Map<number, HTMLElement>;

registerBlockElement(instanceId: string, el: HTMLElement): void
{
  this.blockElements.set(instanceId, el);
}
```

**React equivalent** — `useRef` for individual elements, callback refs for dynamic collections:

```tsx
// React: single element ref
function DragGhost(): JSX.Element
{
  const ghostRef = useRef<HTMLDivElement>(null);
  // ghostRef.current gives you the DOM element when you need it

  return <div ref={ghostRef} className="drag-ghost" />;
}

// React: dynamic collection of refs (for block elements keyed by ID)
function CanvasColumn({ column }: { column: Column }): JSX.Element
{
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());

  return (
    <div className="canvas-column">
      {column.blocks.map((block) => (
        <div
          key={block.id}
          ref={(el) =>
          {
            if (el) blockRefs.current.set(block.id, el);
            else blockRefs.current.delete(block.id);
          }}
          className="canvas-block"
        >
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

**Key difference:** In vanilla TS you explicitly register/unregister. In React, callback refs handle this automatically — the callback fires with the element on mount and `null` on unmount.

---

## 12. CSS Transforms & Positioning → Style Props + Refs

**Current pattern** — direct style mutation after model changes:

```typescript
// Vanilla TS: WorkspaceManager.reflowColumn()
private reflowColumn(columnIndex: number): void
{
  const column = this.workspace.columns[columnIndex];
  for (const block of column.blocks)
  {
    const y = this.layoutEngine.calculateBlockY(block.orderIndex, column, this.workspace.config);
    const el = this.blockElements.get(block.id);
    if (el)
    {
      el.style.top = `${y}px`;
    }
  }
}
```

**React equivalent** — compute position during render, pass as style prop:

```tsx
// React: position is a computed value, not an imperative mutation
function CanvasBlock({ instance, column, config }: CanvasBlockProps): JSX.Element
{
  const layoutEngine = useLayoutEngine();
  const y = layoutEngine.calculateBlockY(instance.orderIndex, column, config);

  return (
    <div
      className="canvas-block"
      style={{ position: 'absolute', top: y }}
    >
      {/* ... */}
    </div>
  );
}
```

**`reflowColumn()` is deleted.** It's replaced by the fact that every render computes positions from current state.

---

## 13. Drag & Drop: The Performance-Critical Case

This is the one area where you'll need to **bypass React's normal flow** for performance. Your current approach is already optimal: direct DOM manipulation during drag, model update on drop. In React, you reproduce this pattern using refs.

**Current pattern:**

```typescript
// Vanilla TS: DragManager — direct DOM updates on every mousemove
updateDrag(mouseX: number, mouseY: number): void
{
  this.dragState.mouseX = mouseX;
  this.dragState.mouseY = mouseY;

  // Move ghost (direct DOM, no state update, no re-render)
  this.ghostEl.style.transform = `translate(${mouseX - offsetX}px, ${mouseY - offsetY}px)`;

  // Calculate drop target
  const target = this.layoutEngine.getDropTarget(mouseX, mouseY, workspace);
  this.dropIndicatorEl.style.transform = `translateY(${target.indicatorY}px)`;
}
```

**React equivalent** — refs for the hot path, state only on drop:

```tsx
// React: useDrag.ts
export function useDrag(layoutEngine: LayoutEngine, workspace: Workspace)
{
  // Refs for performance-critical elements (no re-renders on update)
  const ghostRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // This ref map gives us direct DOM access to block elements
  const blockRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  const updateDrag = useCallback((mouseX: number, mouseY: number) =>
  {
    const state = dragStateRef.current;
    if (!state) return;

    // Direct DOM manipulation — same as vanilla TS, bypasses React
    if (ghostRef.current)
    {
      ghostRef.current.style.transform =
        `translate(${mouseX - state.offsetX}px, ${mouseY - state.offsetY}px)`;
    }

    const target = layoutEngine.getDropTarget(mouseX, mouseY, workspace);
    if (indicatorRef.current)
    {
      indicatorRef.current.style.transform = `translateY(${target.indicatorY}px)`;
    }

    dragStateRef.current = { ...state, mouseX, mouseY, currentDropTarget: target };
  }, [layoutEngine, workspace]);

  const endDrag = useCallback(() =>
  {
    const state = dragStateRef.current;
    if (!state?.currentDropTarget) return;

    // NOW we update React state — this is the only point that triggers a re-render
    dispatch({
      type: state.source === 'palette' ? 'ADD_BLOCK' : 'MOVE_BLOCK',
      ...state.currentDropTarget,
    });

    dragStateRef.current = null;
  }, [dispatch]);

  // Document-level listeners
  useEffect(() =>
  {
    const onMouseMove = (e: MouseEvent) => updateDrag(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () =>
    {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateDrag, endDrag]);

  return { ghostRef, indicatorRef, blockRefsMap, startPaletteDrag, startCanvasDrag };
}
```

**The pattern:** `useRef` for anything that changes on every mousemove. `useState`/`dispatch` only on drop. This avoids re-rendering 60 times per second during a drag.

**Alternative:** Consider a library like `@dnd-kit/core` or `react-dnd`. They handle the ref management, accessibility, and edge cases for you. But if you want maximum control and learning, the manual ref approach above maps most directly to your current code.

---

## 14. HostBridge: Environment Detection → Custom Hook

**Current pattern:**

```typescript
// Vanilla TS: index.ts
function createHostBridge(serializer: SerializationService, registry: BlockRegistry): HostBridge
{
  if (typeof acquireVsCodeApi === 'function')
  {
    return new VSCodeHostBridge(serializer, registry);
  }
  return new WebHostBridge(serializer, registry);
}
```

**React equivalent** — the classes stay, but they're provided via a hook:

```tsx
// React: useHostBridge.ts
const HostBridgeContext = createContext<HostBridge>(null!);

export function HostBridgeProvider({ children }: { children: React.ReactNode }): JSX.Element
{
  const serializer = useMemo(() => new SerializationService(), []);
  const registry = useBlockRegistry();

  const bridge = useMemo(() =>
  {
    if (typeof acquireVsCodeApi === 'function')
    {
      return new VSCodeHostBridge(serializer, registry);
    }
    return new WebHostBridge(serializer, registry);
  }, [serializer, registry]);

  return (
    <HostBridgeContext.Provider value={bridge}>
      {children}
    </HostBridgeContext.Provider>
  );
}

export function useHostBridge(): HostBridge
{
  return useContext(HostBridgeContext);
}
```

**The bridge classes themselves** (`WebHostBridge`, `VSCodeHostBridge`) can stay almost unchanged. They don't do DOM manipulation — they do `postMessage`/`localStorage`, which is framework-agnostic.

The `onLoadState` callback wiring becomes a `useEffect`:

```tsx
// React: replaces the callback wiring in App.ts constructor
function WorkspaceLoader(): JSX.Element
{
  const bridge = useHostBridge();
  const { dispatch } = useWorkspaceContext();

  useEffect(() =>
  {
    bridge.onLoadState((workspace) =>
    {
      dispatch({ type: 'LOAD_WORKSPACE', workspace });
    });
    bridge.requestLoad();
  }, [bridge, dispatch]);

  return null;
}
```

---

## 15. Command Pattern (Undo/Redo) → useReducer with History

**Current pattern** — `CommandManager` wraps every mutation in a Command object:

```typescript
// Vanilla TS: CommandManager holds undo/redo stacks of Command objects
// Each Command has execute() and undo() methods that directly mutate
// WorkspaceManager state and DOM
```

**React approach** — the reducer IS the command pattern. Each action is a command. History is a wrapper around the reducer:

```typescript
// React: useUndoReducer.ts
interface UndoState<S>
{
  past: S[];
  present: S;
  future: S[];
}

function useUndoReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
): [S, React.Dispatch<A | UndoAction>]
{
  const undoReducer = (state: UndoState<S>, action: A | UndoAction): UndoState<S> =>
  {
    if (action === 'UNDO')
    {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    if (action === 'REDO')
    {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }

    // Normal action — apply reducer, push to history
    const newPresent = reducer(state.present, action as A);
    if (newPresent === state.present) return state; // No change

    return {
      past: [...state.past, state.present],
      present: newPresent,
      future: [], // Clear redo stack on new action
    };
  };

  const [state, dispatch] = useReducer(undoReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  return [state.present, dispatch];
}
```

**What changed:**
- No `Command` objects with paired `execute()`/`undo()` methods.
- Instead, the entire state is snapshotted. Undo = restore previous snapshot.
- This is simpler but uses more memory. For a block editor with < 1000 blocks, this is fine.
- The `CommandManager` class is deleted entirely.

**Trade-off:** Your current command pattern is more memory-efficient (stores deltas, not snapshots). If you want to keep that approach in React, you can — just store Command objects in a ref alongside the reducer. But the snapshot approach is the idiomatic React way and is simpler to implement.

---

## 16. Full Component Mapping Table

| Vanilla TS File | React Equivalent | Notes |
|---|---|---|
| `App.ts` | `App.tsx` | Class → function component + context providers |
| `BlockPalette.ts` | `BlockPalette.tsx` | Direct port, DOM loops → `.map()` |
| `CategoryGroup.ts` | `CategoryGroup.tsx` | Direct port |
| `PaletteBlock.ts` | `PaletteBlock.tsx` | Direct port |
| `CanvasPanel.ts` | `CanvasPanel.tsx` | Direct port, column loop → `.map()` |
| `CanvasColumn.ts` | `CanvasColumn.tsx` | Direct port |
| `CanvasBlock.ts` | `CanvasBlock.tsx` | Direct port, callback props |
| `BlockHeader.ts` | `BlockHeader.tsx` | Direct port |
| `InlineParam.ts` | `InlineParam.tsx` | Factory → switch component |
| `TextInput.ts` | `TextInput.tsx` | Controlled input pattern |
| `NumberInput.ts` | `NumberInput.tsx` | Controlled input pattern |
| `BooleanToggle.ts` | `BooleanToggle.tsx` | Controlled input pattern |
| `SelectDropdown.ts` | `SelectDropdown.tsx` | Controlled input pattern |
| `ColorPicker.ts` | `ColorPicker.tsx` | Controlled input pattern |
| `DragGhost.ts` | `DragGhost.tsx` | Ref-driven, not state-driven |
| `DropIndicator.ts` | `DropIndicator.tsx` | Ref-driven, not state-driven |
| **Services** | | |
| `WorkspaceManager.ts` | `useWorkspace.ts` (reducer + context) | Biggest refactor — state + DOM split |
| `BlockRegistry.ts` | `BlockRegistry.ts` + context | Class stays, wrap in provider |
| `LayoutEngine.ts` | `LayoutEngine.ts` + context | Class stays unchanged |
| `DragManager.ts` | `useDrag.ts` (custom hook with refs) | Ref-heavy for performance |
| `CommandManager.ts` | `useUndoReducer.ts` | Replaced by undo wrapper |
| `EventBus.ts` | Mostly eliminated | Context + useEffect replaces it |
| `SerializationService.ts` | `SerializationService.ts` | Unchanged |
| `HostBridge.ts` | `HostBridge.ts` + context | Interface unchanged |
| `WebHostBridge.ts` | `WebHostBridge.ts` | Unchanged |
| `VSCodeHostBridge.ts` | `VSCodeHostBridge.ts` | Unchanged |

---

## 17. Recommended Migration Order

Port bottom-up, validating at each step:

### Phase 1: Project Setup
- Add React + ReactDOM + `@types/react` + `@types/react-dom`
- Configure esbuild for JSX (`jsx: 'react-jsx'`)
- Update tsconfig for JSX
- Create a minimal `App.tsx` that renders "Hello" to verify the pipeline works in both standalone and VS Code webview

### Phase 2: Types + Pure Services (zero risk)
- Copy `src/types/` unchanged
- Copy `LayoutEngine`, `SerializationService`, `BlockRegistry` unchanged
- Copy `HostBridge` interfaces and implementations unchanged
- Write tests to verify they still pass

### Phase 3: Leaf Components (simple, high confidence)
- Port `BlockHeader` → function component
- Port all param inputs (`TextInput`, `NumberInput`, etc.) → controlled components
- Port `InlineParam` factory → switch component
- Port `DragGhost`, `DropIndicator` → ref-forwarding components
- Unit test each in isolation with React Testing Library

### Phase 4: State Management (the core refactor)
- Build `workspaceReducer` with all action types
- Build `useUndoReducer` wrapper
- Build `WorkspaceContext` provider
- Test the reducer in isolation (pure function, easy to test)

### Phase 5: Container Components
- Port `CanvasBlock` using `WorkspaceContext`
- Port `CanvasColumn`
- Port `CanvasPanel`
- Port `PaletteBlock`, `CategoryGroup`, `BlockPalette`
- Integration test: blocks render, params edit, delete/copy work

### Phase 6: Drag & Drop (hardest part)
- Build `useDrag` hook with ref-based DOM manipulation
- Wire ghost + indicator refs
- Wire document-level mouse listeners
- Test palette → canvas drag
- Test canvas → canvas move
- Test Escape to cancel

### Phase 7: Host Bridge Integration
- Wire `HostBridgeProvider`
- Wire auto-save via `useEffect`
- Wire load-state on mount
- Test in both standalone and VS Code webview

### Phase 8: Cleanup
- Remove all vanilla TS component files
- Remove `EventBus` if fully replaced
- Remove `WorkspaceManager` DOM methods
- Final integration tests
- Verify VS Code extension still works with new bundle
