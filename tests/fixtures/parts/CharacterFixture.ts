import { expect, Page } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';

type SeededActors = 'Romeo' | 'Tybalt' | 'Hamlet';

export class CharacterFixture {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async openCharacter(name: SeededActors) {
        await this.gamePage.openTab('Actors');
        await this.test.step(`Open actor named '${name}'`, async () => {
            await this.page.getByText(name).click();
            await expect(this.page.locator('div.app.bw-app')).toBeVisible();
        });
    }
}
