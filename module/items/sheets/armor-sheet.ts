import { armorLocationSelect, gearQualitySelect } from "../../constants.js";

export class ArmorSheet extends ItemSheet {
    get template() {
        return "systems/burningwheel/templates/items/armor.html";
    }

    getData() {
        const data = super.getData() as MeleeSheetData;
        data.armorLocations = armorLocationSelect;
        data.armorQuality = gearQualitySelect;
        return data;
    }
}

interface MeleeSheetData extends ItemSheetData {
    armorQuality: { [key: string]: string; };
    armorLocations: { [key: string]: string; };
}
