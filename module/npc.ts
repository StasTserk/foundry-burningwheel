import { BWActor, Common, BWActorDataRoot } from "./bwactor.js";
import { ShadeString } from "./helpers.js";

export class Npc extends BWActor {
    data: NpcDataRoot;
}

export interface NpcDataRoot extends BWActorDataRoot {
    data: NpcData;
}

export interface NpcData extends Common {
    bio: string;
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
    }
}