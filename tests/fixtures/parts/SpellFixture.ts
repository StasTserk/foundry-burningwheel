import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields =
    | 'Obstacle'
    | 'Actions'
    | 'Origin'
    | 'Area of Effect'
    | 'Element'
    | 'Impetus'
    | 'Duration'
    | 'Resource Point Cost'
    // weapon fields
    | 'Will Bonus'
    | 'Versus Armor'
    | 'Optimal Range'
    | 'Extreme Range'
    | 'Max Range';
type CheckBoxFields = 'Up Spell' | 'Variable Ob' | 'Is A Weapon' | 'Half Will';
type SelectFields = 'Length';
class SpellDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }
}
export class SpellFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'spell'>) {
        await super.open(name);
        return new SpellDialog(this, name);
    }
}
