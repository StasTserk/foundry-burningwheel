import { BWActor } from "../actor.js";
import { DisplayClass } from "./item.js";

export class Relationship extends Item {
    prepareData() {
        this.data.data.safeId = this._id;
        this.data.data.aptitude = parseInt(this.actor.data.data.circles.exp, 10) || 0;

        if (this.data.data.hateful || this.data.data.enmity) {
            this.data.data.cssClass = "relationship-hostile";
        } else if (this.data.data.romantic || this.data.data.immediateFamily) {
            this.data.data.cssClass = "relationship-friendly";
        } else {
            this.data.data.cssClass = "relationship-neutral";
        }
    }

    get actor(): BWActor {
        return this.actor;
    }

    data: RelationshipDataRoot;
}

interface RelationshipDataRoot extends BaseEntityData {
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
    influence: string;
    building: string;
    buildingProgress: number;

    safeId?: string;
    aptitude?: number;
}