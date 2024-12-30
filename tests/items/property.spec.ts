import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Property', 'property');
    await items.prop.expectOpened('Test Property');
});

test('loads sheet data', async ({ items: { prop } }) => {
    const dialog = await prop.openDialog('Modified Property');
    await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
        '2'
    );
    await expect(dialog.getLabeledField('Workshop')).toBeChecked();
    await expect(dialog.description).toHaveValue('A modified text description');
});

test('can be modified', async ({ items: { prop } }) => {
    const dialog = await prop.openDialog('Modified Property');
    await test.step('update the sheet data', async () => {
        await dialog.setLabeledField('Resource Point Cost', '22');
        await dialog.togglePillCheckbox('Workshop');
        await dialog.close();
    });

    await test.step('check changes got persisted', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
            '22'
        );
        await expect(dialog.getLabeledField('Workshop')).not.toBeChecked();
    });
});
