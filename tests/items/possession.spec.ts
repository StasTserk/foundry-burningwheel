import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Possession', 'possession');
    await items.poss.expectOpened('Test Possession');
});
