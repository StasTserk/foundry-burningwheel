/* eslint-disable no-console */
import * as fs from 'fs';
import nodeFetch from 'node-fetch';
import { Headers } from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://foundryvtt.com';
const LOGIN_URL = BASE_URL + '/auth/login/';

const cookieJar = new fetchCookie.toughCookie.CookieJar();
const fetch = fetchCookie(nodeFetch, cookieJar);

const headers = new Headers({
    DNT: '1',
    Referer: BASE_URL,
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'node-fetch',
});

async function authenticate(config) {
    console.log(' > Authenticating ...');
    const username = process.env.foundry_username ?? config.foundryUsername;
    const password = process.env.foundry_password ?? config.foundryPassword;

    if (
        !username ||
        !password ||
        username === 'enter your foundry username here' ||
        password === 'enter your foundry password here'
    ) {
        throw Error(
            'Foundry username or password is not set. Update your environment variable or foundry config'
        );
    }

    console.log(' > Fetching csrf token...');

    const response = await fetch(BASE_URL, {
        method: 'GET',
        headers,
    });

    if (!response.ok) {
        throw Error(`Failed to fetch csrf token: ${response.status}`);
    }

    const selector = await cheerio.load(await response.text());
    const csrfToken = selector('input[name ="csrfmiddlewaretoken"]').val();

    if (!csrfToken) {
        throw Error('Failed to find CSRF token');
    }

    console.log(' > Logging in...');
    const formParams = new URLSearchParams({
        csrfmiddlewaretoken: csrfToken,
        next: '/',
        password,
        username,
    });

    await fetch(LOGIN_URL, {
        body: formParams,
        method: 'POST',
        headers,
    });

    const session_cookie = cookieJar
        .getCookiesSync(BASE_URL)
        .find((c) => c.key === 'sessionid');

    if (!session_cookie) {
        throw Error('Failed to authenticate with given credentials');
    }
    return config;
}

async function getRelease(version) {
    console.log(' > Fetching presigned release url');
    const release_url = `${BASE_URL}/releases/download?build=${version}&platform=linux`;
    const response = await fetch(release_url, {
        method: 'GET',
        headers,
        redirect: 'manual',
    });

    if (!(response.status >= 300 && response.status < 400)) {
        console.warn(
            `Unexpected response ${response.status}: ${response.statusText}`
        );
    }

    const presignedUrl = response.headers.get('location');

    console.log(' > downloading install');

    const output = fs.createWriteStream(`./tests/foundry${version}.zip`);
    const request = await fetch(presignedUrl);

    return new Promise((resolve, reject) => {
        request.body.pipe(output);
        request.body.on('error', reject);
        output.on('finish', resolve);
    });
}

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

export async function maybeDownloadFoundry(config) {
    if (installZipExists()) {
        console.log('Found foundry install zip, nothing to do!');
        return;
    }
    console.log('Downloading foundry install...');
    const auth = await authenticate(config);
    await getRelease('331');
    console.log('Download finished!');

    return auth;
}
