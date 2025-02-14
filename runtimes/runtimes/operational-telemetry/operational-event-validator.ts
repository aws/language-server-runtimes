import Ajv from 'ajv'
import fs from 'fs'
import path from 'path'

export class OperationalEventValidator {
    private readonly ajv
    private readonly validate

    constructor() {
        this.ajv = new Ajv()

        const schemaDir = path.resolve(__dirname, 'telemetry-schemas')

        fs.readdirSync(schemaDir).forEach(file => {
            if (file.endsWith('.json')) {
                const schema = require(path.resolve(schemaDir, file))
                this.ajv.addSchema(schema, file)
            }
        })

        this.validate = this.ajv.getSchema('telemetry-schema.json#/definitions/OperationalEvent')!
    }

    validateEvent(event: Record<string, any>): boolean {
        const valid = this.validate(event) as boolean
        return valid
    }
}
