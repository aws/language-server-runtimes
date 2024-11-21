import { Connection, RemoteConsole } from 'vscode-languageserver/node'
import { Configuration } from 'vscode-languageserver/lib/common/configuration'
import { getLoggingUtility, getLogLevel, isLogLevelEnabled, isValidLogLevel, LogLevel } from './loggingUtil'
import sinon from 'sinon'
import assert from 'assert'

describe('LoggingUtil', () => {
    let mockConnection: Partial<Connection>
    let workspaceMock: Pick<Configuration, 'getConfiguration'>
    let consoleMock: Pick<RemoteConsole, 'error' | 'warn' | 'info' | 'log' | 'debug'>
    let configStub: sinon.SinonStub
    beforeEach(() => {
        configStub = sinon.stub()
        workspaceMock = {
            getConfiguration: configStub,
        }
        consoleMock = {
            log: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
            info: sinon.stub(),
            debug: sinon.stub(),
        }
        mockConnection = {
            workspace: workspaceMock as any,
            console: consoleMock as any,
        }
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('isValidLogLevel', () => {
        it('should return true for valid log levels', () => {
            const validLevels: LogLevel[] = ['error', 'warn', 'info', 'log', 'debug']
            validLevels.forEach(level => {
                assert.strictEqual(true, isValidLogLevel(level))
            })
        })

        it('should return false for invalid log levels', () => {
            const invalidLevels = ['trace', 'verbose']
            invalidLevels.forEach(level => {
                assert.strictEqual(false, isValidLogLevel(level as LogLevel))
            })
        })
    })

    describe('isLogLevelEnabled', () => {
        it('should correctly compare log levels based on hierarchy', () => {
            const testCases = [
                { level1: 'debug', level2: 'error', expected: true },
                { level1: 'error', level2: 'debug', expected: false },
                { level1: 'info', level2: 'warn', expected: true },
                { level1: 'warn', level2: 'error', expected: true },
                { level1: 'error', level2: 'error', expected: true },
            ]
            testCases.forEach(({ level1, level2, expected }) => {
                assert.strictEqual(expected, isLogLevelEnabled(level1 as LogLevel, level2 as LogLevel))
            })
        })
    })

    describe('getLogLevel', () => {
        it('should return debug log level', async () => {
            configStub.resolves('debug')
            let result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('debug', result)
        })

        it('should return info log level', async () => {
            configStub.resolves('info')
            let result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('info', result)
        })

        it('should return log log level', async () => {
            configStub.resolves('log')
            let result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('log', result)
        })

        it('should return warn log level', async () => {
            configStub.resolves('warn')
            let result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('warn', result)
        })

        it('should return error log level', async () => {
            configStub.resolves('error')
            let result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('error', result)
        })

        it('should return default log level when configuration is invalid', async () => {
            configStub.resolves('random-value')
            const result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('log', result)
        })

        it('should return default log level when configuration is undefined', async () => {
            configStub.resolves(undefined)
            const result = await getLogLevel(mockConnection as Connection)
            assert.strictEqual('log', result)
        })
    })

    describe('getLoggingUtility', () => {
        it('should return a logging utility', async () => {
            configStub.resolves('warn')
            const loggingUtility = await getLoggingUtility(mockConnection as Connection)
            assert.strictEqual('warn', loggingUtility.level)
            assert.strictEqual('function', typeof loggingUtility.error)
            assert.strictEqual('function', typeof loggingUtility.warn)
            assert.strictEqual('function', typeof loggingUtility.info)
            assert.strictEqual('function', typeof loggingUtility.log)
            assert.strictEqual('function', typeof loggingUtility.debug)
            loggingUtility.error('test error message')
            sinon.assert.calledOnceWithMatch(mockConnection.console?.error as sinon.SinonStub, 'test error message')
            loggingUtility.warn('test warn message')
            sinon.assert.calledOnceWithMatch(mockConnection.console?.warn as sinon.SinonStub, 'test warn message')
            loggingUtility.info('test info message')
            sinon.assert.notCalled(mockConnection.console?.info as sinon.SinonStub)
            loggingUtility.log('test log message')
            sinon.assert.notCalled(mockConnection.console?.log as sinon.SinonStub)
            loggingUtility.debug('test debug message')
            sinon.assert.notCalled(mockConnection.console?.debug as sinon.SinonStub)
        })
    })
})
