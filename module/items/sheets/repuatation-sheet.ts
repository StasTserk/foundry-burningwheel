export class ReputationSheet extends ItemSheet {
    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/reputation.html";
    }
}
