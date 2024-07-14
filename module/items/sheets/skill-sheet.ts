import { skillTypeSelect } from '../../constants';
import { Skill } from '../skill';
import { BWItemSheet, BWItemSheetData } from './bwItemSheet';

export class SkillSheet extends BWItemSheet {
    static get defaultOptions(): BaseEntitySheet.Options {
        return super.defaultOptions;
    }

    get template(): string {
        return 'systems/burningwheel/templates/items/skill.hbs';
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
