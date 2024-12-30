import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields =
    | 'Power Bonus'
    | 'Incidental:'
    | 'Mark:'
    | 'Superb:'
    | 'Incidental Thresh'
    | 'Mark Thresh'
    | 'Versus Armor'
    | 'Optimal Range'
    | 'Extreme Range'
    | 'Max Range'
    | 'Resource Point Cost';
type CheckBoxFields = 'Use Power' | 'Use Gunpowder';
type SelectFields = 'Weapon Quality' | 'Shade';
class RangedWeaponDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }
}

export class RangedWeaponFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'ranged weapon'>) {
        await super.open(name);
        return new RangedWeaponDialog(this, name);
    }
}
