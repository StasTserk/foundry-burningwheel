import { BWActor } from "../bwactor.js";
import { DisplayClass, HasPointCost } from "./item.js";
import * as helpers from "../helpers.js";
import { QualityString } from "../constants.js";

export class RangedWeapon extends Item {
    prepareData(): void {
        if (this.actor && this.data.data.usePower) {
            let baseDmg = parseInt(this.actor.data.data.power.exp, 10)
                + parseInt(this.data.data.powerBonus, 10);
            if (this.actor.data.data.power.shade === "G") {
                baseDmg += 2;
            }
            if (this.actor.data.data.power.shade === "W") {
                baseDmg += 3;
            }
            this.data.data.incidental = Math.ceil(baseDmg / 2).toString();
            this.data.data.mark = baseDmg.toString();
            this.data.data.superb = Math.floor(baseDmg * 1.5).toString();
        }

        const incidentalRange = parseInt(this.data.data.incidentalRoll, 10);
        const markRange = parseInt(this.data.data.markRoll, 10);
        this.data.data.incidentalLabel = `1-${incidentalRange}`;
        this.data.data.markLabel = (markRange - 1 === incidentalRange) ? `${markRange}` : `${incidentalRange + 1}-${markRange}`;
        this.data.data.superbLabel = (markRange === 5 ) ? `6` : `${markRange + 1}-6`;

        this.data.data.cssClass = "equipment-weapon";
    }

    static GetWeaponMessageData(weapon: RangedWeapon): string {
        const element = document.createElement("div");
        const roll = new Roll("1d6").roll().dice[0].results[0].result as number;
        const incidental = roll <= (weapon.data.data.incidentalRoll || 0);
        const mark = !incidental && roll <= (weapon.data.data.markRoll || 0);

        element.className = "ranged-extra-info";
        element.appendChild(helpers.DivOfText(weapon.name, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("DoF Ranges", "ims-header"));
        element.appendChild(helpers.DivOfText("Die", "ims-header"));
    
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(weapon.data.data.shade, weapon.data.data.incidental), incidental ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(weapon.data.data.shade, weapon.data.data.mark), mark ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(weapon.data.data.shade, weapon.data.data.superb), !incidental && !mark ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(weapon.data.data.vsArmor));
        element.appendChild(helpers.DivOfText(`${weapon.data.data.incidentalLabel}/${weapon.data.data.markLabel}/${weapon.data.data.superbLabel}`));
        element.appendChild(helpers.DivOfText("" + roll, "roll-die"));
        return element.outerHTML;
    }

    data: RangedWeaponRootData;
    get actor(): BWActor | null {
        return super.actor as BWActor | null;
    }
}

export interface RangedWeaponRootData extends ItemData<RangedWeaponData> {
    data: RangedWeaponData;
}

export interface RangedWeaponData extends DisplayClass, HasPointCost {
    quality: QualityString;
    hasGunpowder: boolean;
    usePower: boolean;
    powerBonus: string; // as number
    incidental: string; // as number
    incidentalRoll: string; // as number
    mark: string; // as number
    markRoll: string; // as number
    superb: string; // as number
    vsArmor: string; // as number
    optimalRange: string; // as number
    extremeRange: string; // as number
    maxRange: string;
    handedness: string;
    description: string;
    shade: helpers.ShadeString;

    // derived data
    incidentalLabel?: string;
    markLabel?: string;
    superbLabel?: string;
}
