import { ItemType } from "./item.js";

export class Affiliation extends Item<AffiliationData> {
    data: AffiliationDataRoot;
    get type(): ItemType {
        return this.type as ItemType;
    }
}

export interface AffiliationDataRoot extends ItemData {
    data: AffiliationData;
    type: ItemType;
}

export interface AffiliationData {
    dice: string;
    description: string;
}