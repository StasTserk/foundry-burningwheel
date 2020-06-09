export class Trait extends Item {
    prepareData() {
        this.traittype = this.data.data.traittype || "character";
        this.text = this.data.data.text || "test text";
    }

    traittype: string;
    text: string;
    data: TraitData;
}

interface TraitData extends BaseEntityData {
    traittype: string;
    text: string;
}