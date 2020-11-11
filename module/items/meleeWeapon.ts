import { BWActor } from "../bwactor.js";
import { DisplayClass, HasPointCost } from "./item.js";
import * as helpers from "../helpers.js";
import { QualityString } from "../constants.js";
import { translateWoundValue } from "../helpers.js";

export class MeleeWeapon extends Item {
    prepareData(): void {
        if (this.actor) {
            let power = parseInt(this.actor.data.data.power.exp);
            if (this.actor.data.data.power.shade === "G") {
                power += 2;
            }
            if (this.actor.data.data.power.shade === "W") {
                power += 3;
            }
            Object.values(this.data.data.attacks || []).forEach(ad => {
                const baseDmg = power + ad.power;
                ad.incidental = Math.ceil(baseDmg / 2);
                ad.mark = baseDmg;
                ad.superb = Math.floor(baseDmg * 1.5);
            });
        }
        this.data.data.cssClass = "equipment-weapon";
    }

    static GetWeaponMessageData(weapon: MeleeWeapon, attackIndex: number): string {
        const element = document.createElement("div");
        element.className = "weapon-extra-info";
        element.appendChild(helpers.DivOfText(`${weapon.name} ${weapon.data.data.attacks[attackIndex].attackName}`, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Add", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("Length", "ims-header"));
    
        element.appendChild(helpers.DivOfText(translateWoundValue(weapon.data.data.shade, weapon.data.data.attacks[attackIndex].incidental || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(weapon.data.data.shade, weapon.data.data.attacks[attackIndex].mark || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(weapon.data.data.shade, weapon.data.data.attacks[attackIndex].superb || 1)));
        element.appendChild(helpers.DivOfText(weapon.data.data.attacks[attackIndex].add));
        element.appendChild(helpers.DivOfText(weapon.data.data.attacks[attackIndex].vsArmor));
        element.appendChild(helpers.DivOfText(weapon.data.data.attacks[attackIndex].weaponLength.titleCase()));
        return element.outerHTML;
    }
    
    get actor(): BWActor | null {
        return super.actor as BWActor | null;
    }

    data: MeleeWeaponRootData;
}

export interface MeleeWeaponRootData extends ItemData<MeleeWeaponData> {
    data: MeleeWeaponData;
}

export interface MeleeWeaponData extends DisplayClass, HasPointCost {
    quality: QualityString;

    handedness: string;
    description: string;
    shade: helpers.ShadeString;
    attacks: AttackData[];

}

export interface AttackData {
    attackName: string;
    power: number;
    add: number;
    vsArmor: number;
    weaponSpeed: string;
    weaponLength: string;

    // derived stats
    incidental?: number;
    mark?: number;
    superb?: number;
}
