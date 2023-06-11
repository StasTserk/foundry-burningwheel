import { armorLocationSelect, gearQualitySelect } from "../../constants.js";
import { BWItemSheet, BWItemSheetData } from "./bwItemSheet.js";

export class ArmorSheet extends BWItemSheet {
    get template(): string {
        return "systems/burningwheel/templates/items/armor.hbs";
    }

    getData(): MeleeSheetData {
        const data = super.getData() as MeleeSheetData;
        data.armorLocations = armorLocationSelect;
        data.armorQuality = {...gearQualitySelect};
        delete data.armorQuality.basic;
        return data;
    }
}

interface MeleeSheetData extends BWItemSheetData {
    armorQuality: { [key: string]: string; };
    armorLocations: { [key: string]: string; };
}
