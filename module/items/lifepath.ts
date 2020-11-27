import { ItemType, BWItemData, BWItem } from "./item.js";

export class Lifepath extends BWItem {
    data: LifepathRootData;
    get type(): ItemType {
        return super.type as ItemType;
    }
}

export interface LifepathRootData extends BWItemData {
    data: LifepathData;
    type: ItemType;
}

export interface LifepathData {
    time: number;
    resources: number;
    statBoost: 'none' | 'mental' | 'physical' | 'either' | 'both';
    leads: string;
    skillPoints: number;
    generalPoints: number;
    traitPoints: number;
    skillList: string;
    traitList: string;
    requirements: string;
    restrictions: string;
}
