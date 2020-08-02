import { gearQualitySelect, weaponSpeedSelect } from "../../constants.js";

export class MeleeWeaponSheet extends ItemSheet {
    get template() {
        return "systems/burningwheel/templates/items/meleeWeapon.html";
    }

    getData() {
        const data = super.getData() as MeleeSheetData;
        data.weaponLengths = weaponSpeedSelect;
        data.weaponQualities = gearQualitySelect;
        return data;
    }
}

interface MeleeSheetData extends ItemSheetData {
    weaponLengths: { [index: string]: string };
    weaponQualities: { [index: string]: string };
}
