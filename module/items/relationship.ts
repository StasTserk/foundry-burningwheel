import { BWItem, BWItemData, DisplayClass } from "./item.js";

export class Relationship extends BWItem {
    prepareData(): void {
        super.prepareData();
        this.data.data.safeId = this.id;
        if (this.actor && this.actor.data) {
            this.data.data.aptitude = this.actor.data.data.circles.exp || 0;
        }

        if (this.data.data.hateful || this.data.data.enmity) {
            this.data.data.cssClass = "relationship-hostile";
        } else if (this.data.data.romantic || this.data.data.immediateFamily) {
            this.data.data.cssClass = "relationship-friendly";
        } else {
            this.data.data.cssClass = "relationship-neutral";
        }
    }

    data: RelationshipDataRoot;
}

export interface RelationshipDataRoot extends BWItemData {
    data: RelationshipData;
}

export interface RelationshipData extends DisplayClass {
    description: string;
    forbidden: boolean;
    immediateFamily: boolean;
    otherFamily: boolean;
    romantic: boolean;
    hateful: boolean;
    enmity: boolean;
    influence: "minor" | "significant" | "powerful";
    building: boolean;
    buildingProgress: number;

    safeId?: string;
    aptitude?: number;
}