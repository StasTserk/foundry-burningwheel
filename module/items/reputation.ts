import { BWItem, DisplayClass } from "./item.js";

export class Reputation extends BWItem<ReputationData> {
    type: "reputation";
    prepareData(): void {
        super.prepareData();
        this.system.cssClass = this.system.infamous ? "reputation-infamous" : "reputation-famous";
    }
}

export interface ReputationData extends DisplayClass {
    dice: number;
    infamous: boolean;
    description: string;
}