export class TraitSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    get template() {
        return "systems/burningwheel/templates/items/trait.html";
    }

    getData() {
        const data = super.getData() as TraitSheetData;
        data.traitTypes = {
            character: "Character",
            "call-on": "Call-on",
            die: "Die"
        }
        return data;
    }
}

interface TraitSheetData extends ItemSheetData {
    traitTypes: { [index: string]: string }
}