import { testAsGm as test } from '../fixtures/bwFixture';

test('can be created, opens sheet', async ({ gamePage, items }) => {
    await gamePage.createItem('Test Skill', 'skill');
    await items.skill.expectOpened('Test Skill');
});
