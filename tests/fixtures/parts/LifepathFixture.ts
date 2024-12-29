import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields =
    | 'Time'
    | 'Resources'
    | 'Stat Boost'
    | 'Leads'
    | 'Skill Points'
    | 'General Points'
    | 'Skill List'
    | 'Trait Points'
    | 'Trait List'
    | 'Restrictions'
    | 'Requirements'
    | 'Note';

type CheckboxFields = 'Subtract Stats';
type SelectFields = 'Stat Boost';
class LifepathDialog extends BaseItemDialog<
    LabelFields,
    CheckboxFields,
    SelectFields
> {
    constructor(fixture: LifepathFixture, name: SeededItems) {
        super(fixture, name);
    }
}

export class LifepathFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'lifepath'>) {
        await this.open(name);
        return new LifepathDialog(this, name);
    }
}
