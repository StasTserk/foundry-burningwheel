import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Reputation', 'reputation');
    await items.rep.expectOpened('Test Reputation');
});
