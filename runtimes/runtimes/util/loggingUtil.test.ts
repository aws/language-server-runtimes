import { Connection, RemoteConsole } from 'vscode-languageserver/node'
import { isLogLevelEnabled, isValidLogLevel, DefaultLogger, LogLevel } from './loggingUtil'
import sinon from 'sinon'
import assert from 'assert'

describe('LoggingUtil', () => {
    let mockConnection: Partial<Connection>
    let consoleMock: Pick<RemoteConsole, 'error' | 'warn' | 'info' | 'log' | 'debug'>
    beforeEach(() => {
        consoleMock = {
            log: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
            info: sinon.stub(),
            debug: sinon.stub(),
        }
        mockConnection = {
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
            const invalidLevels = ['trace', 'verbose', undefined, null]
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

    describe('DefaultLogger implementation', () => {
        it('should check logging method of configured log level are called', async () => {
            const logging = new DefaultLogger('warn', mockConnection as Connection)
            assert.strictEqual('warn', logging.level)
            assert.strictEqual('function', typeof logging.error)
            assert.strictEqual('function', typeof logging.warn)
            assert.strictEqual('function', typeof logging.info)
            assert.strictEqual('function', typeof logging.log)
            assert.strictEqual('function', typeof logging.debug)
            logging.error('test error message')
            sinon.assert.calledOnceWithMatch(mockConnection.console?.error as sinon.SinonStub, 'test error message')
            logging.warn('test warn message')
            sinon.assert.calledOnceWithMatch(mockConnection.console?.warn as sinon.SinonStub, 'test warn message')
            logging.info('test info message')
            sinon.assert.notCalled(mockConnection.console?.info as sinon.SinonStub)
            logging.log('test log message')
            sinon.assert.notCalled(mockConnection.console?.log as sinon.SinonStub)
            logging.debug('test debug message')
            sinon.assert.notCalled(mockConnection.console?.debug as sinon.SinonStub)
        })
    })
})
