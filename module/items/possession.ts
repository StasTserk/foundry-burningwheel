import { BWItem, DisplayClass, HasPointCost } from "./item";

export class Possession extends BWItem<PossessionData> {
    type: "possession";
    prepareData(): void {
        super.prepareData();
        this.system.cssClass = "equipment-possession";
    }
}

export interface PossessionData extends DisplayClass, HasPointCost {
    isToolkit: boolean;
    isExpended: boolean;
    description: string;
}
