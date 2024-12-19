/* eslint-disable no-console */
import * as fs from 'fs';

export async function maybeInitLicense(config) {
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
