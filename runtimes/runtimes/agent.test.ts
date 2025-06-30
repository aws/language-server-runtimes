import { Agent, ToolClassification } from '../server-interface'
import { newAgent } from './agent'
import * as assert from 'assert'

describe('Agent Tools', () => {
    let AGENT: Agent
    const SOME_TOOL_SPEC = {
        name: 'test',
        description: 'test',
        inputSchema: {
            type: 'object',
            properties: {
                test: {
                    type: 'string',
                },
            },
            required: ['test'],
        },
    } as const

    const SOME_TOOL_SPEC_WITH_EXTENSIONS = {
        name: 'test',
        description: 'test',
        inputSchema: {
            type: 'object',
            properties: {
                test: {
                    type: 'string',
                },
            },
            required: ['test'],
            someExtension: true,
        },
    } as const
    const SOME_TOOL_HANDLER = async (_: { test: string }) => true

    const TOOL_SPEC_WITH_ARRAY_TYPE = {
        name: 'fsReplace',
        description: 'test',
        inputSchema: {
            type: 'object',
            properties: {
                diffs: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            oldStr: {
                                type: 'string',
                            },
                            newStr: {
                                type: 'string',
                            },
                        },
                    },
                },
            },
            required: ['diffs'],
        },
    } as const
    const DIFFS_TOOL_HANDLER = async (_: { diffs: [] }) => true

    beforeEach(() => {
        AGENT = newAgent()
    })

    it('should start without any tools', () => {
        assert.equal(AGENT.getTools().length, 0)
    })

    it('should allow adding tools', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        assert.equal(AGENT.getTools().length, 1)
    })

    it('should allow running tools', async () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        const result = await AGENT.runTool(SOME_TOOL_SPEC.name, { test: 'test' })
        assert.equal(result, true)
    })

    it('should throw an error if tool is not found', async () => {
        assert.rejects(async () => {
            await AGENT.runTool(SOME_TOOL_SPEC.name, { test: 'test' })
        }, Error)
    })

    it('should throw specific message if the tool input does not validate', async () => {
        AGENT.addTool(TOOL_SPEC_WITH_ARRAY_TYPE, DIFFS_TOOL_HANDLER)
        await assert.rejects(
            async () => {
                await AGENT.runTool(TOOL_SPEC_WITH_ARRAY_TYPE.name, {
                    diffs: '[{"oldStr": "toReplace"}, {"newStr": "newContet"}]',
                })
            },
            (error: Error) => {
                assert.ok(error.message === 'fsReplace tool input validation failed: /diffs: must be array')
                return true
            }
        )

        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        await assert.rejects(
            async () => {
                await AGENT.runTool(SOME_TOOL_SPEC.name, { test: 1 })
            },
            (error: Error) => {
                assert.ok(error.message === 'test tool input validation failed: /test: must be string')
                return true
            }
        )
    })

    it('should execute the named tool if multiple are available', async () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        AGENT.addTool({ ...SOME_TOOL_SPEC, name: 'test2' }, async () => false)
        const result = await AGENT.runTool(SOME_TOOL_SPEC.name, { test: 'test' })
        assert.equal(result, true)
    })

    it('should fail if tools are available, but the requested tool is not', async () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        assert.rejects(async () => {
            await AGENT.runTool('test2', { test: 'test' })
        }, Error)
    })

    it('should allow getting tools in default format', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        const tools = AGENT.getTools()
        assert.equal(tools.length, 1)
        assert.equal(tools[0].name, SOME_TOOL_SPEC.name)
        assert.equal(tools[0].description, SOME_TOOL_SPEC.description)
        assert.equal(tools[0].inputSchema, SOME_TOOL_SPEC.inputSchema)
    })

    it('should allow getting tools in bedrock format', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        const tools = AGENT.getTools({ format: 'bedrock' })
        assert.equal(tools.length, 1)
        assert.equal(tools[0].toolSpecification.name, SOME_TOOL_SPEC.name)
        assert.equal(tools[0].toolSpecification.description, SOME_TOOL_SPEC.description)
        assert.equal(tools[0].toolSpecification.inputSchema.json, SOME_TOOL_SPEC.inputSchema)
    })

    it('should allow getting tools with explicit mcp format', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        const tools = AGENT.getTools({ format: 'mcp' })
        assert.equal(tools.length, 1)
        assert.equal(tools[0].name, SOME_TOOL_SPEC.name)
        assert.equal(tools[0].description, SOME_TOOL_SPEC.description)
        assert.equal(tools[0].inputSchema, SOME_TOOL_SPEC.inputSchema)
    })

    it('should support JSON Schema extension keywords', () => {
        AGENT.addTool(SOME_TOOL_SPEC_WITH_EXTENSIONS, SOME_TOOL_HANDLER)
        const tools = AGENT.getTools({ format: 'bedrock' })
        assert.equal(
            tools[0].toolSpecification.inputSchema.json['someExtension'],
            SOME_TOOL_SPEC_WITH_EXTENSIONS.inputSchema.someExtension
        )
    })

    it('should allow removing a tool', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        assert.equal(AGENT.getTools().length, 1)
        AGENT.removeTool(SOME_TOOL_SPEC.name)
        assert.equal(AGENT.getTools().length, 0)
    })

    it('removeTool should be safe for unknown tools', () => {
        AGENT.removeTool('doesNotExist')
        assert.equal(AGENT.getTools().length, 0)
    })

    it('should throw when running a removed tool', async () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        AGENT.removeTool(SOME_TOOL_SPEC.name)
        await assert.rejects(() => AGENT.runTool(SOME_TOOL_SPEC.name, { test: 'test' }), /not found/)
    })

    it('should track built-in tools', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER, ToolClassification.BuiltIn)
        AGENT.addTool({ ...SOME_TOOL_SPEC, name: 'regular' }, SOME_TOOL_HANDLER)

        const builtInTools = AGENT.getBuiltInToolNames()
        assert.equal(builtInTools.length, 1)
        assert.equal(builtInTools[0], SOME_TOOL_SPEC.name)
    })

    it('should track built-in write tools', () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER, ToolClassification.BuiltInCanWrite)
        AGENT.addTool({ ...SOME_TOOL_SPEC, name: 'readOnly' }, SOME_TOOL_HANDLER, ToolClassification.BuiltIn)

        const builtInTools = AGENT.getBuiltInToolNames()
        const builtInWriteTools = AGENT.getBuiltInWriteToolNames()

        assert.equal(builtInTools.length, 2)
        assert.equal(builtInWriteTools.length, 1)
        assert.equal(builtInWriteTools[0], SOME_TOOL_SPEC.name)
    })

    it('should return empty arrays for built-in tools when none are added', () => {
        assert.equal(AGENT.getBuiltInToolNames().length, 0)
        assert.equal(AGENT.getBuiltInWriteToolNames().length, 0)
    })
})
