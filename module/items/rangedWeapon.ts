import { BWItem, BWItemData, DisplayClass, HasPointCost } from "./item.js";
import * as helpers from "../helpers.js";
import { QualityString } from "../constants.js";
import { BWActor } from "../actors/BWActor.js";

export class RangedWeapon extends BWItem {
    prepareData(): void {
        super.prepareData();
        const actor = this.actor as unknown as BWActor;
        if (actor && this.data.data.usePower) {
            let baseDmg = actor.data.data.power.exp + this.data.data.powerBonus;
            if (actor.data.data.power.shade === "G") {
                baseDmg += 2;
            }
            if (actor.data.data.power.shade === "W") {
                baseDmg += 3;
            }
            this.data.data.incidental = Math.ceil(baseDmg / 2);
            this.data.data.mark = baseDmg;
            this.data.data.superb = Math.floor(baseDmg * 1.5);
        }

        const incidentalRange = this.data.data.incidentalRoll;
        const markRange = this.data.data.markRoll;
        this.data.data.incidentalLabel = `1-${incidentalRange}`;
        this.data.data.markLabel = (markRange - 1 === incidentalRange) ? `${markRange}` : `${incidentalRange + 1}-${markRange}`;
        this.data.data.superbLabel = (markRange === 5 ) ? `6` : `${markRange + 1}-6`;

        this.data.data.cssClass = "equipment-weapon";
    }

    getWeaponMessageData(): string {
        const element = document.createElement("div");
        const roll = new Roll("1d6").roll().dice[0].results[0].result as number;
        const incidental = roll <= (this.data.data.incidentalRoll || 0);
        const mark = !incidental && roll <= (this.data.data.markRoll || 0);

        element.className = "ranged-extra-info";
        element.appendChild(helpers.DivOfText(this.name, "ims-title shade-black"));
        element.appendChild(helpers.DivOfText("I", "ims-header"));
        element.appendChild(helpers.DivOfText("M", "ims-header"));
        element.appendChild(helpers.DivOfText("S", "ims-header"));
        element.appendChild(helpers.DivOfText("Va", "ims-header"));
        element.appendChild(helpers.DivOfText("DoF Ranges", "ims-header"));
        element.appendChild(helpers.DivOfText("Die", "ims-header"));
    
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(this.data.data.shade, this.data.data.incidental), incidental ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(this.data.data.shade, this.data.data.mark), mark ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(helpers.translateWoundValue(this.data.data.shade, this.data.data.superb), !incidental && !mark ? "highlight" : undefined));
        element.appendChild(helpers.DivOfText(this.data.data.vsArmor));
        element.appendChild(helpers.DivOfText(`${this.data.data.incidentalLabel}/${this.data.data.markLabel}/${this.data.data.superbLabel}`));
        element.appendChild(helpers.DivOfText("" + roll, "roll-die"));
        return element.outerHTML;
    }

    data: RangedWeaponRootData;
}

export interface RangedWeaponRootData extends BWItemData {
    data: RangedWeaponData;
}

export interface RangedWeaponData extends DisplayClass, HasPointCost {
    quality: QualityString;
    hasGunpowder: boolean;
    usePower: boolean;
    powerBonus: number;
    incidental: number;
    incidentalRoll: number;
    mark: number;
    markRoll: number;
    superb: number;
    vsArmor: number;
    optimalRange: number;
    extremeRange: number;
    maxRange: string;
    handedness: string;
    description: string;
    shade: helpers.ShadeString;

    // derived data
    incidentalLabel?: string;
    markLabel?: string;
    superbLabel?: string;

    skillId: string;
}
