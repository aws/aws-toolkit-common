/**
 * For testing we can force the process to push on --node-ipc
 * this is a hack that is also done by yaml-language-server to ensure
 * that the service can be started when testing
 */
export function forceServiceConnection() {
    process.argv.push('--node-ipc')
}
