import { BWActor } from "../actor.js";
import { DisplayClass, HasPointCost } from "./item.js";
import * as helpers from "../helpers.js";

export class MeleeWeapon extends Item {
    prepareData(): void {
        if (this.actor) {
            const baseDmg = parseInt(this.actor.data.data.power.exp, 10)
                + parseInt(this.data.data.power, 10);
            this.data.data.incidental = Math.ceil(baseDmg / 2);
            this.data.data.mark = baseDmg;
            this.data.data.superb = Math.floor(baseDmg * 1.5);
        }
        this.data.data.cssClass = "equipment-weapon";
    }

    static GetWeaponMessageData(weapon: MeleeWeapon): string {
        const element = document.createElement("div");
        element.className = "weapon-extra-info";
        element.appendChild(helpers.DivOfText(weapon.name, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Add", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("Length", "ims-header"));
    
        element.appendChild(helpers.DivOfText(weapon.data.data.shade + weapon.data.data.incidental));
        element.appendChild(helpers.DivOfText(weapon.data.data.shade + weapon.data.data.mark));
        element.appendChild(helpers.DivOfText(weapon.data.data.shade + weapon.data.data.superb));
        element.appendChild(helpers.DivOfText(weapon.data.data.add));
        element.appendChild(helpers.DivOfText(weapon.data.data.vsArmor));
        element.appendChild(helpers.DivOfText(weapon.data.data.weaponLength.titleCase()));
        return element.outerHTML;
    }
    
    actor: BWActor | null;

    data: MeleeWeaponRootData;
}

export interface MeleeWeaponRootData extends ItemData<MeleeWeaponData> {
    data: MeleeWeaponData;
}

export interface MeleeWeaponData extends DisplayClass, HasPointCost {
    quality: string;
    baseOb: string; // as number
    power: string; // as number
    add: string; // as number
    vsArmor: string; // as number
    weaponSpeed: string;
    weaponLength: string;
    handedness: string;
    description: string;
    shade: helpers.ShadeString;

    // derived stats
    incidental?: number;
    mark?: number;
    superb?: number;
}
