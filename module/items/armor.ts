export class Armor extends Item {
    data: ArmorRootData;
}

export interface ArmorRootData extends BaseEntityData {
    data: ArmorData
}

export interface ArmorData {
    quality: string;
    location: string;
    dice: string; // as number
    damage: string; // as number
    description: string;
}
