import { ActorSheetOptions } from './BWActorSheet';
import { BWCharacterSheet } from './BWCharacterSheet';

export class BWCharacterTabbedSheet extends BWCharacterSheet {
    get template(): string {
        const path = 'systems/burningwheel/templates';
        return `${path}/${this.actor.type}-tabbed-sheet.hbs`;
    }

    static get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;

        options.tabs = [
            {
                navSelector: '.tabs',
                contentSelector: '.content',
                initial: 'BITs',
            },
        ];

        return options;
    }
}
