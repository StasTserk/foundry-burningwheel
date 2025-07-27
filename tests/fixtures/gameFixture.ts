import { expect, Locator, Page } from 'playwright/test';
import { setupFixture } from './setupFixture';
import { ItemType } from './SeededData';

type FoundryTab =
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

export class GameFixture {
    private activeTab: FoundryTab = 'Chat Messages';
    constructor(private readonly page: Page, private readonly host: string) {}

    async waitForLoad() {
        await test.step('wait for game load to finish', async () => {
            expect(this.page.url()).toEqual(`${this.host}/game`);
            await expect(this.page.locator('#sidebar')).not.toBeEmpty();
            const boundingBox = await this.page
                .locator('.notification.warning.permanent')
                .boundingBox();
            if (boundingBox) {
                this.page.mouse.click(
                    boundingBox.x + boundingBox.width,
                    boundingBox.y
                );
            }
            await this.page.keyboard.press('Space');
            await expect(
                this.page.locator('div.difficulty-dialog')
            ).toBeVisible();
        });
    }

    async cleanUpPage() {
        await test.step('clean up some page basics', async () => {
            await this.page.getByLabel(/clear chat log/i).click();
            await expect(
                this.page.getByRole('heading', { name: 'Flush Chat Log' })
            ).toBeVisible();
            await this.page.getByRole('button', { name: /yes/i }).click();
            await expect(
                this.page.getByRole('heading', { name: 'Flush Chat Log' })
            ).not.toBeVisible();
        });
    }

    async openTab(tab: FoundryTab) {
        if (tab !== this.activeTab) {
            await test.step(`navigate to the ${tab} tab`, async () => {
                await this.page.getByLabel(tab, { exact: true }).click();
                this.activeTab = tab;
            });
        }
    }

    expectOpenedDialog(title: string | RegExp) {
        return expect(
            this.page.getByRole('dialog').filter({ hasText: title })
        ).toBeVisible();
    }

    clickDialogButton(title: string | RegExp, button: string | RegExp) {
        return this.page
            .getByRole('dialog')
            .filter({ hasText: title })
            .getByRole('button', { name: button })
            .click();
    }

    async closeDialog(title: string | RegExp) {
        await this.page
            .getByRole('dialog')
            .filter({ hasText: title })
            .getByText(/close/i)
            .click();
        await expect(this.page.getByRole('dialog').filter({ hasText: title }), {
            message: `Ensure ${title} dialog has closed`,
        }).not.toBeVisible();
    }

    async createActor(name: string, type: 'character' | 'npc' | 'setting') {
        await this.openTab('Actors');
        await test.step(`Create a(n) ${type} named ${name}`, async () => {
            const dialogLocator = this.page
                .getByRole('dialog')
                .filter({ hasText: 'Create actor' });
            await this.page
                .getByRole('button', { name: 'Create Actor' })
                .click();
            await expect(dialogLocator).toBeVisible();
            await dialogLocator.getByRole('textbox').fill(name);
            await dialogLocator.getByRole('combobox').selectOption(type);
            await dialogLocator
                .getByRole('button', { name: /create actor/i })
                .click();
        });
    }

    async createItem(name: string, type: ItemType) {
        await this.openTab('Items');
        await test.step(`Create a(n) ${type} named ${name}`, async () => {
            const dialogLocator = this.page
                .getByRole('dialog')
                .filter({ hasText: 'Create Item' });
            await this.page
                .getByRole('button', { name: 'Create Item' })
                .click();
            await expect(dialogLocator).toBeVisible();
            await dialogLocator.getByRole('textbox').fill(name);
            await dialogLocator.getByRole('combobox').selectOption(type);
            await dialogLocator
                .getByRole('button', { name: /create item/i })
                .click();
        });
    }

    async getSelectedValue(select: Locator) {
        return select.locator('option[selected]').innerText();
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
        { timeout: 60_000 },
    ],
});
