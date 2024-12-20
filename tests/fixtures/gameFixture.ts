import { expect, Page } from 'playwright/test';
import { setupFixture } from './setupFixture';

type TabName =
    | 'Chat Messages'
    | 'Combat Encounters'
    | 'Scenes'
    | 'Items'
    | 'Actors'
    | 'Journal'
    | 'Rollable Tables'
    | 'Card Stacks'
    | 'Playlists'
    | 'Compendium Packs';

class GameFixture {
    constructor(private readonly page: Page, private readonly host: string) {}

    async waitForLoad() {
        await test.step('wait for game load to finish', async () => {
            expect(this.page.url()).toEqual(`${this.host}/game`);
            await expect(this.page.locator('#sidebar')).not.toBeEmpty();
            await this.page.locator('#notifications i').click();
        });
    }

    async cleanUpPage() {
        await test.step('clean up some page basics', async () => {
            await this.page.getByLabel(/clear chat log/i).click();
            await expect(
                await this.page.getByRole('heading', { name: 'Flush Chat Log' })
            ).toBeVisible();
            await this.page.getByRole('button', { name: /yes/i }).click();
            await expect(
                await this.page.getByRole('heading', { name: 'Flush Chat Log' })
            ).not.toBeVisible();
        });
    }

    async openTab(tab: TabName) {
        await test.step(`navigate to the ${tab} tab`, async () => {
            await this.page.getByLabel(tab, { exact: true }).click();
        });
    }
}

type GameTestFixture = {
    gamePage: GameFixture;
};

export const test = setupFixture.extend<GameTestFixture>({
    gamePage: ({ page, foundryHost }, use) =>
        use(new GameFixture(page, foundryHost)),
});

export const testAsGm = setupFixture.extend<GameTestFixture>({
    gamePage: [
        async ({ page, foundryHost, setupPage }, use) => {
            const game = new GameFixture(page, foundryHost);
            await setupPage.enterWorldAsUser('Gamemaster');
            await game.waitForLoad();
            return use(game);
        },
        { timeout: 30_000 },
    ],
});
