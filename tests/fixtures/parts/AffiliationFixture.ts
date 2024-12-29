import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

class AffiliationDialog extends BaseItemDialog {
    constructor(fixture: AffiliationFixture, name: SeededItems) {
        super(fixture, name);
    }

    setDieValue(val: 0 | 1 | 2 | 3) {
        return this.locator.getByRole('combobox').selectOption(`${val}`);
    }

    get dieValue() {
        return this.locator.getByRole('combobox');
    }
}

export class AffiliationFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems) {
        await this.open(name);
        return new AffiliationDialog(this, name);
    }
}
