import { DisplayClass, HasPointCost, BWItemData, BWItem } from "./item.js";

export class Property extends BWItem<PropertyRootData> {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = "equipment-property";
    }
}

export interface PropertyRootData extends BWItemData<PropertyData> {
    data: PropertyData;
    type: "property";
}

export interface PropertyData extends DisplayClass, HasPointCost {
    isWorkshop: boolean;
    description: string;
}
