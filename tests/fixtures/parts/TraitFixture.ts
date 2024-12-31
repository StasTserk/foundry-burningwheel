import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields =
    | 'Restrictions'
    | 'Cost'
    // Die trait fields
    | 'die rolls affected'
    | 'ob rolls affected'
    | 'Die Modifier'
    | 'Ob Modifier'
    | 'Reputation Name'
    | 'reputation dice'
    | 'Affiliation Name'
    | 'affiliation dice'
    | 'Aptitude Target'
    | 'Amount'
    // die trait fields
    | 'Call-on Rolls';

type CheckBoxFields =
    // die trait fields
    | 'Has Die Modifier'
    | 'Has Ob Modifier'
    | 'Adds Reputation'
    | 'Adds Affiliation'
    | 'Changes Aptitude'
    | 'Infamous';
type SelectFields = 'Trait Type';

class TraitDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }
}
export class TraitFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'trait', 'Call-on' | 'Die'>) {
        await super.open(name);
        return new TraitDialog(this, name);
    }
}
