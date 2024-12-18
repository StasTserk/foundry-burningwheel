/* eslint-disable no-console */
import { FullConfig } from '../node_modules/playwright/test';
import * as fs from 'fs';

function installZipExists() {
    return (
        fs
            .readdirSync('./tests')
            .filter(
                (allFilesPaths) =>
                    allFilesPaths.match(/foundry.+\.zip$/i) !== null
            ).length > 0
    );
}

export async function globalSetup(_config: FullConfig) {
    if (!installZipExists()) {
        throw new Error('Missing foundry install zip');
    }
}

export default globalSetup;
