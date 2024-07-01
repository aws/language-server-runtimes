import sinon, { stubConstructor } from 'ts-sinon'
// import { mocked } from 'ts-jest';
import assert from 'assert'
import { ProposedFeatures, createConnection, Connection } from 'vscode-languageserver/node'
import { Auth } from './auth'
import { testAuth, standalone } from './standalone'

jest.mock('./auth', () => {
    return {
        Auth: jest.fn().mockImplementation(() => {
            return {
                getCredentialsProvider: () => {
                    console.log('Test mocked auth')
                },
            }
        }),
    }
})
jest.mock('vscode-languageserver/node')

describe('createAuth', () => {
    // beforeEach(() => {
    //     // sandbox = sinon.createSandbox()
    //     // mockAuth.mockClear();
    // });

    // afterEach(() => {
    //     // sandbox.restore();
    // });

    it('should create an instance of Auth with correct arguments (using assert)', () => {
        // const mockConnection: Connection = {
        //     // @ts-ignore
        //     console: {
        //         info: (...params) => console.log(params),
        //     },
        //     onInitialize: sinon.stub(),
        //     onExecuteCommand: sinon.stub(),
        //     onExit: sinon.stub(),
        //     onWillSaveTextDocumentWaitUntil: sinon.stub(),
        //     listen: sinon.stub(),
        // }
        // const createConnectionStub = sinon.stub(require('vscode-languageserver/node'), 'createConnection')
        // createConnectionStub.returns(mockConnection)

        standalone({
            name: 'Test',
            servers: [],
        })

        // const a = testAuth()

        // @ts-ignore
        console.log(Auth.mock.calls)
    })
})
