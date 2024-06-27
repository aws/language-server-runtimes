import { standalone } from './standalone'
import { RuntimeProps } from './runtime'
import { LspRouter } from './lsp/router/lspRouter'
import { LspServer } from './lsp/router/lspServer'
import { Auth } from './auth'
import * as assert from 'assert'
import { stub, SinonStub, createStubInstance } from 'sinon'
import sinon from 'sinon'
import { EncryptionInitialization } from './auth/standalone/encryption'
import { ProposedFeatures, createConnection, Connection } from 'vscode-languageserver/node'

describe('standalone runtime', () => {
    describe('initialization', () => {
        it('should handle version argument correctly', () => {
            // Test the `handleVersionArgument` function
        })

        describe('initauth2', () => {
            let createConnectionStub: SinonStub<[typeof ProposedFeatures], Connection>
            let authStub: any

            beforeEach(() => {
                createConnectionStub = stub(require('vscode-languageserver/node'), 'createConnection')
                authStub = stub(Auth, 'constructor')
            })

            afterEach(() => {
                createConnectionStub.restore()
                ;(Auth.constructor as SinonStub).restore()
            })

            it.only('should initialize Auth with encryption when encryptionRequired is true', async () => {
                // Arrange
                const mockConnection: Connection = {
                    // Mock the necessary methods and properties of the Connection interface
                    // @ts-ignore
                    console: {
                        info: (...params) => console.log(params),
                    },
                    // telemetry: {
                    //     logEvent: () => {},
                    // },
                    // Add other mocked methods as needed
                    onInitialize: sinon.stub(),
                    onExecuteCommand: sinon.stub(),
                    onExit: sinon.stub(),
                    onWillSaveTextDocumentWaitUntil: sinon.stub(),
                    listen: sinon.stub(),
                }
                createConnectionStub.returns(mockConnection)

                const encryptionDetails: EncryptionInitialization = {
                    version: '1.0',
                    mode: 'JWT',
                    key: 'test-key',
                }

                stub(process.stdin, 'read').returns(`${JSON.stringify(encryptionDetails)}\n`)

                const runtimeProps: RuntimeProps = {
                    servers: [],
                    name: 'Test Server',
                }

                await standalone(runtimeProps)

                // assert.ok(authStub.calledWithNew(), 'Auth should be initialized with new');
                assert.ok(
                    authStub.calledWith(sinon.match.any, 'test-key', 'JWT'),
                    'Auth should be initialized with encryption details'
                )
            })

            it('should initialize Auth without encryption when encryptionRequired is false', async () => {
                // Arrange
                const mockConnection: Connection = {
                    // Mock the necessary methods and properties of the Connection interface
                    // @ts-ignore
                    console: {
                        info: (...params) => console.log(params),
                    },
                    // telemetry: {
                    //     logEvent: () => {},
                    // },
                    // Add other mocked methods as needed
                    onInitialize: sinon.stub(),
                    onExecuteCommand: sinon.stub(),
                    onExit: sinon.stub(),
                    onWillSaveTextDocumentWaitUntil: sinon.stub(),
                    listen: sinon.stub(),
                }
                createConnectionStub.returns(mockConnection)

                const encryptionDetails: EncryptionInitialization = {
                    version: '1.0',
                    mode: 'JWT',
                    key: 'test-key',
                }

                stub(process.stdin, 'read').returns(`${JSON.stringify(encryptionDetails)}\n`)

                const runtimeProps: RuntimeProps = {
                    servers: [],
                    name: 'Test Server',
                }

                await standalone(runtimeProps)

                // assert.ok(authStub.calledWithNew(), 'Auth should be initialized with new');
                assert.ok(authStub.calledWith(sinon.match.any), 'Auth should be initialized')
                assert.ok(
                    !authStub.calledWith(sinon.match.any, sinon.match.any, sinon.match.any),
                    'Auth should not be initialized with encryption details'
                )
            })
        })

        // describe('initializeAuth', () => {
        //     let authStub: SinonStub<[EncryptionInitialization?], Auth>;

        //     beforeEach(() => {
        //         authStub = stub(Auth.prototype, 'constructor');
        //     });

        //     afterEach(() => {
        //         authStub.restore();
        //     });

        //     it('should initialize Auth with encryption when encryptionRequired is true', async () => {
        //         const encryptionDetails: EncryptionInitialization = {
        //             key: 'test-key',
        //             mode: 'test-mode',
        //         };

        //         stub(process.stdin, 'read').returns(`${JSON.stringify(encryptionDetails)}\n`);

        //         await initializeAuth();

        //         assert.ok(authStub.calledWithNew(), 'Auth should be initialized with new');
        //         assert.ok(authStub.calledWith(sinon.match.any, 'test-key', 'test-mode'), 'Auth should be initialized with encryption details');
        //     });

        //     it('should initialize Auth without encryption when encryptionRequired is false', async () => {
        //         stub(process.stdin, 'read').returns('');

        //         await initializeAuth();

        //         assert.ok(authStub.calledWithNew(), 'Auth should be initialized with new');
        //         assert.ok(authStub.calledWith(sinon.match.any), 'Auth should be initialized');
        //         assert.ok(!authStub.calledWith(sinon.match.any, sinon.match.any, sinon.match.any), 'Auth should not be initialized with encryption details');
        //     });

        //     it('should throw an error when encryptionRequired is true but details are missing', async () => {
        //         stub(process.stdin, 'read').returns('');

        //         try {
        //             await initializeAuth();
        //             assert.fail('initializeAuth should have thrown an error');
        //         } catch (error) {
        //             assert.ok(error instanceof Error, 'Error should be thrown');
        //         }
        //     });

        //     it('should throw an error when encryptionRequired is true but details are invalid', async () => {
        //         const invalidEncryptionDetails: EncryptionInitialization = {
        //             key: '',
        //             mode: '',
        //         };

        //         stub(process.stdin, 'read').returns(`${JSON.stringify(invalidEncryptionDetails)}\n`);

        //         try {
        //             await initializeAuth();
        //             assert.fail('initializeAuth should have thrown an error');
        //         } catch (error) {
        //             assert.ok(error instanceof Error, 'Error should be thrown');
        //         }
        //     });

        //     it('should handle errors during Auth initialization gracefully', async () => {
        //         authStub.throws(new Error('Test error'));

        //         try {
        //             await initializeAuth();
        //             assert.fail('initializeAuth should have thrown an error');
        //         } catch (error) {
        //             assert.ok(error instanceof Error, 'Error should be thrown');
        //             assert.strictEqual(error.message, 'Test error', 'Error message should match');
        //         }
        //     });
        // });

        it('should initialize runtime services correctly', () => {
            // Test the `initializeRuntime` function
        })
    })

    describe('LSP connection and routing', () => {
        it('should create a valid LSP connection', () => {
            // Test the `createConnection` function
        })

        it('should correctly route LSP events to the servers', () => {
            // Test the `LspRouter` implementation
        })

        it('should initialize LSP servers correctly', () => {
            // Test the initialization of `LspServer` instances
        })
    })

    describe('service implementations', () => {
        it('should log messages correctly through the LSP connection', () => {
            // Test the `Logging` service
        })

        it('should emit telemetry and handle client telemetry correctly', () => {
            // Test the `Telemetry` service
        })

        it('should manage the workspace correctly', () => {
            // Test the `Workspace` service
        })

        it('should handle chat-related events and notifications correctly', () => {
            // Test the `Chat` service
        })

        it('should provide the necessary credentials', () => {
            // Test the `CredentialsProvider` service
        })
    })

    describe('error handling and edge cases', () => {
        it('should handle errors during initialization gracefully', () => {
            // Test error scenarios during initialization
        })

        it('should handle invalid RuntimeProps correctly', () => {
            // Test edge cases with the RuntimeProps object
        })
    })

    describe('integration with LSP servers', () => {
        it('should correctly initialize and manage LSP servers', () => {
            // Test the integration between the runtime and mock LSP servers
        })
    })
})
