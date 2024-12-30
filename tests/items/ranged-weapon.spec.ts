import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Ranged weapon', 'ranged weapon');
    await items.ranged.expectOpened('Test Ranged weapon');
});

test('loads sheet data', async ({ items: { ranged } }) => {
    const dialog = await ranged.openDialog('Modified Ranged weapon');
    await expect(dialog.getLabeledField('Use Power')).toBeChecked();
    await expect(dialog.getLabeledField('Use Gunpowder')).toBeChecked();
    await expect(dialog.getLabeledField('Power Bonus')).toHaveValue('3');
    await expect(dialog.getLabeledField('Incidental:')).toHaveValue('4');
    await expect(dialog.getLabeledField('Mark:')).toBeDisabled();
    await expect(dialog.getLabeledField('Weapon Quality')).toHaveValue('poor');
    await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
        '6'
    );
    await expect(dialog.description).toHaveValue('A modified text description');
});

test('can be edited', async ({ items: { ranged } }) => {
    const dialog = await ranged.openDialog('Modified Ranged weapon');
    await test.step('change some data and close the sheet', async () => {
        await dialog.togglePillCheckbox('Use Gunpowder');
        await dialog.selectOption('Weapon Quality', 'superior');
        await dialog.selectOption('Shade', 'W');
        await dialog.setLabeledField('Max Range', 'and beyond');
        await dialog.close();
    });

    await test.step('data is persisted', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Use Gunpowder')).not.toBeChecked();
        await expect(dialog.getLabeledField('Weapon Quality')).toHaveValue(
            'superior'
        );
        await expect(dialog.getLabeledField('Shade')).toHaveValue('W');
        await expect(dialog.getLabeledField('Max Range')).toHaveValue(
            'and beyond'
        );
    });
});

test('editing incidental and mark values', async ({ items: { ranged } }) => {
    const dialog = await ranged.openDialog('Modified Ranged weapon');
    await test.step('turning off "use power" enables incidentals', async () => {
        await dialog.togglePillCheckbox('Use Power');
        await expect(dialog.getLabeledField('Incidental:')).toBeEditable();
        await expect(dialog.getLabeledField('Mark:')).toBeEditable();
        await expect(dialog.getLabeledField('Superb:')).toBeEditable();
    });

    await test.step('changing thresholds updates the IMS labels', async () => {
        await dialog.setLabeledField('Mark Thresh', '5');
        await dialog.setLabeledField('Incidental Thresh', '2');
        await expect(dialog.locator.getByText('Incidental: 1-2')).toBeVisible();
        await expect(dialog.locator.getByText('Mark: 3-5')).toBeVisible();
        await expect(dialog.locator.getByText('Superb: 6')).toBeVisible();
    });
});
