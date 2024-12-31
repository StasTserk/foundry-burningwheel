import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

type LabelFields = never;
type CheckBoxFields = 'Infamous';
type SelectFields = 'Dice';
class ReputationDialog extends BaseItemDialog<
    LabelFields,
    CheckBoxFields,
    SelectFields
> {
    constructor(fixture: BaseItemFixture, name: SeededItems) {
        super(fixture, name);
    }
}
export class ReputationFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'reputation'>) {
        await super.open(name);
        return new ReputationDialog(this, name);
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
        return new ReputationDialog(
            new ReputationFixture(page, gamePage, test),
            name as SeededItems
        );
    }
}
