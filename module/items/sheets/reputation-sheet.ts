import { BWItemSheet } from "./bwItemSheet.js";

export class ReputationSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/reputation.hbs";
    }
}
