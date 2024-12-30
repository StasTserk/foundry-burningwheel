import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields<T extends string = '0' | '1' | '2' | '3'> =
    | 'Resource Point Cost'
    | `attack ${T} name`
    | `attack ${T} power`
    | `attack ${T} add`
    | `attack ${T} va`;

type CheckBoxFields = never;

type SelectFields<T extends string = '0' | '1' | '2' | '3'> =
    | 'Shade'
    | 'Weapon Quality'
    | 'Handedness'
    | `attack ${T} speed`
    | `attack ${T} length`;

class MeleeWeaponDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }

    removeAttack(index: number) {
        return this.locator.getByLabel(`delete attack ${index}`).click();
    }

    addAttack() {
        return this.locator.getByLabel('add new attack').click();
    }
}

export class MeleeWeaponFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'melee weapon'>) {
        await super.open(name);
        return new MeleeWeaponDialog(this, name);
    }
}
