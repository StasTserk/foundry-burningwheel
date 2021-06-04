import { BWItem, BWItemData, DisplayClass, HasPointCost } from "./item.js";
import * as helpers from "../helpers.js";
import { QualityString } from "../constants.js";
import { translateWoundValue } from "../helpers.js";
import { BWActorData } from "../actors/BWActor.js";

export class MeleeWeapon extends BWItem<MeleeWeaponRootData> {
    prepareData(): void {
        super.prepareData();
        const actorData = this.actor && this.actor.data as unknown as BWActorData;
        if (actorData) {
            let power = actorData.data.power.exp;
            if (actorData.data.power.shade === "G") {
                power += 2;
            }
            if (actorData.data.power.shade === "W") {
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

    async getWeaponMessageData(attackIndex: number): Promise<string> {
        const element = document.createElement("div");
        element.className = "weapon-extra-info";
        element.appendChild(helpers.DivOfText(`${this.name} ${this.data.data.attacks[attackIndex].attackName}`, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Add", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("Length", "ims-header"));
    
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].incidental || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].mark || 1)));
        element.appendChild(helpers.DivOfText(translateWoundValue(this.data.data.shade, this.data.data.attacks[attackIndex].superb || 1)));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].add));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].vsArmor));
        element.appendChild(helpers.DivOfText(this.data.data.attacks[attackIndex].weaponLength.titleCase()));
        return element.outerHTML;
    }

    data: MeleeWeaponRootData;
}

export interface MeleeWeaponRootData extends BWItemData<MeleeWeaponData> {
    data: MeleeWeaponData;
}

export interface MeleeWeaponData extends DisplayClass, HasPointCost {
    quality: QualityString;

    handedness: string;
    description: string;
    shade: helpers.ShadeString;
    attacks: AttackData[];
    skillId: string;
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
