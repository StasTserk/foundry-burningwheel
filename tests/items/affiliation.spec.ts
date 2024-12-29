import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Affiliation', 'affiliation');
    await items.aff.expectOpened('Test Affiliation');
});

test('can be opened, populates data', async ({ items: { aff } }) => {
    const sheet = await aff.openDialog('Modified Affiliation');
    await aff.expectOpened('Modified Affiliation');
    await expect(sheet.dieValue).toHaveValue('3');
    await expect(sheet.description).toHaveValue(
        'An affiliation that has been modified outside of the defaults.'
    );
    await sheet.close();
});

test('can modify data, loads up again', async ({ items: { aff } }) => {
    const sheet = await aff.openDialog('Modified Affiliation');
    await test.step('update all of the sheet fields', async () => {
        await sheet.setDieValue(1);
        await sheet.setDescription('a new description');
        await sheet.close();
        await expect(sheet.locator).not.toBeVisible();
    });
    await test.step('reopen the sheet and check data saved', async () => {
        await sheet.open();
        await expect(sheet.dieValue).toHaveValue('1');
        await expect(sheet.description).toHaveValue('a new description');
    });
});
