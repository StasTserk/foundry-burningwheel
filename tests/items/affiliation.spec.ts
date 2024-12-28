import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Affiliation', 'affiliation');
    await items.aff.expectOpened('Test Affiliation');
});
