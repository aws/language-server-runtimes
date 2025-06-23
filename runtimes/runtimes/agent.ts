import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
import {
    Agent,
    BedrockTools,
    CancellationToken,
    GetToolsOptions,
    InferSchema,
    ObjectSchema,
    Tools,
    ToolSpec,
} from '../server-interface'

type Tool<T, R> = {
    name: string
    description: string
    inputSchema: ObjectSchema
    validate: (input: T, token?: CancellationToken) => boolean | ValidateFunction<unknown>['errors']
    invoke: (input: T, token?: CancellationToken, updates?: WritableStream) => Promise<R>
}

export const newAgent = (): Agent => {
    const tools: Record<string, Tool<any, any>> = {}
    const ajv = new Ajv({ strictSchema: false })

    return {
        addTool: <T extends InferSchema<S['inputSchema']>, S extends ToolSpec>(
            spec: S,
            handler: (input: T, token?: CancellationToken) => Promise<any>
        ) => {
            const validator = ajv.compile(spec.inputSchema)
            const tool = {
                validate: (input: InferSchema<S['inputSchema']>) => {
                    const isValid = validator(input)
                    return validator.errors ?? isValid
                },
                invoke: handler,
                name: spec.name,
                description: spec.description,
                inputSchema: spec.inputSchema,
            }

            tools[spec.name] = tool
        },

        runTool: async (toolName: string, input: any, token?: CancellationToken, updates?: WritableStream) => {
            const tool = tools[toolName]
            if (!tool) {
                throw new Error(`Tool ${toolName} not found`)
            }

            const validateResult = tool.validate(input, token)
            if (validateResult !== true) {
                const errorDetails =
                    ((validateResult as ValidateFunction['errors']) || [])
                        .map((err: ErrorObject) => `${err.instancePath || 'root'}: ${err.message}`)
                        .join('\n') || `\nReceived: ${input}`

                throw new Error(`${toolName} tool input validation failed: ${errorDetails}`)
            }

            return tool.invoke(input, token, updates)
        },

        getTools: <T extends GetToolsOptions>(options?: T) => {
            // we have to manually assert the type since
            // Typescript won't be able to infer the return type
            // from the if statement.
            if (options?.format === 'bedrock') {
                return Object.values(tools).map((tool: Tool<any, any>) => {
                    return {
                        toolSpecification: {
                            name: tool.name,
                            description: tool.description,
                            inputSchema: {
                                json: tool.inputSchema,
                            },
                        },
                    }
                }) as T extends { format: 'bedrock' } ? BedrockTools : never
            }

            return Object.values(tools).map((tool: Tool<any, any>) => {
                return {
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                }
            }) as T extends { format: 'bedrock' } ? never : Tools
        },

        removeTool: (name: string) => {
            delete tools[name]
        },
    }
}
