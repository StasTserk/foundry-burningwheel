import { BWItem, BWItemData, DisplayClass } from './item.js';

export class Reputation extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.data.cssClass = this.data.data.infamous
            ? 'reputation-infamous'
            : 'reputation-famous';
    }

    data: ReputationDataRoot;
}

export interface ReputationDataRoot extends BWItemData {
    data: ReputationData;
}

export interface ReputationData extends DisplayClass {
    dice: number;
    infamous: boolean;
    description: string;
}
