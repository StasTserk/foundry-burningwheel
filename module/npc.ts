import { Common, BWActorDataRoot } from "./bwactor.js";
import { ShadeString } from "./helpers.js";

export class Npc extends Actor<NpcData> {
    data: NpcDataRoot;

    bindNpcFunctions(): void {
        this.calculateWounds = Npc.prototype.calculateWounds.bind(this);
        this.prepareTypeSpecificData = Npc.prototype.prepareTypeSpecificData.bind(this);
    }

    calculateWounds(): void {
        this.data.data.ptgs.woundDice = 
            (this.data.data.ptgs.suTaken >= 3 ? 1 : 0) +
            (this.data.data.ptgs.liTaken) +
            (this.data.data.ptgs.miTaken * 2) +
            (this.data.data.ptgs.seTaken * 3) +
            (this.data.data.ptgs.trTaken * 4);
        this.data.data.ptgs.obPenalty =
            (this.data.data.ptgs.suTaken > 0 && this.data.data.ptgs.suTaken < 3) ? 1 : 0;
    }

    prepareTypeSpecificData(): void {
        this.calculateWounds();
    }

}

export interface NpcDataRoot extends BWActorDataRoot {
    data: NpcData;
}

export interface NpcData extends Common {
    bio: string;
    editMode: boolean;
    hesitation: number;
    reflexes: number;
    reflexesShade: ShadeString;
    ptgs: {
        woundShade: ShadeString;
        suThresh: number;
        suTaken: number;
        liThresh: number;
        liTaken: number;
        miThresh: number;
        miTaken: number;
        seThresh: number;
        seTaken: number;
        trThresh: number;
        trTaken: number;
        moTaken: number;
        moThresh: number;

        woundDice?: number;
        obPenalty?: number;
    }
}