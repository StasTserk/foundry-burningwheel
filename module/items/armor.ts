import { DisplayClass } from "./item.js";

export class Armor extends Item {
    prepareData() {
        this.data.data.cssClass = "equipment-armor";
    }

    data: ArmorRootData;
}

export interface ArmorRootData extends BaseEntityData {
    data: ArmorData
}

export interface ArmorData extends DisplayClass {
    quality: string;
    location: string;
    dice: string; // as number
    damage: string; // as number
    description: string;
}
