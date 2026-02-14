type EventCallback = (...args: unknown[]) => void;

export class EventBus
{
    private listeners: Map<string, Set<EventCallback>>;

    constructor()
    {
        this.listeners = new Map();
    }

    on(event: string, callback: EventCallback): void
    {
        const eventListeners = this.listeners.get(event) ?? new Set();
        eventListeners.add(callback);
        this.listeners.set(event, eventListeners);
    }

    off(event: string, callback: EventCallback): void
    {
        const eventListeners = this.listeners.get(event);
        if(eventListeners)
        {
            eventListeners.delete(callback);
        }
    }

    emit(event: string, ...args: unknown[]): void
    {
        const eventListeners = this.listeners.get(event);
        if(eventListeners)
        {
            /* make a copy to prevent modification while iterating */
            Array.from(eventListeners).forEach(cb => 
            {
                cb(...args);
            });
        }
    }
}