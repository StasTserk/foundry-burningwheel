import { DisplayClass } from "./item.js";

export class Armor extends Item {
    prepareData() {
        this.data.data.cssClass = "equipment-armor";
        this.data.data.cssClass += " " + armorCssClassLookup[this.data.data.location];
    }

    data: ArmorRootData;
}

export interface ArmorRootData extends BaseEntityData {
    data: ArmorData;
}

export interface ArmorData extends DisplayClass {
    quality: string;
    location: string;
    dice: string; // as number
    damage: string; // as number
    description: string;
    equipped: boolean;

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

const armorCssClassLookup = {
    "head": "armor-head",
    "torso": "armor-torso",
    "right arm": "armor-arm",
    "left arm": "armor-arm",
    "right leg": "armor-leg",
    "left leg": "armor-leg",
    "shield": "armor-shield",
    "all": "armor-all"
};
