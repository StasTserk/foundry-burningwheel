import { BWItem, BWItemData, ItemType } from './item.js';

export class Affiliation extends BWItem {
    data: AffiliationDataRoot;
    get type(): ItemType {
        return this.type as ItemType;
    }
}

export interface AffiliationDataRoot extends BWItemData {
    data: AffiliationData;
    type: ItemType;
}

export interface AffiliationData {
    dice: number;
    description: string;
}
