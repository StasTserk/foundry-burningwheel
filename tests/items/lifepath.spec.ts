import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Lifepath', 'lifepath');
    await items.lp.expectOpened('Test Lifepath');
});

test('loads sheet data', async ({ items: { lp } }) => {
    const dialog = await lp.openDialog('Modified Lifepath');

    await expect(dialog.getLabeledField('Time')).toHaveValue('1');
    await expect(dialog.getLabeledField('Resources')).toHaveValue('2');
    await expect(dialog.getLabeledField('Stat Boost')).toHaveValue('mental');
    await expect(dialog.getLabeledField('Subtract Stats')).toBeChecked();
    await expect(dialog.getLabeledField('Note')).toHaveValue('A lifepath note');
});

test('can be modified', async ({ items: { lp } }) => {
    const dialog = await lp.openDialog('Modified Lifepath');
    await test.step('update some fields and close the sheet', async () => {
        await dialog.setLabeledField('Skill List', 'A new skill list');
        await dialog.setLabeledField('Trait Points', '4');
        await dialog.locator.getByText('Subtract Stats').click();
        await dialog.close();
    });

    await test.step('reopen the sheet and double check changed', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Skill List')).toHaveValue(
            'A new skill list'
        );
        await expect(dialog.getLabeledField('Trait Points')).toHaveValue('4');
        await expect(
            dialog.getLabeledField('Subtract Stats')
        ).not.toBeChecked();
    });
});
