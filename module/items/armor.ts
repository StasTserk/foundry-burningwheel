import { DisplayClass } from "./item.js";
import { rollDice } from "../rolls/rolls.js";

export class Armor extends Item {
    prepareData(): void {
        this.data.data.cssClass = "equipment-armor";
    }

    data: ArmorRootData;
}

export async function AssignDamage(armor: Armor, roll: Roll, location: string): Promise<number> {
    const num1s = roll.dice[0].rolls.filter(r => r.roll === 1).length;
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
            if (reroll && reroll.dice[0].rolls.filter(r => r.roll === 1).length) {
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

export interface ArmorRootData extends ItemData<ArmorData> {
    data: ArmorData;
}

export interface ArmorData extends DisplayClass {
    quality: string;
    dice: string; // as number
    description: string;
    equipped: boolean;

    // damage info
    hasHelm: boolean;
    damageHelm: 0;
    hasTorso: boolean;
    damageTorso: 0;
    hasLeftArm: boolean;
    damageLeftArm: 0;
    hasRightArm: boolean;
    damageRightArm: 0;
    hasLeftLeg: boolean;
    damageLeftLeg: 0;
    hasRightLeg: boolean;
    damageRightLeg: 0;
    hasShield: boolean;
    damageShield: 0;

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
}
