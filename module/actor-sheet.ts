import { BWActor } from "./actor.js";
import { Belief } from "./items/belief.js";

export class BWActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    /** @override */
    get template() {
        const path = "systems/burningwheel/templates";
        return `${path}/${this.actor.data.type}-sheet.html`;
    }

    getData(): ActorSheetData {
        const data = super.getData() as CharacterSheetData;
        const actorData = data.actor as BWActor;
        const beliefs = [];
        const instincts = [];
        const traits = [];
        const items = data.items;

        for (const i of items) {
            const item = i.data;
            switch(i.type) {
                case "belief": beliefs.push(i as Belief); break;
                case "instinct": instincts.push(i); break;
                case "traits": traits.push(i); break;
            }
        }

        if (beliefs.length === 0) {
            console.log("adding default beliefs");
            beliefs.push(
                Item.createOwned({ name: "Belief 1", type: "belief", data: { fate: true }}, actorData) as Belief,
                Item.createOwned({ name: "Belief 2", type: "belief", data: {}}, actorData) as Belief,
                Item.createOwned({ name: "Belief 3", type: "belief", data: {}}, actorData) as Belief);
        }

        data.beliefs = beliefs;
        return data;
    }

    activateListeners(html: JQuery) {
        html.find("input.belief-f").change((e) => this._updateItem(e, ".belief", "data.fate"));
        html.find("input.belief-p").change((e) => this._updateItem(e, ".belief", "data.persona"));
        html.find("input.belief-d").change((e) => this._updateItem(e, ".belief", "data.deeds"));
        html.find("input.belief-t").change((e) => this._updateItem(e, ".belief", "data.text"));
        super.activateListeners(html);
    }

    _updateItem(e: JQuery.ChangeEvent, parentSelector: string, itemProperty: string): any {
        e.preventDefault();
        const itemId = $(e.currentTarget).closest(parentSelector).data("itemId");
        const item = this.actor.getOwnedItem(itemId);
        const value = $(e.target).val();
        const updateParams = {};
        updateParams[itemProperty] = value;
        return item.update(updateParams, {});
    }
}

interface CharacterSheetData extends ActorSheetData {
    beliefs: Belief[];
}