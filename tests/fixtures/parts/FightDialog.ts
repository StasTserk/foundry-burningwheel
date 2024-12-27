import { Page, expect, Locator } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';

export class FightDialog {
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
