import { RollModifier } from "module/bwactor";
import { ItemType, HasPointCost } from "./item.js";

export class Trait extends Item<TraitData> {
    prepareData(): void {
        this.data.isCallonTrait = this.data.data.traittype === "call-on";
        this.data.isDieTrait = this.data.data.traittype === "die";
    }
    static asRollDieModifier(trait: TraitDataRoot): RollModifier {
        return {
            label: trait.name,
            optional: true,
            dice: parseInt(trait.data.dieModifier, 10) || 0
        };
    }

    static asRollObModifier(trait: TraitDataRoot): RollModifier {
        return {
            label: trait.name,
            optional: true,
            obstacle: parseInt(trait.data.obModifier, 10) || 0
        };
    }

    get type(): ItemType { return super.type as ItemType; }

    data: TraitDataRoot;
}

export interface TraitDataRoot extends ItemData<TraitData> {
    type: ItemType;
    isDieTrait: boolean;
    isCallonTrait: boolean;
}

export interface TraitData extends HasPointCost {
    traittype: string;
    text: string;
    restrictions: string;

    hasDieModifier: boolean;
    dieModifier: string; // as number
    dieModifierTarget: string;

    hasObModifier: boolean;
    obModifierTarget: string;
    obModifier: string; // as number

    addsReputation: boolean;
    reputationName: string;
    reputationDice: string; // as number
    reputationInfamous: boolean;

    addsAffiliation: boolean;
    affiliationName: string;
    affiliationDice: string; // as number

    callonTarget: string;
}
