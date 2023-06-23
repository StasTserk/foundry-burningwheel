import { BWItemSheet } from "./bwItemSheet";

export class PossessionSheet extends BWItemSheet {
    get template(): string {
        return "systems/burningwheel/templates/items/possession.hbs";
    }
}
