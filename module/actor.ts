import { updateTestsNeeded } from "./helpers.js";
import { Skill, SkillDataRoot } from "./items/skill.js";

export class BWActor extends Actor {
    data: CharacterData;

    prepareData() {
        super.prepareData();
        if (this.data.type === "character") {
            this._prepareCharacterData();
        }
    }

    getForkOptions(skillName: string): Skill[] {
        return this.data.forks.filter(s => s.name !== skillName);
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

        this.data.data.reflexesExp = Math.floor((parseInt(this.data.data.perception.exp, 10) +
            parseInt(this.data.data.agility.exp, 10) +
            parseInt(this.data.data.speed.exp, 10)) / 3);

        this.data.data.mortalWound = Math.floor((parseInt(this.data.data.power.exp, 10) +
            parseInt(this.data.data.forte.exp, 10)) / 2 + 6);
        this.data.data.hesitation = 10 - parseInt(this.data.data.will.exp, 10);

        this.data.forks = [];
        if (this.data.items) {
            this.data.items.forEach(i => {
                if (i.type === "skill" && !(i as unknown as SkillDataRoot).data.learning) {
                    this.data.forks.push(i);
                }
            })
        }
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
    forks: Skill[];
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

    hesitation?: number;
    mortalWound?: number;
    reflexesExp?: number;
    reflexesShade?: string;
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
    exp: string;
    routine: string;
    difficult: string;
    challenging: string;

    // derived values
    routineNeeded?: number;
    difficultNeeded?: number;
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