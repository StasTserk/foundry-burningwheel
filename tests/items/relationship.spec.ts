import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Relationship', 'relationship');
    await items.rel.expectOpened('Test Relationship');
});
