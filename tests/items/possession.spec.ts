import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Possession', 'possession');
    await items.poss.expectOpened('Test Possession');
});

test('loads sheet data', async ({ items: { poss } }) => {
    const dialog = await poss.openDialog('Modified Possession');
    await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
        '2'
    );
    await expect(dialog.getLabeledField('Expended')).toBeChecked();
    await expect(dialog.getLabeledField('Toolkit')).toBeChecked();
    await expect(dialog.description).toHaveValue('A modified text description');
});

test('can be modified', async ({ items: { poss } }) => {
    const dialog = await poss.openDialog('Modified Possession');
    await test.step('update the sheet data', async () => {
        await dialog.setLabeledField('Resource Point Cost', '22');
        await dialog.togglePillCheckbox('Expended');
        await dialog.togglePillCheckbox('Toolkit');
        await dialog.close();
    });

    await test.step('check changes got persisted', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
            '22'
        );
        await expect(dialog.getLabeledField('Expended')).not.toBeChecked();
        await expect(dialog.getLabeledField('Toolkit')).not.toBeChecked();
    });
});
