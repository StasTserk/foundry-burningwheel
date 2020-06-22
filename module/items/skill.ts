import { TracksTests } from "../actor.js";
import { slugify, updateTestsNeeded } from "../helpers.js";

export class Skill extends Item {
    prepareData() {
        updateTestsNeeded(this.data.data);
        this.data.data.safeId = slugify(this.name);
    }

    data: { data: SkillData } & BaseEntityData;
}

export interface SkillData extends TracksTests, BaseEntityData {
    name: string;
    exp: number;
    shade: string;
    routine: number;
    routineNeeded?: number;
    difficult: number;
    difficultNeeded?: number;
    challenging: number;
    challengingNeeded?: number;
    root1: string;
    root2: string;
    learning: boolean;
    skilltype: string;
    training: boolean;
    description: string;
    safeId: string;
}