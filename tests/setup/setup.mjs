/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
import * as fs from 'fs';

import { maybeInitLicense } from './initializeLicense.mjs';
import { maybeDownloadFoundry } from './downloadFoundry.mjs';

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

(async () => {
    await maybeDownloadFoundry();
    await maybeInitLicense();
})();
