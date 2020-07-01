import { CharacterData } from "../actor.js";

export class MeleeWeapon extends Item {
    prepareData() {
        if (this.actor) {
            const baseDmg = parseInt((this.actor.data as CharacterData).data.power.exp, 10)
                + parseInt(this.data.data.power, 10);
            this.data.data.incidental = Math.ceil(baseDmg / 2);
            this.data.data.mark = baseDmg;
            this.data.data.superb = Math.floor(baseDmg * 1.5);
        }
    }

    data: MeleeWeaponRootData;
}

export interface MeleeWeaponRootData extends BaseEntityData {
    data: MeleeWeaponData
}

export interface MeleeWeaponData {
    quality: string;
    baseOb: string; // as number
    power: string; // as number
    add: string; // as number
    vsArmor: string; // as number
    weaponSpeed: string;
    weaponLength: string;
    handedness: string;
    description: string;

    // derived stats
    incidental?: number;
    mark?: number;
    superb?: number;
}
