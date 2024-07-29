import {
    gearQualitySelect,
    shadesSelect,
    weaponLengthSelect,
} from '../../constants';
import { MeleeWeapon } from '../meleeWeapon';
import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class MeleeWeaponSheet extends BWItemSheet {
    get item(): MeleeWeapon {
        return super.item as MeleeWeapon;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/meleeWeapon.hbs';
    }

    getData(): MeleeSheetData {
        const data = super.getData() as MeleeSheetData;
        data.weaponLengths = weaponLengthSelect;
        data.weaponQualities = gearQualitySelect;
        data.shades = shadesSelect;
        data.speeds = { 1: 1, 2: 2, 3: 3, 4: 4, x: 'X' };
        data.handednessOptions = {
            one: 'BW.weapon.oneHanded',
            two: 'BW.weapon.twoHanded',
        };
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find('.fa-plus').on('click', () => {
            const attacks = Object.values(this.item.system.attacks || []);
            attacks.push({
                attackName: 'Alternate',
                power: 1,
                add: 2,
                vsArmor: 0,
                weaponLength: 'Shortest',
                weaponSpeed: '2',
            });
            this.item.update({ 'system.attacks': attacks }, {});
        });
        html.find('.fa-minus').on('click', (e: JQuery.ClickEvent) => {
            const target = e.target;
            const index = parseInt(target.dataset.index);
            const attacks = Object.values(this.item.system.attacks || []);
            attacks.splice(index, 1);
            this.item.update({ 'system.attacks': attacks }, {});
        });
    }
}

interface MeleeSheetData extends BWItemSheetData {
    weaponLengths: { [index: string]: string };
    weaponQualities: { [index: string]: string };
    shades: Record<string, string>;
    handednessOptions: Record<string, string>;
    speeds: Record<string | number, string | number>;
}
