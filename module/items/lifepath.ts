import { ItemType, BWItemData, BWItem } from "./item.js";

export class Lifepath extends BWItem<LifepathRootData> {
    get type(): ItemType {
        return super.type as ItemType;
    }

    prepareData(): void {
        super.prepareData();
        const statSign = this.data.data.statBoost === "none" ? "" : (this.data.data.subtractStats ? "-" : "+");
        this.data.data.statString = statSign + statMap[this.data.data.statBoost];
    }
}

export interface LifepathRootData extends BWItemData<LifepathData> {
    type: "lifepath";
}

export interface LifepathData {
    time: number;
    resources: number;
    statBoost: 'none' | 'mental' | 'physical' | 'either' | 'both';
    subtractStats: boolean;
    leads: string;
    skillPoints: number;
    generalPoints: number;
    traitPoints: number;
    skillList: string;
    traitList: string;
    requirements: string;
    restrictions: string;
    note: string;
    
    order: number; // hidden property  for sorting in the setting sheet

    statString?: string;
}

const statMap = {
    "none": "&mdash;",
    "mental": "1 M",
    "physical": "1 P",
    "either": "1 M/P",
    "both": "1 M,P"
};
