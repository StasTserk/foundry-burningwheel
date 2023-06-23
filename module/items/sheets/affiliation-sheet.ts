import { BWItemSheet } from "./bwItemSheet";

export class AffiliationSheet extends BWItemSheet {
    get template(): string {
        return "systems/burningwheel/templates/items/affiliation.hbs";
    }
}
