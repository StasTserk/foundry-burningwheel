import { gearQualitySelect, shadesSelect } from '../../constants';
import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class RangedWeaponSheet extends BWItemSheet {
    get template(): string {
        return 'systems/burningwheel/templates/items/rangedWeapon.hbs';
    }

    getData(): RangedSheetData {
        const data = super.getData() as RangedSheetData;
        data.weaponQualities = gearQualitySelect;
        data.shades = shadesSelect;
        return data;
    }
}

interface RangedSheetData extends BWItemSheetData {
    weaponQualities: { [index: string]: string };
    shades: typeof shadesSelect;
}
