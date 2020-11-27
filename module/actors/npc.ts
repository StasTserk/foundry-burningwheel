import { Common, BWActorDataRoot, BWActor, NewItemData } from "./bwactor.js";
import { ShadeString } from "../helpers.js";
import { BWItem } from "../items/item.js";

export class Npc extends BWActor {
    data: NpcDataRoot;

    prepareData(): void {
        super.prepareData();
        this.calculateWounds();
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

    async createOwnedItem(itemData: NewItemData | NewItemData[], options?: Record<string, unknown>): Promise<BWItem> {
        // we don't add lifepaths to actors. they are simply a data structure for holding lifepath info for the character burner
        if (Array.isArray(itemData)) {
            itemData = itemData.filter(id => id.type !== "lifepath");
            return this.createOwnedItem(itemData, options);
        }
        if (itemData.type !== "lifepath") {
            return this.createOwnedItem(itemData);
        }
        return this.createOwnedItem([], options);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    async createEmbeddedEntity(entityType: string, data: NewItemData, options?: any): Promise<this> {
        // we don't add lifepaths to normal actors. they are simply a data structure for holding lifepath info for the character burner
        if (data.type !== 'lifepath') {
            return super.createEmbeddedEntity(entityType, data, options);
        }
        return this;
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
    }
}