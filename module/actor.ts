import { updateTestsNeeded } from "./helpers.js";
import { Skill } from "./items/skill.js";

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

    data: CharacterData;

    prepareData() {
        super.prepareData();
        if (this.data.type === "character") {
            this._prepareCharacterData();
        }
    }


    private _prepareCharacterData() {
        updateTestsNeeded(this.data.data.will);
        updateTestsNeeded(this.data.data.power);
        updateTestsNeeded(this.data.data.perception);
        updateTestsNeeded(this.data.data.agility);
        updateTestsNeeded(this.data.data.forte);
        updateTestsNeeded(this.data.data.speed);
        updateTestsNeeded(this.data.data.health);
        updateTestsNeeded(this.data.data.steel);
        updateTestsNeeded(this.data.data.circles);
        updateTestsNeeded(this.data.data.resources);
        updateTestsNeeded(this.data.data.custom1);
        updateTestsNeeded(this.data.data.custom2);
    }
}

export interface CharacterData extends ActorData {
    data: BWCharacterData;
    items: Item[];
}

interface BWCharacterData extends Common, DisplayProps {
    stock: string;
    age: number;
    lifepathString: string;
    alias: string;
    homeland: string;
    features: string;

    beliefs: Item[];
    instincts: Item[];
    traits: Item[];
    skills: Skill[];
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
    custom1: Ability & { name: string };
    custom2: Ability & { name: string };
    stride: number;
    mountedstride: number;
}

export interface Ability extends TracksTests {
    shade: string;
    open: boolean;
}

export interface TracksTests {
    exp: number;
    routine: number;
    routineNeeded?: number;
    difficult: number;
    difficultNeeded?: number;
    challenging: number;
    challengingNeeded?: number;
}

export interface DisplayProps {
    collapseBeliefs: boolean;
    collapseInstincts: boolean;
    collapseTraits: boolean;
    collapseStats: boolean;
    collapseAttributes: boolean;
    collapseSkills: boolean;
    collapsePtgs: boolean;
}

