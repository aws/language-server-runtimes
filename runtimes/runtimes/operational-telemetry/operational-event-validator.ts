import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'

export class OperationalEventValidator {
    private readonly ajv
    private readonly validate

    constructor() {
        this.ajv = new Ajv()

        const schemaDir = path.resolve(__dirname, 'telemetry-schemas')

        for (const file of fs.readdirSync(schemaDir)) {
            if (file.endsWith('.json')) {
                const schema = JSON.parse(fs.readFileSync(path.resolve(schemaDir, file), 'utf8'))
                this.ajv.addSchema(schema, file)
            }
        }

        const validateSchema = this.ajv.getSchema('telemetry-schema.json#/definitions/OperationalEvent')
        if (!validateSchema) {
            throw new Error('Schema not found: telemetry-schema.json#/definitions/OperationalEvent')
        }
        this.validate = validateSchema
    }

    validateEvent(event: Record<string, any>): boolean {
        const valid = this.validate(event) as boolean
        return valid
    }
}
