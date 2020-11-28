import { ItemType, BWItemData, BWItem } from "./item.js";

export class Lifepath extends BWItem {
    data: LifepathRootData;
    get type(): ItemType {
        return super.type as ItemType;
    }

    prepareData(): void {
        super.prepareData();
        this.data.data.statString = statMap[this.data.data.statBoost];
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

    statString?: string;
}

const statMap = {
    "none": "&mdash;",
    "mental": "+1 M",
    "physical": "+1 P",
    "either": "+1 M/P",
    "both": "+1 M,P"
};
