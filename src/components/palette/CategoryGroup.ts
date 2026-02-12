import { BlockDefinition } from "../../types/blocks";
import { PaletteBlock } from "./PaletteBlock";

export class CategoryGroup
{
    private containerEl: HTMLElement;
    private headerEl: HTMLElement;
    private blockListEl: HTMLElement;
    private collapsed: boolean = false;
    private blocks: PaletteBlock[];

    constructor(categoryGroup: string, definitions: BlockDefinition[])
    {
        this.containerEl = document.createElement('div');
        this.containerEl.className = 'category-group';
        
        this.headerEl = document.createElement('h2');
        this.headerEl.textContent = categoryGroup;
        this.headerEl.style.cursor = 'pointer';
        this.headerEl.addEventListener('click', () => this.toggle());

        this.blockListEl = document.createElement('ul');
        this.blockListEl.className = 'block-list';

        this.blocks = definitions.map(def => new PaletteBlock(def));

        this.blocks.forEach((pb, _) =>
        {
            const li = document.createElement('li');
            li.appendChild(pb.getElement());
            this.blockListEl.appendChild(li);
        })

        this.containerEl.appendChild(this.headerEl);
        this.containerEl.appendChild(this.blockListEl);
    }

    toggle(): void
    {
        this.collapsed = !this.collapsed;
        this.blockListEl.style.display = this.collapsed ? 'none' : 'block';
    }

    getElement(): HTMLElement
    {
        return this.containerEl;
    }
}