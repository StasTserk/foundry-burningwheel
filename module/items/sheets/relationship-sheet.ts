export class RelationshipSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    get template() {
        return "systems/burningwheel/templates/items/relationship.html";
    }
}