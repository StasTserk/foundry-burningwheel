import { weaponLengthSelect } from "../../constants.js";
import { StringIndexedObject } from "../../helpers.js";

export class SpellSheet extends ItemSheet {
    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/spell.hbs";
    }

    getData(): TraitSheetData {
        const data = super.getData() as TraitSheetData;
        data.spellLengths = weaponLengthSelect;
        return data;
    }
}

interface TraitSheetData extends ItemSheetData {
    spellLengths: StringIndexedObject<string>;
}
