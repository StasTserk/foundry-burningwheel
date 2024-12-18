/* eslint-disable no-console */
import { FullConfig } from '../node_modules/playwright/test';

import * as fs from 'fs';

if (!fs.existsSync('./foundryConfig.json')) {
    console.log('*** No config file found, creating new copy. ***');
    fs.writeFileSync(
        './foundryConfig.json',
        JSON.stringify({
            deployDest: './release',
            foundrySecret: "enter your license file's signature here",
            foundryLicense: "enter your license file's license here",
            foundryUsername: 'enter your foundry username here',
            foundryPassword: 'enter your foundry password here',
        })
    );
} else {
    console.log('*** Found foundryConfig.json ***');
}

const config: {
    foundryUsername: string;
    foundryPassword: string;
    foundryLicense: string;
    foundrySecret: string;
} = JSON.parse(fs.readFileSync('foundryConfig.json').toString());

async function authenticate() {
    return config;
}

async function maybeDownloadFoundry() {
    const auth = await authenticate();
    return auth;
}

async function maybeInitLicense() {
    if (!fs.existsSync('./tests/license.json')) {
        console.log('Generating license file');

        const license = process.env.foundry_license ?? config.foundryLicense;
        const signature = process.env.foundry_secret ?? config.foundrySecret;

        if (
            !license ||
            !signature ||
            license === "enter your license file's signature here" ||
            signature === "enter your license file's signature here"
        ) {
            throw Error(
                'Make sure to provide a valid license and signature in either foundryConfig.json or in your environment variables'
            );
        }

        fs.writeFileSync(
            './tests/license.json',
            JSON.stringify({
                host: 'foundry-host',
                license: process.env.foundry_license ?? config.foundryLicense,
                version: '11.293',
                time: new Date(Date.now()).toISOString(),
                signature: process.env.foundry_secret ?? config.foundrySecret,
            })
        );
    }
}

export async function globalSetup(_config: FullConfig) {
    await maybeDownloadFoundry();
    await maybeInitLicense();
}

export default globalSetup;
