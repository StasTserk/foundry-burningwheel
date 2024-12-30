import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Armor', 'armor');
    await items.armor.expectOpened('Test Armor');
});

test('loads sheet data', async ({ items: { armor } }) => {
    const sheet = await armor.openDialog('Modified Armor');
    await expect(sheet.description).toHaveValue(
        'A made up item with every field different from the default'
    );

    await expect(sheet.getLabeledField('has helm')).toBeChecked();
    await expect(sheet.getLabeledField('has torso')).toBeChecked();
    await expect(sheet.getLabeledField('has left arm')).toBeChecked();
    await expect(sheet.getLabeledField('has shield')).toBeChecked();

    await expect(sheet.getLabeledField('resource point cost')).toHaveValue(
        '44'
    );
    await expect(sheet.getLabeledField('armor quality')).toHaveValue(
        'run of the mill'
    );
    await expect(sheet.getLabeledField('fatigue penalty')).toHaveValue('4');
    await expect(sheet.getLabeledField('helm damage')).toHaveValue('1');
    await expect(sheet.getLabeledField('left arm damage')).toHaveValue('7');
});

test('can be edited, remembers changes', async ({ items: { armor } }) => {
    const sheet = await armor.openDialog('Modified Armor');
    await test.step('change some fields', async () => {
        await sheet.setDescription('updated description');
        await sheet.togglePillCheckbox('has left arm', true);
        await sheet.setLabeledField('torso damage', '33');
        await sheet.close();
    });

    await test.step('check these changes got saved', async () => {
        await sheet.open();
        await expect(sheet.getLabeledField('has left arm')).not.toBeChecked();
        await expect(
            sheet.getLabeledField('left arm damage')
        ).not.toBeVisible();
        await expect(sheet.getLabeledField('torso damage')).toHaveValue('33');
        await expect(sheet.description).toHaveValue('updated description');
    });
});
