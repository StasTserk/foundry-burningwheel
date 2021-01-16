import {
    DisplayClass,
    ItemType,
    HasPointCost,
    BWItemData,
    BWItem,
} from './item.js';

export class Property extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = 'equipment-property';
    }

    data: PropertyRootData;
    get type(): ItemType {
        return super.type as ItemType;
    }
}

export interface PropertyRootData extends BWItemData {
    data: PropertyData;
    type: ItemType;
}

export interface PropertyData extends DisplayClass, HasPointCost {
    isWorkshop: boolean;
    description: string;
}
