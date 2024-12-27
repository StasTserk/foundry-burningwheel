import { expect } from 'playwright/test';
import { testAsGm as test } from '../fixtures/bwFixture';

test('can open the character sheet', async ({ page, char }) => {
    await char.openCharacter('Romeo');
    // character sheet container.
    await expect(page.locator('div.app.bw-app')).toBeVisible();
});
