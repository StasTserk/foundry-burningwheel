import { gearQualitySelect } from "../../constants.js";

export class RangedWeaponSheet extends ItemSheet {
    get template(): string {
        return "systems/burningwheel/templates/items/rangedWeapon.html";
    }

    getData(): RangedSheetData {
        const data = super.getData() as RangedSheetData;
        data.weaponQualities = gearQualitySelect;
        return data;
    }
}

interface RangedSheetData extends ItemSheetData {
    weaponQualities: { [index: string]: string };
}
