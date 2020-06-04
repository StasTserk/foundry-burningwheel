import { Belief } from "./items/belief.js";

export class BWActor extends Actor {
    stock: string;
    age: number;
    lifepathString: string;
    alias: string;
    homeland: string;
    features: string;

    type: string;
    flags: any;
    will: Ability;
    power: Ability;
    agility: Ability;
    perception: Ability;
    forte: Ability;
    speed: Ability;
    health: Ability;
    steel: Ability;
    circles: Ability;
    resources: Ability;
    stride: number;
    mountedstride: number;

    prepareData() {
        super.prepareData();
    }
}

interface CharacterData extends ActorData {
    data: BWCharacterData;
    items: Item[];
}

interface BWCharacterData extends Common {
    stock: string;
    age: number;
    lifepathString: string;
    alias: string;
    homeland: string;
    features: string;

    beliefs: Item[];
    instincts: Item[];
    traits: Item[];
}

interface Common {
    will: Ability;
    power: Ability;
    agility: Ability;
    perception: Ability;
    forte: Ability;
    speed: Ability;
    health: Ability;
    steel: Ability;
    circles: Ability;
    resources: Ability;
    stride: number;
    mountedstride: number;
}

interface Ability {
    exp: number;
    routine: number;
    difficult: number;
    challening: number;
    shade: string;
    open: boolean;
}