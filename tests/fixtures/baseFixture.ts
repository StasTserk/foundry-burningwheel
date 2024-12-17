/* eslint-disable no-console */
import { test as baseTest } from '@playwright/test';
import { foundryInstance } from '../container/foundry';
import { StartedTestContainer } from 'testcontainers';
type TestFixtureBase = {
    foundryHost: string;
};
export const baseFixture = baseTest.extend<TestFixtureBase>({
    foundryHost: async ({ page }, use) => {
        let foundryHost: StartedTestContainer | undefined;
        try {
            console.log('Starting foundry host for tests');
            foundryHost = await foundryInstance();
            const hostUrl = `http://${foundryHost.getHost()}:${foundryHost.getMappedPort(
                30000
            )}`;
            console.log(`Started foundry at ${hostUrl}`);

            await page.goto(hostUrl);
            // agree to eula
            await page.getByLabel('I agree to these terms').click();
            await page.getByRole('button', { name: /agree/i }).click();

            await use(hostUrl);
        } catch (exn) {
            console.error('Failed to start foundry host', exn);
        } finally {
            console.log(`Cleaning up after test`);
            foundryHost?.stop();
        }
    },
});
