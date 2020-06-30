import { gearQualitySelect } from "../../constants.js";
import { RangedWeapon } from "../rangedWeapon.js";

export class RangedWeaponSheet extends ItemSheet {
    get template() {
        return "systems/burningwheel/templates/items/rangedWeapon.html";
    }

    getData() {
        const data = super.getData() as RangedSheetData;
        const weaponData = (this.item as RangedWeapon).data.data;
        const incidentalRange = parseInt(weaponData.incidentalRoll, 10);
        const markRange = parseInt(weaponData.markRoll, 10);
        const incidentalLabel = `1-${incidentalRange}`;
        const markLabel = (markRange - 1 === incidentalRange) ? `${markRange}` : `${incidentalRange + 1}-${markRange}`;
        const superbLabel = (markRange === 5 ) ? `6` : `${markRange + 1}-6`;

        data.weaponQualities = gearQualitySelect;
        data.incidentalLabel = incidentalLabel;
        data.markLabel = markLabel;
        data.superbLabel = superbLabel;
        return data;
    }
}

interface RangedSheetData extends ItemSheetData {
    weaponQualities: { [index: string]: string }
    incidentalLabel: string;
    markLabel: string;
    superbLabel: string;
}
