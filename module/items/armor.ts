import { DisplayClass, HasPointCost } from "./item.js";
import { rollDice } from "../rolls/rolls.js";
import { ShadeString } from "../helpers.js";

export class Armor extends Item {
    prepareData(): void {
        this.data.data.cssClass = "equipment-armor";

        const dice = parseInt(this.data.data.dice);
        this.data.data.helmDisplayClass = calculateDisplayClass(dice, this.data.data.damageHelm);
        this.data.data.torsoDisplayClass = calculateDisplayClass(dice+1, this.data.data.damageTorso);
        this.data.data.leftArmDisplayClass = calculateDisplayClass(dice, this.data.data.damageLeftArm);
        this.data.data.rightArmDisplayClass = calculateDisplayClass(dice, this.data.data.damageRightArm);
        this.data.data.leftLegDisplayClass= calculateDisplayClass(dice, this.data.data.damageLeftLeg);
        this.data.data.rightLegDisplayClass = calculateDisplayClass(dice, this.data.data.damageRightLeg);
        this.data.data.shieldDisplayClass = calculateDisplayClass(dice, this.data.data.damageShield);
    }

    data: ArmorRootData;
}

export async function AssignDamage(armor: Armor, roll: Roll, location: string): Promise<number> {
    const num1s = roll.dice[0].results.filter(r => r.result === 1).length;
    if (num1s === 0) { return new Promise(r => r(0)); }

    const locationAccessor = `data.damage${location}`;
    const damage = parseInt(getProperty(armor, `data.${locationAccessor}`)) || 0;
    const updateData = {};
    let newDamage = 0;
    switch (armor.data.data.quality) {
        case "run of the mill":
            newDamage = Math.min(parseInt(armor.data.data.dice), damage + 1);                
            updateData[locationAccessor] = newDamage;
            await armor.update(updateData, null);
            return new Promise(r => r(1));
        case "superior":
            const reroll = await rollDice(num1s, false, "B");
            if (reroll && reroll.dice[0].results.filter(r => r.result === 1).length) {
                newDamage = Math.min(parseInt(armor.data.data.dice), damage + 1);                
                updateData[locationAccessor] = newDamage;
                await armor.update(updateData, null);
                return new Promise(r => r(1));
            }
            return new Promise(r => r(0));
        default:
            newDamage = Math.min(parseInt(armor.data.data.dice), damage + num1s);
            updateData[locationAccessor] = newDamage;
            await armor.update(updateData, null);
            return new Promise(r => r(num1s));
    }

}

function calculateDisplayClass(dice: number, locationDice: string): string {
    if (parseInt(locationDice) >= dice) {
        return "armor-broken";
    }
    return "";
}

export interface ArmorRootData extends ItemData<ArmorData> {
    data: ArmorData;
}

export interface ArmorData extends DisplayClass, HasPointCost {
    quality: string;
    dice: string; // as number
    description: string;
    equipped: boolean;

    // damage info
    hasHelm: boolean;
    damageHelm: string;
    hasTorso: boolean;
    damageTorso: string;
    hasLeftArm: boolean;
    damageLeftArm: string;
    hasRightArm: boolean;
    damageRightArm: string;
    hasLeftLeg: boolean;
    damageLeftLeg: string;
    hasRightLeg: boolean;
    damageRightLeg: string;
    hasShield: boolean;
    damageShield: string;

    // clumsy weight info
    agilityPenalty: string; // as number
    speedObPenalty: string; // as number
    speedDiePenalty: string; // as number
    climbingPenalty: string; // as number
    healthFortePenalty: string; // as number
    throwingShootingPenalty: string; // as number
    stealthyPenalty: string; // as number
    swimmingPenalty: string; // as number
    perceptionObservationPenalty: string; // as number
    untrainedPenalty: string;

    shade: ShadeString;

    helmDisplayClass?: string;
    torsoDisplayClass?: string;
    leftArmDisplayClass?: string;
    rightArmDisplayClass?: string;
    leftLegDisplayClass?: string;
    rightLegDisplayClass?: string;
    shieldDisplayClass?: string;
}
