import { expect } from '../../node_modules/playwright/test';
import { testAsGm as test } from '../fixtures/index';

test('loads data correctly', async ({ page, fightDialog }) => {
    await fightDialog.openDialog();
    await expect(
        page.getByRole('dialog').getByRole('heading', { name: 'fight' }),
        { message: 'ensure dialog opens' }
    ).toBeVisible();

    await test.step('fighters loaded correctly', async () => {
        await expect(
            page.getByLabel('participant 0 card').getByText('Romeo')
        ).toBeVisible();
        await expect(
            page.getByLabel('participant 1 card').getByText('Tybalt')
        ).toBeVisible();
    });

    await test.step('actions loaded correctly', async () => {
        await fightDialog.expectVisibleAction({
            fighter: 0,
            volley: 1,
            value: 'Strike',
        });
        await fightDialog.expectVisibleAction({
            fighter: 1,
            volley: 1,
            value: 'Stand & Drool',
        });
        await fightDialog.expectHiddenAction({ fighter: 1, volley: 2 });

        await fightDialog.expectScriptedAction({
            fighter: 0,
            volley: 1,
            action: 1,
            value: 'Strike',
        });
        await fightDialog.expectScriptedAction({
            fighter: 0,
            volley: 1,
            action: 2,
            value: 'Do Nothing',
        });
    });

    await test.step('Sets visibility correctly', async () => {
        await expect(fightDialog.playerScript(0)).not.toBeEmpty();
        await expect(fightDialog.playerScript(1)).toBeEmpty();
        await expect(
            page.getByRole('checkbox', { name: /show volley 1/i })
        ).toBeChecked();
        await expect(
            page.getByRole('checkbox', { name: /show volley 2/i })
        ).not.toBeChecked();
    });
});

test('showing another volley reveals actions', async ({
    page,
    fightDialog,
}) => {
    await fightDialog.openDialog();
    await page.getByText('Show Volley 2').click();

    await fightDialog.expectVisibleAction({
        fighter: 0,
        volley: 2,
        value: 'Avoid',
    });

    await fightDialog.expectVisibleAction({
        fighter: 1,
        volley: 2,
        value: 'Run Screaming',
    });
});

test('toggling action hiding reveals all', async ({ page, fightDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.togglePlayerVisibility(1);
    await page.waitForTimeout(1);
    await fightDialog.expectVisibleAction({
        fighter: 1,
        volley: 1,
        value: 'Stand & Drool',
    });
    await fightDialog.expectScriptedAction({
        fighter: 1,
        volley: 1,
        action: 1,
        value: 'Stand & Drool',
    });
    await fightDialog.expectScriptedAction({
        fighter: 1,
        volley: 1,
        action: 2,
        value: 'Do Nothing',
    });
});

test('actions can be changed', async ({ fightDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.scriptAction({
        fighter: 0,
        volley: 1,
        action: 2,
        value: 'Avoid',
    });
    await fightDialog.expectVisibleAction({
        fighter: 0,
        volley: 1,
        value: ['Strike', 'Avoid'],
    });
    await fightDialog.expectScriptedAction({
        fighter: 0,
        volley: 1,
        action: 3,
        value: 'Do Nothing',
    });
});

test('skill buttons bring up dialog', async ({ fightDialog, rollDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.initiateRoll({ fighter: 0, skill: 'Speed' });
    await rollDialog.expectOpened('Speed');
});

test('weapon roll selects correct skill', async ({
    fightDialog,
    rollDialog,
}) => {
    await fightDialog.openDialog();
    await fightDialog.initiateRoll({ fighter: 0, skill: 'Skill' });
    await rollDialog.expectOpened('Sword');
});

test('property applies dice modifiers', async ({ fightDialog, rollDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.setEngagement({ fighter: 0, engagement: 1 });
    await fightDialog.setWeaponPenalty({ fighter: 0, weaponPenalty: 2 });
    await fightDialog.initiateRoll({ fighter: 0, skill: 'Skill' });
    await rollDialog.expectOpened('Sword');
    await rollDialog.expectOptionalDieModifier('Engagement Bonus', '1');
    await rollDialog.expectOptionalObstacleModifiers(
        'Weapon Disadvantage',
        '2'
    );
});

test('weapon can be changed', async ({ fightDialog, rollDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.pickWeapon({ fighter: 0, weapon: 'Bare Fist' });
    await fightDialog.initiateRoll({ fighter: 0, skill: 'Skill' });
    await rollDialog.expectOpened('Brawling');
});

test('round can be cleared', async ({ fightDialog }) => {
    await fightDialog.openDialog();
    await fightDialog.resetRound();
    await fightDialog.expectHiddenAction({ fighter: 0, volley: 1 });
    await fightDialog.expectHiddenAction({ fighter: 1, volley: 1 });
    await fightDialog.expectHiddenAction({ fighter: 0, volley: 2 });
    await fightDialog.expectHiddenAction({ fighter: 1, volley: 2 });
    await fightDialog.expectScriptedAction({
        fighter: 0,
        volley: 1,
        action: 1,
        value: 'Do Nothing',
    });
});

test('dialog can be cleared', async ({ fightDialog, page }) => {
    await fightDialog.openDialog();
    await fightDialog.clearDialog();
    await expect(page.getByLabel('participant 0 card'), {
        message: 'No participant cards are visible',
    }).not.toBeVisible();
});

test('can remove participant', async ({ fightDialog, page }) => {
    await fightDialog.openDialog();
    await fightDialog.removeParticipant(1);
    await expect(page.getByLabel('participant 0 card').getByText('Romeo'), {
        message: 'First participant is still around',
    }).toBeVisible();
    await expect(page.getByLabel('participant 1 card'), {
        message: 'Second participant has been removed',
    }).not.toBeVisible();
});
