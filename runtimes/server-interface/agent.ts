import { CancellationToken } from '../protocol'

interface BaseSchema {
    title?: string
    description?: string
    default?: any
    examples?: any[]
    $id?: string
    $schema?: string
    definitions?: Record<string, JSONSchema>
    [extensionKeywords: string]: any
}

interface StringSchema extends BaseSchema {
    type: 'string'
    minLength?: number
    maxLength?: number
    pattern?: string
    format?: string
    enum?: string[]
}

interface NumberSchema extends BaseSchema {
    type: 'number' | 'integer'
    minimum?: number
    maximum?: number
    exclusiveMinimum?: number
    exclusiveMaximum?: number
    multipleOf?: number
    enum?: number[]
}

interface BooleanSchema extends BaseSchema {
    type: 'boolean'
    enum?: boolean[]
}

interface ArraySchema extends BaseSchema {
    type: 'array'
    items: JSONSchema | JSONSchema[]
    minItems?: number
    maxItems?: number
    uniqueItems?: boolean
    additionalItems?: boolean | JSONSchema
}

export interface ObjectSchema extends BaseSchema {
    type: 'object'
    properties?: Record<string, JSONSchema>
    required?: readonly string[]
    additionalProperties?: boolean | JSONSchema
    minProperties?: number
    maxProperties?: number
    patternProperties?: Record<string, JSONSchema>
    dependencies?: Record<string, JSONSchema | string[]>
}

type JSONSchema = (StringSchema | NumberSchema | BooleanSchema | ArraySchema | ObjectSchema) & {
    $ref?: string
    allOf?: JSONSchema[]
    anyOf?: JSONSchema[]
    oneOf?: JSONSchema[]
    not?: JSONSchema
}

type Primitive<T extends { type: string }> = T['type'] extends 'string'
    ? string
    : T['type'] extends 'number'
      ? number
      : T['type'] extends 'boolean'
        ? boolean
        : T['type'] extends 'null'
          ? null
          : never

type InferArray<T extends { type: 'array'; items: any }> = T['items'] extends { type: string }
    ? InferSchema<T['items']>[]
    : never

type InferObject<T extends { type: 'object'; properties: Record<string, any> }> = T extends {
    required: readonly string[]
}
    ? {
          [K in keyof T['properties'] as K extends T['required'][number] ? K : never]: InferSchema<T['properties'][K]>
      } & {
          [K in keyof T['properties'] as K extends T['required'][number] ? never : K]?: InferSchema<T['properties'][K]>
      }
    : {
          [K in keyof T['properties']]?: InferSchema<T['properties'][K]>
      }

export type InferSchema<T> = T extends { type: 'array'; items: any }
    ? InferArray<T>
    : T extends { type: 'object'; properties: Record<string, any> }
      ? InferObject<T>
      : T extends { type: string }
        ? Primitive<T>
        : never

export type ToolSpec = {
    name: string
    description: string
    inputSchema: ObjectSchema
}

export type GetToolsOptions = {
    format: 'bedrock' | 'mcp'
}

export type Tools = ToolSpec[]
export type BedrockTools = {
    toolSpecification: Omit<ToolSpec, 'inputSchema'> & { inputSchema: { json: ToolSpec['inputSchema'] } }
}[]

export type Agent = {
    /**
     * Add a tool to the local tool repository. Tools with the same name will be overwritten.
     *
     * Tools should be called using `runTool`.
     *
     * @param spec Tool Specification
     * @param handler The async method to execute when the tool is called
     */
    addTool: <T extends InferSchema<S['inputSchema']>, S extends ToolSpec, R>(
        spec: S,
        handler: (input: T, token?: CancellationToken, updates?: WritableStream) => Promise<R>
    ) => void

    /**
     * Run a tool by name. This method will lookup the tool in the local tool repository and
     * validate the input against the tool's schema.
     *
     * Throws an error if the tool is not found, or if validation fails.
     *
     * @param toolName The name of the tool to run
     * @param input The input to the tool
     * @returns The result of the tool execution
     */
    runTool: (toolName: string, input: any, token?: CancellationToken, updates?: WritableStream) => Promise<any>

    /**
     * Get the list of tools in the local tool repository.
     * @param options Options for the format of the output. Can be either 'bedrock' or 'mcp' (the default)
     * @returns The tool repository in the requested output format
     */
    getTools: <T extends GetToolsOptions>(options?: T) => T extends { format: 'bedrock' } ? BedrockTools : Tools

    /**
     * Remove a tool from the local tool repository.
     * @param toolName The name of the tool to remove
     */
    removeTool: (toolName: string) => void
}
