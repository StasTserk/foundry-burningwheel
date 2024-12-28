import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Ranged Weapon', 'ranged weapon');
    await items.ranged.expectOpened('Test Ranged Weapon');
});
