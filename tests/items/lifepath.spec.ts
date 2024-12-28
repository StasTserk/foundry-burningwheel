import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Lifepath', 'lifepath');
    await items.lp.expectOpened('Test Lifepath');
});
