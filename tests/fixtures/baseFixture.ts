/* eslint-disable no-console */
import { test as baseTest } from '@playwright/test';
import { foundryInstance } from '../container/foundry';
import { StartedTestContainer } from 'testcontainers';
type TestFixtureBase = {
    foundryHost: string;
};
export const baseFixture = baseTest.extend<TestFixtureBase>({
    foundryHost: [
        async ({ page }, use) => {
            let foundryHost: StartedTestContainer | undefined;
            try {
                console.log('[test-fixture] Starting foundry host for tests');
                foundryHost = await foundryInstance();
                const hostUrl = `http://${foundryHost.getHost()}:${foundryHost.getMappedPort(
                    30000
                )}`;
                console.log(`[test-fixture] Started foundry at ${hostUrl}`);

                await page.goto(hostUrl);
                // agree to eula
                await page.getByLabel('I agree to these terms').click();
                await page.getByRole('button', { name: /agree/i }).click();

                page.on('console', (msg) => {
                    if (msg.type() === 'error') {
                        console.error(`[foundry-ui] ${msg.text()}`);
                    } else if (msg.type() === 'warning') {
                        console.warn(`[foundry-ui] ${msg.text()}`);
                    } else {
                        console.log(`[foundry-ui] ${msg.text()}`);
                    }
                });

                await use(hostUrl);
            } catch (exn) {
                console.error(
                    '[test-fixture] Failed to start foundry host',
                    exn
                );
            } finally {
                console.log(`[test-fixture] Cleaning up after test`);
                foundryHost?.stop();
            }
        },
        { timeout: 60_000 },
    ],
});
