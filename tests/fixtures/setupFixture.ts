import { expect, Page } from 'playwright/test';
import { baseFixture } from './baseFixture';

type SeededUsers = 'Gamemaster';
class SetupPage {
    constructor(private readonly page: Page, private readonly host: string) {}

    async navigateToLoginPage() {
        await setupFixture.step('dismiss tour notifications', async () => {
            await expect(
                this.page.getByText(/backups overview/i)
            ).toBeVisible();
            await this.page.waitForTimeout(250); // let animations settle
            await this.page.locator('i.fa-regular.fa-circle-xmark').click();
            await expect(
                this.page.getByText(/backups overview/i)
            ).not.toBeVisible();
        });
        await setupFixture.step('navigate to login page', async () => {
            await this.page.locator('li[data-package-id="test-world"]').hover();
            await this.page
                .locator('li[data-package-id="test-world"]')
                .locator('a')
                .click();
            await this.page.waitForURL(`${this.host}/join`);
        });
    }

    async enterWorldAsUser(name: SeededUsers) {
        await setupFixture.step(`log into game as ${name}`, async () => {
            await this.page.getByRole('combobox').selectOption(name);
            await this.page.getByRole('button', { name: /join/i }).click();
            await this.page.waitForURL(`${this.host}/game`);
        });
    }
}

type SetupFixture = {
    setupPage: SetupPage;
};

export const setupFixture = baseFixture.extend<SetupFixture>({
    setupPage: [
        async ({ page, foundryHost }, use) => {
            const settingsPage = new SetupPage(page, foundryHost);
            await settingsPage.navigateToLoginPage();

            return use(settingsPage);
        },
        { timeout: 60_000 },
    ],
});
