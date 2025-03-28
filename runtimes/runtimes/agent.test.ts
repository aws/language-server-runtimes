import { Agent } from '../server-interface'
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
    const SOME_TOOL_HANDLER = async (_: { test: string }) => true

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

    it('should throw if the tool input does not validate', async () => {
        AGENT.addTool(SOME_TOOL_SPEC, SOME_TOOL_HANDLER)
        assert.rejects(async () => {
            await AGENT.runTool(SOME_TOOL_SPEC.name, { test: 1 })
        }, Error)
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
})
