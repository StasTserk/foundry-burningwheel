import { RollModifier } from "../bwactor.js";
import { ItemType, HasPointCost, BWItemData, BWItem } from "./item.js";

export class Trait extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.isCallonTrait = this.data.data.traittype === "call-on";
        this.data.isDieTrait = this.data.data.traittype === "die";
    }
    static asRollDieModifier(trait: TraitDataRoot): RollModifier {
        return {
            label: trait.name,
            optional: true,
            dice: trait.data.dieModifier || 0
        };
    }

    static asRollObModifier(trait: TraitDataRoot): RollModifier {
        return {
            label: trait.name,
            optional: true,
            obstacle: trait.data.obModifier || 0
        };
    }

    get type(): ItemType { return super.type as ItemType; }

    data: TraitDataRoot;
}

export interface TraitDataRoot extends BWItemData {
    type: ItemType;
    isDieTrait: boolean;
    isCallonTrait: boolean;
    data: TraitData;
}

export interface TraitData extends HasPointCost {
    traittype: string;
    text: string;
    restrictions: string;

    hasDieModifier: boolean;
    dieModifier: number;
    dieModifierTarget: string;

    hasObModifier: boolean;
    obModifierTarget: string;
    obModifier: number;

    addsReputation: boolean;
    reputationName: string;
    reputationDice: number;
    reputationInfamous: boolean;

    addsAffiliation: boolean;
    affiliationName: string;
    affiliationDice: number;

    hasAptitudeModifier: boolean;
    aptitudeTarget: string;
    aptitudeModifier: number;

    callonTarget: string;
}
