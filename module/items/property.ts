import { DisplayClass } from "./item.js";

export class Property extends Item {
    prepareData(): void {
        this.data.data.cssClass = "equipment-property";
    }

    data: PropertyRootData;
}

export interface PropertyRootData extends ItemData<PropertyData> {
    data: PropertyData;
}

export interface PropertyData extends DisplayClass {
    isWorkshop: boolean;
    description: string;
}
