import { expect, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';

export class BaseItemFixture {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async open(name: string) {
        await this.gamePage.openTab('Items');
        await this.test.step(`Open item named '${name}'`, async () => {
            await this.page.getByText(name).click();
            await this.expectOpened(name);
        });
    }

    expectOpened(name: string) {
        return expect(
            this.page.locator('div.app.bw-app').filter({ hasText: name })
        ).toBeVisible();
    }

    sheet(name: string) {
        return this.page.locator('div.app.bw-app').filter({ hasText: name });
    }
}
