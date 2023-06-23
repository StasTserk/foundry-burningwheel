import { traitTypeSelect } from "../../constants";
import { BWItemSheet, BWItemSheetData } from "./bwItemSheet";

export class TraitSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/trait.hbs";
    }

    getData(): TraitSheetData {
        const data = super.getData() as TraitSheetData;
        data.traitTypes = traitTypeSelect;
        return data;
    }
}

interface TraitSheetData extends BWItemSheetData {
    traitTypes: { [index: string]: string };
}
