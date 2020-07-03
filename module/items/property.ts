import { DisplayClass } from "./item.js";

export class Property extends Item {
    prepareData() {
        this.data.data.cssClass = "equipment-property";
    }

    data: PropertyRootData;
}

export interface PropertyRootData extends BaseEntityData {
    data: PropertyData;
}

export interface PropertyData extends DisplayClass {
    isWorkshop: boolean;
    description: string;
}
