import { BWItemSheet } from "./bwItemSheet.js";

export class AffiliationSheet extends BWItemSheet {
    get template(): string {
        return "systems/burningwheel/templates/items/affiliation.hbs";
    }
}
