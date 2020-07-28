import { RollModifier } from "module/actor";

export class Trait extends Item {
    prepareData() {
        this.traittype = this.data.data.traittype || "character";
        this.text = this.data.data.text || "test text";
    }

    traittype: string;
    text: string;
    data: TraitDataRoot;

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
}

export interface TraitDataRoot extends BaseEntityData {
    data: TraitData;
}

export interface TraitData {
    traittype: string;
    text: string;

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
