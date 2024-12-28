import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Trait', 'trait');
    await items.trait.expectOpened('Test Trait');
});
