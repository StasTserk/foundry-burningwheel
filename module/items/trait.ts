export class Trait extends Item {
    prepareData() {
        this.traittype = this.data.data.traittype || "character";
        this.text = this.data.data.text || "test text";
    }

    traittype: string;
    text: string;
    data: TraitData;
}

export interface TraitData extends BaseEntityData {
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
}
