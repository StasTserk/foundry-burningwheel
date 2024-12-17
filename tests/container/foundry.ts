/* eslint-disable no-console */
import { GenericContainer } from 'testcontainers';
export async function foundryInstance() {
    console.log(
        `Grabbing image from ${process.cwd()}/tests/container/Dockerfile`
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
            stream.on('data', (l) => console.log(l));
            stream.on('err', (l) => console.error(l));
            stream.on('end', () => console.log('Stream closed'));
        })
        .start();
}
