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
    rncDialog: RangeAndCoverDialog;
    rollDialog: RollDialog;
};

class DoWDialog {
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

class FightDialog {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async openDialog() {
        await this.gamePage.openTab('Combat Encounters');
        await this.test.step('open fight dialog', async () => {
            await this.page.getByRole('button', { name: /fight/i }).click();
        });
    }

    async expectVisibleAction({
        fighter,
        volley,
        value,
    }: {
        fighter: number;
        volley: number;
        value: string | string[];
    }) {
        const values = Array.isArray(value) ? value : [value];

        for (let i = 0; i < values.length; i++) {
            await expect(
                this.page
                    .getByLabel(`participant ${fighter} action ${volley}`)
                    .locator('div.action-card')
                    .nth(i),
                {
                    message: `Expect p${fighter} v${volley} a${i} to be ${values[i]}`,
                }
            ).toHaveText(values[i]);
        }
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

    scriptAction({
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
        return this.page
            .getByLabel(`participant ${fighter} script ${volley}`)
            .locator(`select[name="action${action}"]`)
            .selectOption(value);
    }

    playerScript(player: number): Locator {
        return this.page.getByLabel(`participant ${player} script 1`);
    }

    toggleVolleyVisibility(volley: 1 | 2 | 3) {
        return this.page.getByText(`Show Volley ${volley}`).click();
    }

    resetRound() {
        return this.page.getByRole('button', { name: /reset round/i }).click();
    }

    clearDialog() {
        return this.page.getByRole('button', { name: /clear all/i }).click();
    }

    togglePlayerVisibility(index: number) {
        return this.page.getByLabel(`participant ${index} controls`).click();
    }

    removeParticipant(index: number) {
        return this.page
            .getByLabel(`participant ${index} controls`)
            .locator('i')
            .click();
    }

    initiateRoll({ fighter, skill }: { fighter: number; skill: string }) {
        return this.page
            .getByLabel(`participant ${fighter} card`)
            .getByRole('button', { name: skill })
            .click();
    }

    async setWeaponPenalty({
        fighter,
        weaponPenalty,
    }: {
        fighter: number;
        weaponPenalty: number;
    }) {
        const input = this.page
            .getByLabel(`participant ${fighter} controls`)
            .locator('input[name="positionPenalty"]');
        await input.fill(weaponPenalty.toString());
        return input.blur();
    }
    async setEngagement({
        fighter,
        engagement,
    }: {
        fighter: number;
        engagement: number;
    }) {
        const input = this.page
            .getByLabel(`participant ${fighter} controls`)
            .locator('input[name="engagementBonus"]');

        await input.fill(engagement.toString());
        return input.blur();
    }

    pickWeapon({ fighter, weapon }: { fighter: number; weapon: string }) {
        return this.page
            .getByLabel(`participant ${fighter} controls`)
            .getByRole('combobox')
            .selectOption(weapon);
    }
}

class RangeAndCoverDialog {
    constructor(
        private readonly page: Page,
        private readonly gamePage: GameFixture,
        private readonly test: FixtureBase
    ) {}

    async openDialog() {
        await this.gamePage.openTab('Combat Encounters');
        await this.test.step('open fight dialog', async () => {
            await this.page
                .getByRole('button', { name: /range and cover/i })
                .click();
        });
    }

    async expectEditableTeamRange(team: 0 | 1, range: string) {
        expect(
            await this.gamePage.getSelectedValue(
                this.page
                    .getByLabel(`team ${team} controls`)
                    .locator('select[name="range"]')
            )
        ).toBe(range);
    }

    editableTeamStat(
        team: 0 | 1,
        stat: 'Stride' | 'Weapon' | 'Position' | 'Misc.'
    ) {
        return this.page.getByLabel(`team ${team} controls`).getByLabel(stat);
    }

    expectVisibleAction(team: 0 | 1, volley: 1 | 2 | 3, action: string) {
        return expect(
            this.page.getByLabel(`team ${team} action ${volley}`).locator('div')
        ).toHaveText(action);
    }

    expectHiddenAction(team: 0 | 1, volley: 1 | 2 | 3) {
        return expect(
            this.page
                .getByLabel(`team ${team} action ${volley}`)
                .locator('div.card-back')
        ).toBeVisible();
    }

    expectTeamEditable(team: 0 | 1 | 2) {
        return expect(
            this.page.getByLabel(`team ${team} controls`).getByLabel('Stride')
        ).toBeVisible();
    }

    expectTeamNotEditable(team: 0 | 1) {
        return expect(
            this.page.getByLabel(`team ${team} controls`).getByLabel('Stride')
        ).not.toBeVisible();
    }

    toggleEditable(team: 0 | 1) {
        return this.page
            .getByLabel(`team ${team} controls`)
            .locator('i')
            .first()
            .click();
    }

    scriptAction(team: number, volley: number, action: string) {
        return this.page
            .getByLabel(`team ${team} action ${volley}`)
            .getByRole('combobox')
            .selectOption(action);
    }

    clearAll() {
        return this.page.getByRole('button', { name: /clear all/i }).click();
    }

    resetRound() {
        return this.page.getByRole('button', { name: /reset round/i }).click();
    }

    addTeammate(team: number, name: string) {
        return this.page
            .getByLabel(`team ${team} controls`)
            .locator('select[name="newMember"]')
            .selectOption(name);
    }

    removeTeammate(team: number, name: string) {
        return this.page
            .getByLabel(`team ${team} members`)
            .locator('li')
            .filter({ hasText: name })
            .locator('i')
            .click();
    }

    addNewTeam(name: string) {
        return this.page.locator('select[name="newTeam"]').selectOption(name);
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

const extender: Parameters<typeof testLoggedIn.extend<BwFixture>>[0] = {
    dowDialog: async ({ page, gamePage }, use) =>
        await use(new DoWDialog(page, gamePage, test)),
    fightDialog: async ({ page, gamePage }, use) =>
        await use(new FightDialog(page, gamePage, test)),
    rollDialog: async ({ page }, use) => await use(new RollDialog(page)),
    rncDialog: async ({ page, gamePage }, use) =>
        await use(new RangeAndCoverDialog(page, gamePage, test)),
};

export const test = testLoggedOut.extend<BwFixture>(extender);
export const testAsGm = testLoggedIn.extend<BwFixture>(extender);
