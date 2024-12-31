import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Spell', 'spell');
    await items.spell.expectOpened('Test Spell');
});

test('loads sheet data', async ({ items: { spell } }) => {
    const dialog = await spell.openDialog('Modified Spell');
    await test.step('check some base spell values', async () => {
        await expect(dialog.getLabeledField('Obstacle')).toHaveValue('1');
        await expect(dialog.getLabeledField('Actions')).toHaveValue('2');
        await expect(dialog.getLabeledField('Resource Point Cost')).toHaveValue(
            '3'
        );
        await expect(dialog.getLabeledField('Origin')).toHaveValue('Self');
        await expect(dialog.getLabeledField('Area of Effect')).toHaveValue(
            'Unlimited'
        );
        await expect(dialog.getLabeledField('Up Spell')).toBeChecked();
    });

    await test.step('test weapon properties', async () => {
        await expect(dialog.getLabeledField('Is A Weapon')).toBeChecked();
        await expect(dialog.getLabeledField('Will Bonus')).toHaveValue('4');
        await expect(dialog.getLabeledField('Length')).toHaveValue(
            'as missile'
        );
        await expect(dialog.getLabeledField('Half Will')).toBeChecked();
    });
});

test('can be edited', async ({ items: { spell } }) => {
    const dialog = await spell.openDialog('Modified Spell');
    await test.step('edit the sheet and close it', async () => {
        await dialog.setLabeledField('Obstacle', '11');
        await dialog.togglePillCheckbox('Up Spell');
        await dialog.setLabeledField('Area of Effect', 'very limited');
        await dialog.selectOption('Length', 'short');
        await dialog.close();
    });

    await test.step('reopen sheet and check values', async () => {
        await dialog.open();
        await expect(dialog.getLabeledField('Obstacle')).toHaveValue('11');
        await expect(dialog.getLabeledField('Up Spell')).not.toBeChecked();
        await expect(dialog.getLabeledField('Area of Effect')).toHaveValue(
            'very limited'
        );
        await expect(dialog.getLabeledField('Length')).toHaveValue('short');
    });
});

test('is weapon section can be toggled hidden', async ({
    items: { spell },
}) => {
    const dialog = await spell.openDialog('Modified Spell');
    await dialog.togglePillCheckbox('Is A Weapon');
    await expect(dialog.getLabeledField('Will Bonus')).not.toBeVisible();
});
