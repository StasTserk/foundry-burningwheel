import { DisplayClass, ItemType } from "./item.js";

export class Property extends Item {
    prepareData(): void {
        this.data.data.cssClass = "equipment-property";
    }

    data: PropertyRootData;
    get type(): ItemType {
        return super.type as ItemType;
    }
}

export interface PropertyRootData extends ItemData<PropertyData> {
    data: PropertyData;
    type: ItemType;
}

export interface PropertyData extends DisplayClass {
    isWorkshop: boolean;
    description: string;
}
