/* eslint-disable no-console */
import { GenericContainer } from 'testcontainers';
export async function foundryInstance() {
    console.log(
        `[test-fixture] Grabbing image from ${process.cwd()}/tests/container/Dockerfile`
    );
    return (
        await GenericContainer.fromDockerfile(
            process.cwd() + '/tests',
            'container/Dockerfile'
        ).build('foundry-host', { deleteOnExit: true })
    )
        .withExposedPorts({
            container: 30000,
            host: 30000,
        })
        .withNetworkAliases('foundry-host')
        .withLogConsumer((stream) => {
            stream.on('data', (l) =>
                process.stdout.write(`[foundry-host] ${l}`)
            );
            stream.on('err', (l) =>
                process.stderr.write(`[foundry-host] ${l}`)
            );
            stream.on('end', () =>
                process.stdout.write('[foundry-host] Stream closed')
            );
        })
        .start();
}
