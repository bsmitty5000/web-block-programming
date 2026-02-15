import { BlockRegistry } from "../../services/BlockRegistry";
import { EventBus } from "../../services/EventBus";
import { CategoryGroup } from "./CategoryGroup";

export class BlockPalette
{
    private containerEl: HTMLElement;
    private registry: BlockRegistry;
    private categoryGroups: CategoryGroup[] = [];
    private onDragStart?: (definitionId: string, mouseX: number, mouseY: number) => void;

    constructor(
        container: HTMLElement,
        registry: BlockRegistry,
        events: EventBus,
        onDragStart?: (definitionId: string, mouseX: number, mouseY: number) => void
    )
    {
        this.containerEl = container;
        this.registry = registry;
        this.onDragStart = onDragStart;

        this.buildCategories();
        this.render();

        events.on('registry:loaded', () =>
        {
            this.rebuild();
        });
    }

    private buildCategories(): void
    {
        this.categoryGroups = [];
        const categories = this.registry.getCategories();

        categories.forEach((category, _) =>
        {
            this.categoryGroups.push(
                new CategoryGroup(category, this.registry.getByCategory(category), this.onDragStart)
            );
        });
    }

    private rebuild(): void
    {
        this.containerEl.innerHTML = '';
        this.buildCategories();
        this.render();
    }

    render(): void
    {
        this.categoryGroups.forEach((cg, _) =>
        {
            this.containerEl.appendChild(cg.getElement());
        });
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}
