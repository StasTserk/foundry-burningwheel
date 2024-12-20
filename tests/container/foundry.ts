/* eslint-disable no-console */
import { GenericContainer } from 'testcontainers';
export async function foundryInstance(version) {
    return (await new GenericContainer(`stastserk/foundry-instance:${version}`))
        .withExposedPorts({
            container: 30000,
            host: 30000,
        })
        .withNetworkAliases('foundry-host')
        .withLogConsumer((stream) => {
            stream.on('data', (l) => console.log(l));
            stream.on('err', (l) => console.error(l));
            stream.on('end', () => console.log('Stream closed'));
        })
        .start();
}
