import { Page, expect } from 'playwright/test';

export class RollDialog {
    constructor(private readonly page: Page) {}

    async expectOpened(skill: string) {
        await expect(
            this.page.locator('h4').filter({ hasText: `${skill} Test` })
        ).toBeVisible();
    }

    async close(skill: string) {
        await this.page
            .locator(`a:text("Close"):near(h4:text("${skill} Test"))`)
            .click();
        await expect(
            this.page.locator('h4').filter({ hasText: `${skill} Test` })
        ).not.toBeVisible();
    }

    expectOptionalDieModifier(name: string, value?: string | RegExp) {
        if (value !== undefined) {
            return expect(
                this.page.getByLabel('optional dice modifiers').getByLabel(name)
            ).toHaveValue(value);
        }
        return expect(
            this.page.getByLabel('optional dice modifiers').getByLabel(name)
        ).toBeVisible();
    }

    async expectOptionalObstacleModifiers(
        name: string,
        value?: string | RegExp
    ) {
        if (value !== undefined) {
            return expect(
                this.page.getByLabel('optional ob modifiers').getByLabel(name)
            ).toHaveValue(value);
        }

        return expect(
            this.page.getByLabel('optional ob modifiers').getByLabel(name)
        ).toBeVisible();
    }
}
