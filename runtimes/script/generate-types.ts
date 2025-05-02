import { exec } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function generateTypes() {
    try {
        const schemaDir = path.resolve(__dirname, '../runtimes/operational-telemetry/telemetry-schemas')
        const input = path.join(schemaDir, 'telemetry-schema.json')
        const output = path.join(schemaDir, '../types/generated/telemetry.d.ts')

        console.log('Generating TypeScript types from json schemas...')
        await execAsync(`json2ts -i "${input}" -o "${output}" --unreachableDefinitions`, { cwd: schemaDir })
        console.log('Types generated successfully')
    } catch (error) {
        console.error('Error generating types:', error)
        process.exit(1)
    }
}

generateTypes()
