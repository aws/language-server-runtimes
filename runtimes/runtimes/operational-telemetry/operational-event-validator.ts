import Ajv from 'ajv'

export class OperationalEventValidator {
    private readonly ajv
    private readonly validate

    constructor() {
        this.ajv = new Ajv()

        this.ajv.addSchema(require('./telemetry-schemas/base-event-schema.json'), 'base-event-schema.json')
        this.ajv.addSchema(require('./telemetry-schemas/caught-error-schema.json'), 'caught-error-schema.json')
        this.ajv.addSchema(
            require('./telemetry-schemas/resource-usage-metric-schema.json'),
            'resource-usage-metric-schema.json'
        )
        this.ajv.addSchema(require('./telemetry-schemas/server-crash-schema.json'), 'server-crash-schema.json')
        this.ajv.addSchema(require('./telemetry-schemas/telemetry-schema.json'), 'telemetry-schema.json')
        this.validate = this.ajv.getSchema('telemetry-schema.json#/definitions/OperationalEvent')!
    }

    validateEvent(event: Record<string, any>): boolean {
        const valid = this.validate(event) as boolean
        return valid
    }
}
