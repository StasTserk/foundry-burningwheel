import { expect } from '@playwright/test';
import { testAsGm } from './fixtures/index';

testAsGm(
    'can navigate to the game',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async ({ page, foundryHost, gamePage }) => {
        expect(page.url()).toBe(foundryHost + '/game');
        await expect(page).toHaveTitle(/Foundry Virtual Tabletop/i);
    }
);
