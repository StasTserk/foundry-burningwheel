import { Common, BWActor } from './BWActor';
import { ShadeString } from '../helpers';

export class Npc extends BWActor<NpcData> {
    type: 'npc';

    prepareData(): void {
        super.prepareData();
        this.calculateWounds();
    }

    calculateWounds(): void {
        this.system.ptgs.woundDice =
            (this.system.ptgs.suTaken >= 3 ? 1 : 0) +
            this.system.ptgs.liTaken +
            this.system.ptgs.miTaken * 2 +
            this.system.ptgs.seTaken * 3 +
            this.system.ptgs.trTaken * 4;
        this.system.ptgs.obPenalty =
            this.system.ptgs.suTaken > 0 && this.system.ptgs.suTaken < 3
                ? 1
                : 0;
    }
}

export interface NpcData extends Common {
    bio: string;
    editMode: boolean;
    hesitation: number;
    reflexes: number;
    reflexesShade: ShadeString;
    ptgs: {
        suThresh: number;
        suTaken: number;
        suShade: ShadeString;
        liThresh: number;
        liTaken: number;
        liShade: ShadeString;
        miThresh: number;
        miTaken: number;
        miShade: ShadeString;
        seThresh: number;
        seTaken: number;
        seShade: ShadeString;
        trThresh: number;
        trTaken: number;
        trShade: ShadeString;
        moTaken: number;
        moThresh: number;
        woundShade: ShadeString;

        woundDice?: number;
        obPenalty?: number;
    };
}
