import { Page, expect } from 'playwright/test';
import { FixtureBase } from '../bwFixture';
import { GameFixture } from '../gameFixture';

export class RangeAndCoverDialog {
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
