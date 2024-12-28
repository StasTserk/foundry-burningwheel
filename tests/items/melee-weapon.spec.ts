import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Melee Weapon', 'melee weapon');
    await items.melee.expectOpened('Test Melee Weapon');
});
