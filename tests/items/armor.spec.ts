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

    await expect(sheet.hasHelm).toBeChecked();
    await expect(sheet.hasTorso).toBeChecked();
    await expect(sheet.hasLeftArm).toBeChecked();
    await expect(sheet.hasRightArm).toBeChecked();
    await expect(sheet.hasLeftLeg).toBeChecked();
    await expect(sheet.hasRightLeg).toBeChecked();
    await expect(sheet.hasShield).toBeChecked();

    await expect(sheet.rpCost).toHaveValue('44');
    await expect(sheet.quality).toHaveValue('run of the mill');
    await expect(sheet.helmDamage).toHaveValue('1');
    await expect(sheet.torsoDamage).toHaveValue('3');
});

test('can be edited, remembers changes', async ({ items: { armor } }) => {
    const sheet = await armor.openDialog('Modified Armor');
    await test.step('change some fields', async () => {
        await sheet.setDescription('updated description');
        await sheet.toggleHasHelm();
        await sheet.torsoDamage.fill('33');
        await sheet.close();
    });

    await test.step('check these changes got saved', async () => {
        await sheet.open();
        await expect(sheet.hasHelm).not.toBeChecked();
        await expect(sheet.helmDamage).not.toBeVisible();
        await expect(sheet.torsoDamage).toHaveValue('33');
        await expect(sheet.description).toHaveValue('updated description');
    });
});
