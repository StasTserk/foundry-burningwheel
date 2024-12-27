import { Page } from 'playwright/test';
import { GameFixture } from '../gameFixture';
import { FixtureBase } from '../bwFixture';

export class DoWDialog {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async openDialog() {
        await this.gamePage.openTab('Combat Encounters');
        await this.test.step('open duel of wits dialog', async () => {
            await this.page
                .getByRole('button', { name: /duel of wits/i })
                .click();
        });
    }

    async getSide1Actions() {
        const s1a1 =
            (await this.page
                .getByLabel('side 1 volley 1')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';
        const s1a2 =
            (await this.page
                .getByLabel('side 1 volley 2')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';
        const s1a3 =
            (await this.page
                .getByLabel('side 1 volley 3')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';

        return [s1a1, s1a2, s1a3];
    }

    async getSide2Actions() {
        const s2a1 =
            (await this.page
                .getByLabel('side 2 volley 1')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';
        const s2a2 =
            (await this.page
                .getByLabel('side 2 volley 2')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';
        const s2a3 =
            (await this.page
                .getByLabel('side 2 volley 3')
                .locator('div:not(.pill-toggle)')
                .innerText()) || 'Hidden';

        return [s2a1, s2a2, s2a3];
    }
}
