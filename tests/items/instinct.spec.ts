import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Instinct', 'instinct');
    await items.instinct.expectOpened('Test Instinct');
});
