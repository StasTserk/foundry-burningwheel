import { expect } from '@playwright/test';
import { test } from './fixtures/index';

test('can navigate to the game', async ({
    page,
    setupPage,
    gamePage,
    foundryHost,
}) => {
    await setupPage.dismissTour();
    await setupPage.enterWorldAsUser('Gamemaster');
    await gamePage.waitForLoad();

    await expect(page.url()).toBe(foundryHost + '/game');
    await expect(page).toHaveTitle(/Foundry Virtual Tabletop/i);
});

test('can open the character sheet', async ({ page, setupPage, gamePage }) => {
    await setupPage.dismissTour();
    await setupPage.enterWorldAsUser('Gamemaster');
    await gamePage.waitForLoad();

    await gamePage.openTab('Actors');

    await page.getByText('test-actor').click();
    // character sheet container.
    await expect(await page.locator('div.app.bw-app')).toBeVisible();
});
