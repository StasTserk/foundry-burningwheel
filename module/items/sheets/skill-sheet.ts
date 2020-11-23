import { skillTypeSelect } from "../../constants.js";
import { Skill } from "../skill.js";
import { BWItemSheet, BWItemSheetData } from "./bwItemSheet.js";

export class SkillSheet extends BWItemSheet {
    static get defaultOptions(): FormApplicationOptions {
        return mergeObject(super.defaultOptions, {});
    }

    get template(): string {
        return "systems/burningwheel/templates/items/skill.hbs";
    }

    getData(): SkillSheetData {
        const data = super.getData() as SkillSheetData;

        data.skillTypes = skillTypeSelect;
        data.skillRoots = {};
        Object.assign(data.skillRoots, (this.item as Skill).getRootSelect());
        return data;
    }
}

interface SkillSheetData extends BWItemSheetData {
    skillTypes: { [index: string]: string };
    skillRoots: { [index: string]: string };
}
