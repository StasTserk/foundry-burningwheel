import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Spell', 'spell');
    await items.spell.expectOpened('Test Spell');
});
