import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Reputation', 'reputation');
    await items.rep.expectOpened('Test Reputation');
});

test('loads sheet data', async ({ items: { rep } }) => {
    const dialog = await rep.openDialog('Modified Reputation');

    await expect(dialog.getLabeledField('Infamous')).toBeChecked();
    await expect(dialog.getLabeledField('Dice')).toHaveValue('3');
    await expect(dialog.description).toHaveValue('A modified text description');
});

test('can be modified', async ({ items: { rep } }) => {
    const dialog = await rep.openDialog('Modified Reputation');
    await test.step('update the sheet data', async () => {
        await dialog.togglePillCheckbox('Infamous');
        await dialog.selectOption('Dice', '2');
        await dialog.close();
    });

    await test.step('check changes got persisted', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Infamous')).not.toBeChecked();
        await expect(dialog.getLabeledField('Dice')).toHaveValue('2');
    });
});
