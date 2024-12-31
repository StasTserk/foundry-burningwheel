import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields = 'Restrictions' | 'Aptitude';

type CheckboxFields =
    | 'Wild Fork'
    | 'Open'
    | 'Magical'
    | 'Training Skill'
    | 'Requires Tools'
    | 'Learning';

type SelectFields = 'Skill Type' | 'Root 1' | 'Root 2';

class SkillDialog extends BaseItemDialog<
    LabelFields,
    CheckboxFields,
    SelectFields
> {
    constructor(fixture: SkillFixture, name: SeededItems) {
        super(fixture, name);
    }
}

export class SkillFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'skill'>) {
        await this.open(name);
        return new SkillDialog(this, name);
    }

    static getOpenDialog({
        page,
        gamePage,
        test,
        name,
    }: {
        page: Page;
        gamePage: GameFixture;
        test: FixtureBase;
        name: string;
    }) {
        return new SkillDialog(
            new SkillFixture(page, gamePage, test),
            name as SeededItems
        );
    }
}
