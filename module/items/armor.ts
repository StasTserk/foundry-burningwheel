import { BWItem, BWItemData, DisplayClass, HasPointCost } from "./item.js";
import { rollDice } from "../rolls/rolls.js";
import { ShadeString } from "../helpers.js";

export class Armor extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = "equipment-armor";

        const dice = this.data.data.dice;
        this.data.data.helmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageHelm);
        this.data.data.torsoDisplayClass = this.calculateDisplayClass(dice+1, this.data.data.damageTorso);
        this.data.data.leftArmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageLeftArm);
        this.data.data.rightArmDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageRightArm);
        this.data.data.leftLegDisplayClass= this.calculateDisplayClass(dice, this.data.data.damageLeftLeg);
        this.data.data.rightLegDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageRightLeg);
        this.data.data.shieldDisplayClass = this.calculateDisplayClass(dice, this.data.data.damageShield);
    }

    data: ArmorRootData;

    calculateDisplayClass(dice: number, locationDice: string): string {
        if (parseInt(locationDice) >= dice) {
            return "armor-broken";
        }
        return "";
    }

    async assignDamage(roll: Roll, location: string): Promise<number> {
        const num1s = roll.dice[0].results.filter(r => r.result === 1).length;
        if (num1s === 0) { return new Promise(r => r(0)); }
    
        const locationAccessor = `data.damage${location}`;
        const damage = parseInt(getProperty(this, `data.${locationAccessor}`)) || 0;
        const updateData = {};
        let newDamage = 0;
        switch (this.data.data.quality) {
            case "run of the mill":
                newDamage = Math.min(this.data.data.dice, damage + 1);                
                updateData[locationAccessor] = newDamage;
                await this.update(updateData);
                return new Promise(r => r(1));
            case "superior":
                const reroll = await rollDice(num1s, false, "B");
                if (reroll && reroll.dice[0].results.filter(r => r.result === 1).length) {
                    newDamage = Math.min(this.data.data.dice, damage + 1);                
                    updateData[locationAccessor] = newDamage;
                    await this.update(updateData);
                    return new Promise(r => r(1));
                }
                return new Promise(r => r(0));
            default:
                newDamage = Math.min(this.data.data.dice, damage + num1s);
                updateData[locationAccessor] = newDamage;
                await this.update(updateData);
                return new Promise(r => r(num1s));
        }
    }
}

export interface ArmorRootData extends BWItemData {
    data: ArmorData;
}

export interface ArmorData extends DisplayClass, HasPointCost {
    quality: string;
    dice: number;
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
    agilityPenalty: number;
    speedObPenalty: number;
    speedDiePenalty: number;
    climbingPenalty: number;
    healthFortePenalty: number;
    throwingShootingPenalty: number;
    stealthyPenalty: number;
    swimmingPenalty: number;
    perceptionObservationPenalty: number;
    untrainedPenalty: 'none' | 'light' | 'heavy' | 'plate';

    shade: ShadeString;

    helmDisplayClass?: string;
    torsoDisplayClass?: string;
    leftArmDisplayClass?: string;
    rightArmDisplayClass?: string;
    leftLegDisplayClass?: string;
    rightLegDisplayClass?: string;
    shieldDisplayClass?: string;
}
