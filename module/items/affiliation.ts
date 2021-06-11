import { BWItem, BWItemData } from "./item.js";

export class Affiliation extends BWItem<AffiliationDataRoot> { }

export interface AffiliationDataRoot extends BWItemData<AffiliationData> {
    type: "affiliation";
}

export interface AffiliationData {
    dice: number;
    description: string;
}