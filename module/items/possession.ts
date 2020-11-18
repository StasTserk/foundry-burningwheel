import { BWItem, BWItemData, DisplayClass, HasPointCost } from "./item.js";

export class Possession extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = "equipment-possession";
    }

    data: PossessionRootData;
}

export interface PossessionRootData extends BWItemData {
    data: PossessionData;
}

export interface PossessionData extends DisplayClass, HasPointCost {
    isToolkit: boolean;
    isExpended: boolean;
    description: string;
}
