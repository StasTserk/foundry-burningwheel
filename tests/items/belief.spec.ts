import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Belief', 'belief');
    await items.belief.expectOpened('Test Belief');
});
