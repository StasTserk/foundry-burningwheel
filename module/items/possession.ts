import { DisplayClass, HasPointCost } from "./item.js";

export class Possession extends Item {
    prepareData(): void {
        this.data.data.cssClass = "equipment-possession";
    }

    data: PossessionRootData;
}

export interface PossessionRootData extends ItemData<PossessionData> {
    data: PossessionData;
}

export interface PossessionData extends DisplayClass, HasPointCost {
    isToolkit: boolean;
    isExpended: boolean;
    description: string;
}
