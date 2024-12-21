import { expect } from '@playwright/test';
import { testAsGm } from './fixtures/index';

testAsGm(
    'can navigate to the game',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ page, foundryHost, gamePage }) => {
        await expect(page.url()).toBe(foundryHost + '/game');
        await expect(page).toHaveTitle(/Foundry Virtual Tabletop/i);
    }
);

testAsGm('can open the character sheet', async ({ page, gamePage }) => {
    await gamePage.openCharacter('Romeo');
    // character sheet container.
    await expect(await page.locator('div.app.bw-app')).toBeVisible();
});
