/* eslint-disable no-console */
import { GenericContainer } from 'testcontainers';

export function generateHostPort() {
    if (!process.env.TEST_PARALLEL_INDEX) {
        throw new Error('TEST_PARALLEL_INDEX was not set');
    }
    const parallelIndex = Number.parseInt(process.env.TEST_PARALLEL_INDEX);
    if (Number.isNaN(parallelIndex)) {
        throw new Error('TEST_PARALLEL_INDEX was not a valid integer');
    }
    let shard = Number.parseInt(process.env.CIRCLE_NODE_INDEX || '');
    shard = Number.isNaN(shard) ? 10 : shard * 10;
    return 30000 + parallelIndex + shard;
}

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
            host: generateHostPort(),
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
