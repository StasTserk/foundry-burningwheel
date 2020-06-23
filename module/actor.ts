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
        this._calculatePtgs();
    }

    private _calculatePtgs() {
        let suCount = 0;
        let woundDice = 0;
        this.data.data.ptgs.obPenalty = 0;
        Object.entries(this.data.data.ptgs).forEach(([key, value]) => {
            const w = value as Wound;
            const a = w.amount && parseInt(w.amount[0], 10);
            if ((w && a)) {
                switch (w.threshold) {
                    case "superficial": suCount += a; break;
                    case "light": woundDice += a; break;
                    case "midi": woundDice += a*2; break;
                    case "severe": woundDice += a*3; break;
                    case "traumatic": woundDice += a*4; break;
                }
            }
        });

        if (suCount >= 3) {
            woundDice ++;
        } else if (suCount >= 1) {
            this.data.data.ptgs.obPenalty = 1;
        }
        this.data.data.ptgs.woundDice = woundDice;
    }
}

export interface CharacterData extends ActorData {
    data: BWCharacterData;
    items: Item[];
}

interface BWCharacterData extends Common, DisplayProps, Ptgs {
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

interface Ptgs {
    ptgs: {
        wound1: Wound, wound2: Wound, wound3: Wound, wound4: Wound,
        wound5: Wound, wound6: Wound, wound7: Wound, wound8: Wound,
        wound9: Wound, wound10: Wound, wound11: Wound, wound12: Wound,
        wound13: Wound, wound14: Wound, wound15: Wound, wound16: Wound,
        woundNotes1: string,
        woundNotes2: string,
        woundNotes3: string,

        // not persisted
        obPenalty?: number,
        woundDice?: number
    }
}

interface Wound {
    amount: string[]; // quirk relating to how radio button data is stored
    threshold: string;
}