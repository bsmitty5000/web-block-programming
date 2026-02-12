import { BlockRegistry } from "../../services/BlockRegistry";
import { CategoryGroup } from "./CategoryGroup";

export class BlockPalette
{
    private containerEl: HTMLElement;
    private registry: BlockRegistry;
    private categoryGroups: CategoryGroup[] = [];

    constructor(container: HTMLElement, registry: BlockRegistry)
    {
        this.containerEl = container;
        this.registry = registry;
        const categories = registry.getCategories();

        categories.forEach((category, _) =>
        {
            this.categoryGroups.push(new CategoryGroup(category, this.registry.getByCategory(category)));
        })

        this.render();
    }

    render(): void
    {
        this.categoryGroups.forEach((cg, _) =>
        {
            this.containerEl.appendChild(cg.getElement());
        })
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}