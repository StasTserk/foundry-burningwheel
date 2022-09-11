import { DisplayClass, HasPointCost, BWItem } from "./item.js";

export class Property extends BWItem<PropertyData> {
    type: 'property';
    prepareData(): void {
        super.prepareData();
        this.system.cssClass = "equipment-property";
    }
}


export interface PropertyData extends DisplayClass, HasPointCost {
    isWorkshop: boolean;
    description: string;
}
