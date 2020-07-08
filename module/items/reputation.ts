import { DisplayClass } from "./item.js";

export class Reputation extends Item {
    prepareData() {
        this.data.data.cssClass = this.data.data.infamous ? "reputation-infamous" : "reputation-famous";
    }

    data: ReputationRootData;
}

export interface ReputationRootData extends BaseEntityData {
    data: ReputationData;
}

export interface ReputationData extends DisplayClass {
    dice: string;
    infamous: boolean;
    description: string;
}