/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
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

const version = process.argv.length === 3 ? process.argv[2] : '331';

const config = JSON.parse(fs.readFileSync('foundryConfig.json').toString());

import { maybeInitLicense } from './initializeLicense.mjs';
import { maybeDownloadFoundry } from './downloadFoundry.mjs';

(async () => {
    await maybeDownloadFoundry(config, version);
    await maybeInitLicense(config);
})();
