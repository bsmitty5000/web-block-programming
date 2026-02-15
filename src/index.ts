declare const acquireVsCodeApi: unknown;

import './styles/index.css';
import { App } from './components/App';
import { BlockDefinitionConfig } from './types/blocks';
export { BlockDefinitionConfig } from './types/blocks';
export { WebviewMessage, HostMessage } from './types/messages';
import { SerializationService } from './services/SerializationService';
import { BlockRegistry } from './services/BlockRegistry';
import { EventBus } from './services/EventBus';
import { HostBridge } from './services/host/HostBridge';
import { WebHostBridge } from './services/host/WebHostBridge';
import { VSCodeHostBridge } from './services/host/VSCodeHostBridge';

import blocksData from './config/blocks.json';
const sampleBlocks = blocksData as BlockDefinitionConfig;

export function init(container: HTMLElement, registry: BlockRegistry, events: EventBus, hostBridge: HostBridge | null): App {
  return new App(container, registry, events, hostBridge);
}

function createHostBridge(serializer: SerializationService, registry: BlockRegistry): HostBridge {
  if (typeof acquireVsCodeApi === 'function') {
    return new VSCodeHostBridge(serializer, registry);
  }
  return new WebHostBridge(serializer, registry);
}

const appEl = document.getElementById('app');
if (appEl) {
  const events = new EventBus();
  const registry = new BlockRegistry(events);

  const hostBridge = createHostBridge(new SerializationService(), registry);

  if(hostBridge instanceof WebHostBridge)
  {
    registry.loadFromConfig(sampleBlocks);
  }

  init(appEl, registry, events, hostBridge);
}
