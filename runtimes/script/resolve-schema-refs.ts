import $RefParser from '@apidevtools/json-schema-ref-parser'
import { mkdirSync, writeFileSync } from 'fs'
import path from 'path'

async function dereferenceSchema() {
    const schemaPath = path.resolve(
        __dirname,
        '../runtimes/operational-telemetry/telemetry-schemas/telemetry-schema.json'
    )
    const outputSchemaDir = path.resolve(__dirname, '../out/runtimes/operational-telemetry/telemetry-schemas')
    const outputSchemaPath = path.join(outputSchemaDir, 'bundled-telemetry-schema.json')

    try {
        const schema = await $RefParser.dereference(schemaPath)
        mkdirSync(outputSchemaDir, { recursive: true })
        writeFileSync(outputSchemaPath, JSON.stringify(schema, null, 4))

        console.log('Successfully dereferenced telemetry json schemas')
    } catch (error) {
        console.error('Error dereferencing telemetry json schemas: ', error)
    }
}

dereferenceSchema()
