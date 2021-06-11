import { BWItem, BWItemData, DisplayClass } from "./item.js";

export class Reputation extends BWItem<ReputationDataRoot> {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = this.data.data.infamous ? "reputation-infamous" : "reputation-famous";
    }
}

export interface ReputationDataRoot extends BWItemData<ReputationData> {
    type: "reputation"
}

export interface ReputationData extends DisplayClass {
    dice: number;
    infamous: boolean;
    description: string;
}