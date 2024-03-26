export function handleVersionArgument(version?: string) {
    if (process.argv.some(arg => arg === '--version' || arg === '-v')) {
        console.log(version)
        process.exit(0)
    }
}
