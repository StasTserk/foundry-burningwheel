import { DisplayClass } from "./item.js";

export class Reputation extends Item<ReputationData> {
    prepareData(): void {
        this.data.data.cssClass = this.data.data.infamous ? "reputation-infamous" : "reputation-famous";
    }

    data: ReputationDataRoot;
}

export interface ReputationDataRoot extends ItemData {
    data: ReputationData;
}

export interface ReputationData extends DisplayClass {
    dice: string;
    infamous: boolean;
    description: string;
}