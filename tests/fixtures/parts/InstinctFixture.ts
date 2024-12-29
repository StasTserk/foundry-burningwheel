import { Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';
import { BaseItemDialog, BaseItemFixture } from './BaseItemFixture';
import { SeededItems } from '../SeededData';

class InstinctDialog extends BaseItemDialog {
    constructor(fixture: InstinctFixture, name: SeededItems) {
        super(fixture, name);
    }

    get fateSpent() {
        return this.locator.getByPlaceholder('F', { exact: true });
    }

    async setFateSpent(val: string) {
        await this.fateSpent.fill(val);
        return this.fateSpent.blur();
    }

    get personaSpent() {
        return this.locator.getByPlaceholder('P', { exact: true });
    }

    async setPersonaSpent(val: string) {
        await this.personaSpent.fill(val);
        return this.personaSpent.blur();
    }

    get deedsSpent() {
        return this.locator.getByPlaceholder('D', { exact: true });
    }

    async setDeedsSpent(val: string) {
        await this.deedsSpent.fill(val);
        return this.deedsSpent.blur();
    }

    get description() {
        return this.locator.locator('textarea[name="system.text"]');
    }
}

export class InstinctFixture extends BaseItemFixture {
    constructor(page: Page, gamePage: GameFixture, test: FixtureBase) {
        super(page, gamePage, test);
    }

    async openDialog(name: SeededItems<'instinct'>) {
        await this.open(name);
        return new InstinctDialog(this, name);
    }
}
