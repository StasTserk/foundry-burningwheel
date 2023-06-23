import { BWActor } from '../actors/BWActor';
import { BWItem, DisplayClass } from './item';

export class Relationship extends BWItem<RelationshipData> {
    type: 'relationship';

    prepareData(): void {
        super.prepareData();
        const actor = this.actor as unknown as BWActor;
        this.system.safeId = this.id;
        if (actor && actor.system) {
            this.system.aptitude = actor.system.circles.exp || 0;
        }

        if (this.system.hateful || this.system.enmity) {
            this.system.cssClass = 'relationship-hostile';
        } else if (this.system.romantic || this.system.immediateFamily) {
            this.system.cssClass = 'relationship-friendly';
        } else {
            this.system.cssClass = 'relationship-neutral';
        }
    }
}

export interface RelationshipData extends DisplayClass {
    description: string;
    forbidden: boolean;
    immediateFamily: boolean;
    otherFamily: boolean;
    romantic: boolean;
    hateful: boolean;
    enmity: boolean;
    influence: 'minor' | 'significant' | 'powerful';
    building: boolean;
    buildingProgress: number;

    safeId?: string;
    aptitude?: number;
}
