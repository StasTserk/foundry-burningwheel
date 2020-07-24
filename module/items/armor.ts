import { DisplayClass } from "./item.js";

export class Armor extends Item {
    prepareData() {
        this.data.data.cssClass = "equipment-armor";
    }

    data: ArmorRootData;
}

export interface ArmorRootData extends BaseEntityData {
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
