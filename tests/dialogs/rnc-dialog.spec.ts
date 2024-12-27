import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('loads data correctly', async ({ page, rncDialog }) => {
    await rncDialog.openDialog();
    await expect(
        page
            .getByRole('dialog')
            .getByRole('heading', { name: 'range and cover' }),
        { message: 'ensure dialog opens' }
    ).toBeVisible();

    await test.step('verify selected participants', async () => {
        expect(
            page.getByLabel('team 0 members').getByText('Romeo')
        ).toBeVisible();
        expect(
            page.getByLabel('team 1 members').getByText('Tybalt')
        ).toBeVisible();
    });

    await test.step('verify base data preloaded correctly', async () => {
        await rncDialog.expectEditableTeamRange(0, 'Extreme');
        await expect(rncDialog.editableTeamStat(0, 'Stride')).toHaveValue('1');
        await expect(rncDialog.editableTeamStat(0, 'Weapon')).toHaveValue('3');
        await expect(rncDialog.editableTeamStat(0, 'Position')).toHaveValue(
            '2'
        );
        await expect(rncDialog.editableTeamStat(0, 'Misc.')).toHaveValue('4');
    });

    await test.step('ensure actions scripted correctly', async () => {
        await rncDialog.expectVisibleAction(0, 1, 'Close');
        await rncDialog.expectVisibleAction(0, 2, 'Flank');
        await rncDialog.expectVisibleAction(0, 3, 'Maintain Distance');
        await rncDialog.expectVisibleAction(1, 1, 'Fall Prone');
        await rncDialog.expectHiddenAction(1, 2);
    });

    await test.step('volley visibility is correct', async () => {
        await expect(
            page.getByRole('checkbox', { name: /show volley 1/i })
        ).toBeChecked();
        await expect(
            page.getByRole('checkbox', { name: /show volley 2/i })
        ).not.toBeChecked();

        await rncDialog.expectTeamEditable(0);
        await rncDialog.expectTeamNotEditable(1);
    });
});

test('showing another volley reveals a hidden action', async ({
    page,
    rncDialog,
}) => {
    await rncDialog.openDialog();

    await page.getByRole('checkbox', { name: /show volley 2/i }).click();
    await rncDialog.expectVisibleAction(1, 2, 'Run Screaming');
});

test('toggling hide actions reveals all', async ({ rncDialog }) => {
    await rncDialog.openDialog();
    await rncDialog.toggleEditable(1);
    await rncDialog.expectVisibleAction(1, 2, 'Run Screaming');
    await rncDialog.expectVisibleAction(1, 3, 'Stand & Drool');
    await rncDialog.expectTeamEditable(1);
});

test('actions can be changed', async ({ rncDialog }) => {
    await rncDialog.openDialog();
    await rncDialog.scriptAction(0, 1, 'Charge');
    await rncDialog.expectVisibleAction(0, 1, 'Charge');
});

test('round can be cleared', async ({ rncDialog }) => {
    await rncDialog.openDialog();

    await rncDialog.resetRound();
    await rncDialog.expectVisibleAction(0, 1, 'Do Nothing');
    await rncDialog.expectHiddenAction(1, 1);
});

test('dialog can be cleared', async ({ rncDialog, page }) => {
    await rncDialog.openDialog();

    await rncDialog.clearAll();
    await expect(page.getByLabel('team 0 controls')).not.toBeVisible();
});

test('teammate can be added and then removed', async ({ rncDialog, page }) => {
    await rncDialog.openDialog();

    await rncDialog.addTeammate(0, 'Hamlet');
    await expect(
        page.getByLabel('team 0 members').getByText('Romeo')
    ).toBeVisible();
    await expect(
        page.getByLabel('team 0 members').getByText('Hamlet')
    ).toBeVisible();
    await rncDialog.removeTeammate(0, 'Hamlet');
    await expect(
        page.getByLabel('team 0 members').getByText('Romeo')
    ).toBeVisible();
    await expect(
        page.getByLabel('team 0 members').getByText('Hamlet')
    ).not.toBeVisible();
});

test('removing last teammate clears team', async ({ rncDialog, page }) => {
    await rncDialog.openDialog();

    await rncDialog.removeTeammate(1, 'Tybalt');
    await expect(
        page.getByLabel('team 0 members').getByText('Romeo')
    ).toBeVisible();
    await expect(page.getByLabel('team 1 controls')).not.toBeVisible();
});

test('new team can be added', async ({ rncDialog, page }) => {
    await rncDialog.openDialog();

    await rncDialog.addNewTeam('Hamlet');

    await rncDialog.expectTeamEditable(2);

    await expect(
        page.getByLabel('team 2 members').getByText('Hamlet')
    ).toBeVisible();
});
