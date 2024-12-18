/* eslint-disable no-console */
import { FullConfig } from '../node_modules/playwright/test';

import * as fs from 'fs';

if (!fs.existsSync('./foundryConfig.json')) {
    console.log('*** No config file found, creating new copy. ***');
    fs.writeFileSync(
        './foundryConfig.json',
        JSON.stringify({ deployDest: './release' })
    );
} else {
    console.log('*** Found foundryConfig.json ***');
}

const config: { foundryUsername: string; foundryPassword: string } = JSON.parse(
    fs.readFileSync('foundryConfig.json').toString()
);

async function authenticate() {
    return config;
}

async function maybeDownloadFoundry() {
    const auth = await authenticate();
    return auth;
}

export async function globalSetup(_config: FullConfig) {
    await maybeDownloadFoundry();
}

export default globalSetup;
