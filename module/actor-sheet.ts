import { Belief } from "./items/belief.js";
import { Instinct } from "./items/instinct.js";
import { Trait } from "./items/trait.js";

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
        const beliefs = [];
        const instincts = [];
        const traits: Trait[] = [];
        const items = data.items;

        for (const i of items) {
            switch(i.type) {
                case "belief": beliefs.push(i as Belief); break;
                case "instinct": instincts.push(i as Instinct); break;
                case "trait": traits.push(i as Trait); break;
            }
        }

        if (beliefs.length === 0 && instincts.length === 0) {
            console.log("adding default beliefs");
            this.addDefaultItems();
        }

        data.beliefs = beliefs;
        data.instincts = instincts;

        const traitLists = { character: [], die: [], callon: [] } as CharacterSheetTraits;

        if (traits.length !== 0) {
            traits.forEach((trait) => {
                switch (trait.data.traittype) {
                    case "character": traitLists.character.push(trait); break;
                    case "die": traitLists.die.push(trait); break;
                    default: traitLists.callon.push(trait); break;
                }
            });
        }
        data.traits = traitLists;
        return data;
    }

    activateListeners(html: JQuery) {
        html.find("input.belief-f").change((e) => this._updateItem(e, ".belief", "data.fate"));
        html.find("input.belief-p").change((e) => this._updateItem(e, ".belief", "data.persona"));
        html.find("input.belief-d").change((e) => this._updateItem(e, ".belief", "data.deeds"));
        html.find("input.belief-t").change((e) => this._updateItem(e, ".belief", "data.text"));
        html.find("input.instinct-f").change((e) => this._updateItem(e, ".instinct", "data.fate"));
        html.find("input.instinct-p").change((e) => this._updateItem(e, ".instinct", "data.persona"));
        html.find("input.instinct-d").change((e) => this._updateItem(e, ".instinct", "data.deeds"));
        html.find("input.instinct-t").change((e) => this._updateItem(e, ".instinct", "data.text"));

        // add/delete buttons
        html.find(".trait-category i").click((e) => this._manageTraits(e));
        super.activateListeners(html);
    }
    async _manageTraits(e:  JQuery.ClickEvent) {
        e.preventDefault();
        const t = event.currentTarget;
        const action = $(t).data("action");
        const id = $(t).data("id") as string;
        let options = {};
        switch (action) {
            case "addTrait":
                options = { name: `New ${id.titleCase()} Trait`, type: "trait", data: { traittype: id }};
                return this.actor.createOwnedItem(options)
            case "delTrait":
                return this.actor.deleteOwnedItem(id);

        }
        return null;
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

    async addDefaultItems() {
        return this.actor.createOwnedItem({ name: "Instinct 1", type: "instinct", data: {}})
            .then(() => this.actor.createOwnedItem({ name: "Instinct 2", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Instinct 3", type: "instinct", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 1", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 2", type: "belief", data: {}}))
            .then(() => this.actor.createOwnedItem({ name: "Belief 3", type: "belief", data: {}}))
    }
}

interface CharacterSheetData extends ActorSheetData {
    beliefs: Belief[];
    instincts: Instinct[];
    traits: CharacterSheetTraits;
}

interface CharacterSheetTraits {
    character: Trait[];
    die: Trait[];
    callon: Trait[];
}