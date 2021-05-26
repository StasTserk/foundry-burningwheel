import { BWItemSheet } from "./bwItemSheet.js";

export class RelationshipSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/relationship.hbs";
    }
}
