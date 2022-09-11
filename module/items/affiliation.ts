import { BWItem } from "./item.js";

export class Affiliation extends BWItem<AffiliationData> { type: "affiliation"; }

export interface AffiliationData {
    dice: number;
    description: string;
}