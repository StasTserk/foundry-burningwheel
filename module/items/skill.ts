import { Ability, BWActor, TracksTests } from "../bwactor.js";
import { ShadeString, updateTestsNeeded } from "../helpers.js";
import { DisplayClass, ItemType, BWItemData } from "./item.js";

export class Skill extends Item<SkillData> {
    prepareData(): void {
        updateTestsNeeded(this.data.data);
        Skill.calculateAptitude.bind(this)();
        this.data.data.safeId = this._id;
    }

    static calculateAptitude(this: Skill): void {
        if (!this.actor) { return; }
        let aptitudeMod = this.actor.getAptitudeModifiers(this.name) + this.actor.getAptitudeModifiers(this.data.data.skilltype);

        aptitudeMod += this.actor.getAptitudeModifiers(this.data.data.root1);
        
        if (this.data.data.root2) {
            aptitudeMod += this.actor.getAptitudeModifiers(`${this.data.data.root1}/${this.data.data.root2}`)
                + this.actor.getAptitudeModifiers(`${this.data.data.root2}/${this.data.data.root1}`);
                + this.actor.getAptitudeModifiers(this.data.data.root2);
        }
        
        const player = this.actor;
        const root1exp = (player.data.data[this.data.data.root1] as Ability).exp;
        const root2exp = this.data.data.root2 ? (player.data.data[this.data.data.root2] as Ability).exp : root1exp;
        const rootAvg = Math.floor((parseInt(root1exp, 10) + parseInt(root2exp, 10)) / 2);
        this.data.data.aptitude = 10 - rootAvg + aptitudeMod;
    }

    static disableIfWounded(this: SkillDataRoot, woundDice: number): void {
        if (!this.data.learning && parseInt(this.data.exp, 10) <= woundDice) {
            this.data.cssClass += " wound-disabled";
        }
    }
    data: SkillDataRoot;
    get actor(): BWActor {
        return super.actor as BWActor;
    }

    get type(): ItemType {
        return super.type as ItemType;
    }
}

export interface SkillDataRoot extends ItemData<SkillData>, BWItemData {
    type: ItemType;
    data: SkillData;
}

export interface SkillData extends TracksTests, DisplayClass {
    name: string;
    shade: ShadeString;

    root1: string;
    root2: string;
    skilltype: string;
    description: string;
    restrictions: string;

    training: boolean;
    open: boolean;
    wildFork: boolean;
    learning: boolean;
    learningProgress: string;

    tools: boolean;

    routineNeeded?: number;
    difficultNeeded?: number;
    challengingNeeded?: number;
    aptitude?: number;
    safeId?: string;
}