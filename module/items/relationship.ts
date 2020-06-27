import { BWActor } from "../actor.js";
import { slugify } from "../helpers.js";
import { BWItem } from "../item.js";

export class Relationship extends BWItem {
    prepareData() {
        this.data.data.safeId = slugify(this.name);
        this.data.data.aptitude = parseInt(this.actor.data.data.circles.exp, 10) || 0;
    }

    get actor(): BWActor {
        return this.actor;
    }

    data: RelationshipDataRoot;
}

interface RelationshipDataRoot extends BaseEntityData {
    data: RelationshipData;
}

export interface RelationshipData {
    description: string;
    forbidden: boolean;
    immediateFamily: boolean;
    otherFamily: boolean;
    romantic: boolean;
    hateful: boolean;
    influence: string;
    building: string;
    buildingProgress: number;

    safeId?: string;
    aptitude?: number;
}