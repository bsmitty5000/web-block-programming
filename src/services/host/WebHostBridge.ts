import { Workspace } from '../../types/workspace';
import { HostBridge } from './HostBridge';
import { SerializationService } from '../SerializationService';
import { BlockRegistry } from '../BlockRegistry';

export class WebHostBridge implements HostBridge {
    private static STORAGE_KEY = 'block-programming-workspace';
    private serializer: SerializationService;
    private registry: BlockRegistry;
    private loadCallback: ((workspace: Workspace) => void) | null;
    private lastWorkspace: Workspace | null;

    /**
     * Stores `serializer` and `registry` references. Sets `loadCallback = null`.
     */
    constructor(serializer: SerializationService, registry: BlockRegistry)
    {
        this.serializer = serializer;
        this.registry = registry;
        this.loadCallback = null;
        this.lastWorkspace = null;
    }

    /**
     * Serializes the workspace via `serializer.serialize()` and writes the
     * JSON string to `localStorage` under `STORAGE_KEY`.
     */
    sendState(workspace: Workspace): void
    {
        this.lastWorkspace = workspace;
        const workspaceJson = this.serializer.serialize(workspace);
        localStorage.setItem(WebHostBridge.STORAGE_KEY, workspaceJson);
    }

    /** Stores the callback for later use by `requestLoad()`. */
    onLoadState(callback: (workspace: Workspace) => void): void
    { 
        this.loadCallback = callback;
    }

    /** Delegates to `sendState()` (in the web environment, save is immediate). */
    requestSave(): void
    {
        if (this.lastWorkspace)
        {
            this.sendState(this.lastWorkspace);
        }
    }

    /**
     * Reads `localStorage.getItem(STORAGE_KEY)`. If a value exists, deserializes it
     * via `serializer.deserialize(json, registry)` and calls `loadCallback(workspace)`.
     * If no saved state exists, does nothing (app starts with empty workspace).
     */
    requestLoad(): void
    { 
        const json = localStorage.getItem(WebHostBridge.STORAGE_KEY);
        if(json)
        {
            const workspace = this.serializer.deserialize(json, this.registry);
            this.loadCallback?.(workspace);
        }
    }
}