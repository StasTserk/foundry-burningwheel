
import { ActorSheetOptions } from "./BWActorSheet.js";
import { BWCharacterSheet } from "./BWCharacterSheet.js";

export class BWCharacterTabbedSheet extends BWCharacterSheet {
    get template(): string {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-tabbed-sheet.hbs`;
    }
    
    static get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;

        options.tabs = [
            {navSelector: ".tabs", contentSelector: ".content", initial: "BITs"}
        ];
        
        return options;
    }
}