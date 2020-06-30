import { skillRootSelect, skillTypeSelect } from "../../constants.js";

export class SkillSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    get template() {
        return "systems/burningwheel/templates/items/skill.html";
    }

    getData() {
        const data = super.getData() as SkillSheetData;
        data.skillTypes = skillTypeSelect;
        data.skillRoots = skillRootSelect;
        return data;
    }
}

interface SkillSheetData extends ItemSheetData {
    skillTypes: { [index: string]: string };
    skillRoots: { [index: string]: string };
}
