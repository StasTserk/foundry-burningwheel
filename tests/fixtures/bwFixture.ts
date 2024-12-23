import { Page } from 'playwright';
import {
    GameFixture,
    test as testLoggedOut,
    testAsGm as testLoggedIn,
} from './gameFixture';
import { expect, Locator } from 'playwright/test';

type FixtureBase = typeof testLoggedOut & typeof testLoggedIn;

type BwFixture = {
    dowDialog: DoWDialog;
    fightDialog: FightDialog;
    rollDialog: RollDialog;
};

class DoWDialog {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async OpenDialog() {
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

class FightDialog {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async OpenDialog() {
        await this.gamePage.openTab('Combat Encounters');
        await this.test.step('open fight dialog', async () => {
            await this.page.getByRole('button', { name: /fight/i }).click();
        });
    }

    expectVisibleAction({
        fighter,
        volley,
        value,
    }: {
        fighter: number;
        volley: number;
        value: string | string[];
    }) {
        return expect(
            this.page.getByLabel(`participant ${fighter} action ${volley}`),
            {
                message: `Expect p${fighter} v${volley} to be ${value}`,
            }
        ).toHaveText(value);
    }

    async expectHiddenAction({
        fighter,
        volley,
    }: {
        fighter: number;
        volley: number;
    }) {
        return expect(
            this.page
                .getByLabel(`participant ${fighter} action ${volley}`)
                .locator('i'),
            {
                message: `Expect p${fighter} v${volley} to be hidden`,
            }
        ).toBeVisible();
    }

    async expectScriptedAction({
        fighter,
        volley,
        action,
        value,
    }: {
        fighter: number;
        volley: number;
        action: number;
        value: string;
    }) {
        return expect(
            this.page
                .getByLabel(`participant ${fighter} script ${volley}`)
                .locator(`select[name="action${action}"]`)
                .locator('option[selected]'),
            {
                message: `Expect p${fighter} v${volley} a${action} to be ${value}`,
            }
        ).toHaveText(value);
    }

    playerScript(player: number): Locator {
        return this.page.getByLabel(`participant ${player} script 1`);
    }
}

class RollDialog {
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
}

const extender: Parameters<typeof testLoggedIn.extend<BwFixture>>[0] = {
    dowDialog: async ({ page, gamePage }, use) =>
        await use(new DoWDialog(page, gamePage, test)),
    fightDialog: async ({ page, gamePage }, use) =>
        await use(new FightDialog(page, gamePage, test)),
    rollDialog: async ({ page }, use) => await use(new RollDialog(page)),
};

export const test = testLoggedOut.extend<BwFixture>(extender);
export const testAsGm = testLoggedIn.extend<BwFixture>(extender);
