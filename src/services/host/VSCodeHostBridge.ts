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
    private lastWorkspace: Workspace | null;
    private loadCallback: ((workspace: Workspace) => void) | null;

    /**
     * 1. Calls `acquireVsCodeApi()` and stores the result in `vscodeApi`.
     *    (This function can only be called once per webview session — VS Code enforces this.)
     * 2. Stores `serializer` and `registry` references.
     * 3. Sets `loadCallback = null`.
     * 4. Calls `setupMessageListener()` to start listening for messages from the extension host.
     */
    constructor(serializer: SerializationService, registry: BlockRegistry)
    {
        this.vscodeApi = acquireVsCodeApi();
        this.serializer = serializer;
        this.registry = registry;
        this.lastWorkspace = null;
        this.loadCallback = null;
        this.setupMessageListener();
    }

    /**
     * 1. Serializes the workspace via `serializer.serialize()`.
     * 2. Calls `vscodeApi.postMessage({ type: 'save', payload: json })` to send to the extension host.
     * 3. Also calls `vscodeApi.setState(json)` to persist in webview state (survives tab switches).
     */
    sendState(workspace: Workspace): void
    { 
        this.lastWorkspace = workspace;
        const workspaceJson = this.serializer.serialize(workspace);
        this.vscodeApi.postMessage({ type: 'save', payload: workspaceJson });
        this.vscodeApi.setState(workspaceJson);
    }

    /** Stores the callback for later use when a `'load'` message arrives. */
    onLoadState(callback: (workspace: Workspace) => void): void
    { 
        this.loadCallback = callback;
    }

    /** Calls `vscodeApi.postMessage({ type: 'ready' })` to signal the extension that the webview is ready to receive data. */
    requestSave(): void
    { 
        this.vscodeApi.postMessage({ type: 'ready' });
    }

    /**
     * 1. First checks `vscodeApi.getState()` for previously persisted state.
     *    If found, deserializes and calls `loadCallback`.
     * 2. If no state, sends a `{ type: 'ready' }` message to the extension host,
     *    which should respond with a `'load'` message handled by `setupMessageListener`.
     */
    requestLoad(): void
    { 
        const workspaceJson = this.vscodeApi.getState();
        if(workspaceJson)
        {
            const workspace = this.serializer.deserialize(workspaceJson as string, this.registry);
            this.lastWorkspace = workspace;
            this.loadCallback?.(workspace);
        }
        else
        {
            this.requestSave();
        }
    }

    /**
     * Adds a `window.addEventListener('message', ...)` listener.
     * When a message with `event.data.type === 'load'` arrives:
     * 1. Deserializes `event.data.payload` via `serializer.deserialize(payload, registry)`.
     * 2. Calls `loadCallback(workspace)` if registered.
     * When a message with `event.data.type === 'config'` arrives:
     * handles config updates (future use).
     */
    private setupMessageListener(): void
    { 
        window.addEventListener('message', (event) =>
        {
            if(event.data.type === 'load')
            {
                const workspace = this.serializer.deserialize(event.data.payload, this.registry);
                this.loadCallback?.(workspace);
            }
            else if(event.data.type === 'config')
            {
                // Future use: handle config updates from extension host
            }
        });
    }
}