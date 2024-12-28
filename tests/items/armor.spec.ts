import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Armor', 'armor');
    await items.armor.expectOpened('Test Armor');
});
