import { expect } from '../../node_modules/playwright/test';
import { testAsGm as test } from '../fixtures/index';

test('loads data correctly', async ({ page, fightDialog }) => {
    await fightDialog.OpenDialog();
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
