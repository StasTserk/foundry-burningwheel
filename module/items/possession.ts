import { BWItem, BWItemData, DisplayClass, HasPointCost } from "./item.js";

export class Possession extends BWItem<PossessionRootData> {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = "equipment-possession";
    }
}

export interface PossessionRootData extends BWItemData<PossessionData> {
    type: "possession";
}

export interface PossessionData extends DisplayClass, HasPointCost {
    isToolkit: boolean;
    isExpended: boolean;
    description: string;
}
