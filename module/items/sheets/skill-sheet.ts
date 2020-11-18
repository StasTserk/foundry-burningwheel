import { skillTypeSelect } from "../../constants.js";
import { Skill } from "../skill.js";

export class SkillSheet extends ItemSheet {
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

interface SkillSheetData extends ItemSheetData {
    skillTypes: { [index: string]: string };
    skillRoots: { [index: string]: string };
}
