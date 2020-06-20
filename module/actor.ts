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
        this._updateTestsNeeded(this.data.data.will);
        this._updateTestsNeeded(this.data.data.power);
        this._updateTestsNeeded(this.data.data.perception);
        this._updateTestsNeeded(this.data.data.agility);
        this._updateTestsNeeded(this.data.data.forte);
        this._updateTestsNeeded(this.data.data.speed);
        this._updateTestsNeeded(this.data.data.health);
        this._updateTestsNeeded(this.data.data.steel);
        this._updateTestsNeeded(this.data.data.circles);
        this._updateTestsNeeded(this.data.data.resources);
        this._updateTestsNeeded(this.data.data.custom1);
        this._updateTestsNeeded(this.data.data.custom2);
    }

    private _updateTestsNeeded(ability: Ability) {
        const values = AbilityLookup[ability.exp];
        ability.routineNeeded = values.r;
        ability.challengingNeeded = values.c;
        ability.difficultNeeded = values.d;
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

export interface Ability {
    exp: number;
    routine: number;
    routineNeeded?: number;
    difficult: number;
    difficultNeeded?: number;
    challenging: number;
    challengingNeeded?: number;
    shade: string;
    open: boolean;
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

const AbilityLookup = {
    "1": { r: 1, d: 1, c: 1},
    "2": { r: 2, d: 1, c: 1},
    "3": { r: 3, d: 2, c: 1},
    "4": { r: 4, d: 2, c: 1},
    "5": { r: 0, d: 3, c: 1},
    "6": { r: 0, d: 3, c: 2},
    "7": { r: 0, d: 4, c: 2},
    "8": { r: 0, d: 4, c: 3},
    "9": { r: 0, d: 5, c: 3},
}