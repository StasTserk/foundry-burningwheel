import { gearQualitySelect, weaponLengthSelect } from "../../constants.js";
import { MeleeWeapon } from "../meleeWeapon.js";
import { BWItemSheet, BWItemSheetData } from "./bwItemSheet.js";

export class MeleeWeaponSheet extends BWItemSheet {
    get item(): MeleeWeapon {
        return super.item as MeleeWeapon;
    }
    
    get template(): string {
        return "systems/burningwheel/templates/items/meleeWeapon.hbs";
    }

    getData(): MeleeSheetData {
        const data = super.getData() as MeleeSheetData;
        data.weaponLengths = weaponLengthSelect;
        data.weaponQualities = gearQualitySelect;
        return data;
    }

    activateListeners(html: JQuery): void {
        super.activateListeners(html);
        html.find(".fa-plus").on('click', () => {
            const attacks = Object.values(this.item.data.data.attacks || []);
            attacks.push({
                attackName: "Alternate",
                power: 1,
                add: 2,
                vsArmor: 0,
                weaponLength: "Shortest",
                weaponSpeed: "2"
            });
            this.item.update({ "data.attacks": attacks}, {});
        });
        html.find(".fa-minus").on('click', (e: JQuery.ClickEvent) => {
            const target = e.target;
            const index = parseInt(target.dataset.index);
            const attacks =  Object.values(this.item.data.data.attacks || []);
            attacks.splice(index, 1);
            this.item.update({ "data.attacks": attacks}, {});
        });
    }
}

interface MeleeSheetData extends BWItemSheetData {
    weaponLengths: { [index: string]: string };
    weaponQualities: { [index: string]: string };
}
