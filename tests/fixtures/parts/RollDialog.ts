import { Locator, Page, expect } from 'playwright/test';

export class RollDialog {
    constructor(readonly locator: Locator) {}

    expectOpened() {
        return expect(this.locator).toBeVisible();
    }

    async close() {
        this.locator.getByText(/close/i).click();
        await expect(this.locator).not.toBeVisible();
    }

    get customObstacle() {
        return this.locator.getByLabel('custom obstacle');
    }

    get woundPenalty() {
        return this.locator.getByLabel('wound penalty');
    }

    get exponent() {
        return this.locator.getByLabel('exponent dice');
    }

    get bonusDice() {
        return this.locator.getByLabel('bonus dice');
    }

    get cashDice() {
        return this.locator.getByLabel('cash dice');
    }

    get fundDice() {
        return this.locator.getByLabel('fund dice');
    }

    get taxDice() {
        return this.locator.getByLabel('tax dice');
    }

    get relationshipDice() {
        return this.locator.getByLabel('circles dice');
    }

    get personaDice() {
        return this.locator.getByLabel('persona dice');
    }
    get useDeeds() {
        return this.locator.getByLabel('deeds dice');
    }

    setBonusDice(value: number) {
        return this.bonusDice.fill('' + value);
    }

    fork(name: string) {
        return this.locator
            .getByLabel('fork dice')
            .getByLabel(RegExp(name, 'i'));
    }

    roll() {
        return this.locator
            .getByRole('button', { name: 'Roll', exact: true })
            .click();
    }

    optionalDieModifier(name: string) {
        return this.locator
            .getByLabel('optional dice modifiers')
            .getByLabel(name);
    }

    optionalObModifier(name: string | RegExp) {
        return this.locator
            .getByLabel('optional ob modifiers')
            .getByLabel(name);
    }

    repModifier(name: string | RegExp) {
        return this.locator.getByLabel('rep aff dice').getByLabel(name);
    }

    static getDialog(page: Page, name: string) {
        return new RollDialog(
            page.locator('div.window-app.dialog').filter({
                has: page
                    .locator('h4')
                    .filter({ hasText: new RegExp(name, 'i') }),
            })
        );
    }
}

export class RollFixture {
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
