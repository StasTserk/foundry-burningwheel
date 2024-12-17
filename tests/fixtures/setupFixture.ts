import { expect, Page } from 'playwright/test';
import { baseFixture } from './baseFixture';

class SetupPage {
    constructor(private readonly page: Page, private readonly host: string) {}

    async dismissTour() {
        await setupFixture.step('dismiss tour notifications', async () => {
            await expect(
                await this.page.getByText(/backups overview/i)
            ).toBeVisible();
            await this.page.waitForTimeout(250); // let animations settle
            await this.page.locator('i.close.fas.fa-times-circle').click();
            await this.page
                .locator('aside.tour-center-step > header')
                .getByRole('button')
                .dispatchEvent('click');
            await expect(
                await this.page.getByText(/backups overview/i)
            ).not.toBeVisible();
        });
    }

    async enterWorldAsUser(name: string) {
        await setupFixture.step(`log into game as ${name}`, async () => {
            await this.page.locator('li[data-package-id="test-world"]').hover();
            await this.page
                .locator('li[data-package-id="test-world"]')
                .locator('a')
                .click();
            await this.page.waitForURL(`${this.host}/join`);
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
    setupPage: async ({ page, foundryHost }, use) =>
        await use(new SetupPage(page, foundryHost)),
});
