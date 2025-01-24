import { getServerDataDirPath } from './serverDataDirPath'
import assert from 'assert'
import sinon from 'sinon'
import { InitializeParams } from '../../protocol'
import path from 'path'
import os from 'os'

describe('getServerDataDirPath', () => {
    let initializeParams: InitializeParams
    let platformStub: sinon.SinonStub
    let processEnvStub: sinon.SinonStub
    const serverName = 'testServer'
    const expectedClientFolderName = 'aws_vscode_sample_extension_for_vscode'

    beforeEach(() => {
        initializeParams = {
            processId: null,
            rootUri: null,
            clientInfo: {
                name: '.params VSCode',
                version: '2.5.2',
            },
            capabilities: {},
            initializationOptions: {
                aws: {
                    clientInfo: {
                        name: 'aws VSCode ',
                        version: '2.5.2',
                        extension: {
                            name: 'Sample Extension for VSCode',
                            version: '0.0.1',
                        },
                    },
                },
            },
        }
    })

    afterEach(() => {
        sinon.restore()
    })

    it('should return the clientDataFolder param if present', () => {
        const clientDataFolderPath = path.join('client-specified', 'path', 'to', 'data')
        initializeParams.initializationOptions!.aws.clientDataFolder = clientDataFolderPath
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the default application data path on Windows', () => {
        platformStub = sinon.stub(process, 'platform').value('win32')

        const clientDataFolderPath = path.join(os.homedir(), 'AppData', 'Roaming', expectedClientFolderName)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the path from APPDATA environmental variable if present on Windows', () => {
        platformStub = sinon.stub(process, 'platform').value('win32')
        const appDataEnv = 'AppDataPath'
        processEnvStub = sinon.stub(process, 'env').value({
            ...process.env,
            APPDATA: appDataEnv,
        })

        const clientDataFolderPath = path.join(appDataEnv, expectedClientFolderName)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the default application data path on Darwin', () => {
        platformStub = sinon.stub(process, 'platform').value('darwin')

        const clientDataFolderPath = path.join(os.homedir(), 'Library', 'Application Support', expectedClientFolderName)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the default application data path on Linux', () => {
        platformStub = sinon.stub(process, 'platform').value('linux')

        const clientDataFolderPath = path.join(os.homedir(), '.local', 'share', expectedClientFolderName)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the path from the XDG_DATA_HOME environmental variable if present on Linux', () => {
        platformStub = sinon.stub(process, 'platform').value('linux')
        const xdgDataHome = 'xgdDataPath'
        processEnvStub = sinon.stub(process, 'env').value({
            ...process.env,
            XDG_DATA_HOME: xdgDataHome,
        })

        const clientDataFolderPath = path.join(xdgDataHome, expectedClientFolderName)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the home directory with a hidden directory for unrecognized platforms', () => {
        platformStub = sinon.stub(process, 'platform').value('freebsd')

        const clientDataFolderPath = path.join(os.homedir(), `.${expectedClientFolderName}`)
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should reduce long client folder names that could exceed the file system limit', () => {
        platformStub = sinon.stub(process, 'platform').value('darwin')

        initializeParams.initializationOptions!.aws.clientInfo!.extension.name =
            'Sample Extension for VSCode Sample Extension for VSCode Sample Extension for VSCode Sample Extension for VSCode'
        const clientDataFolderPath = path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'aws_vscode_sample_extension_for_vscode_sample_extension_for_vscode_sample_extension_for_vscode_sampl'
        )
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should filter problematic characters from the client folder name', () => {
        platformStub = sinon.stub(process, 'platform').value('darwin')

        initializeParams.initializationOptions!.aws.clientInfo!.name = '.?vs@-code_123 '
        initializeParams.initializationOptions!.aws.clientInfo!.extension.name = ' ..Sample Extension for VSCode!  '
        const clientDataFolderPath = path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'vs_code_123_sample_extension_for_vscode'
        )
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should use the default clientInfo parameter if AWS clientInfo is not specified', () => {
        platformStub = sinon.stub(process, 'platform').value('darwin')

        initializeParams.initializationOptions!.aws.clientInfo = undefined
        const clientDataFolderPath = path.join(os.homedir(), 'Library', 'Application Support', 'params_vscode')
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should omit the client folder if clientInfo is not specified', () => {
        platformStub = sinon.stub(process, 'platform').value('darwin')

        initializeParams.initializationOptions = undefined
        initializeParams.clientInfo = undefined
        const clientDataFolderPath = path.join(os.homedir(), 'Library', 'Application Support')
        const expected = path.join(clientDataFolderPath, serverName)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })

    it('should omit the client folder if clientInfo is not specified and append the server name as a hidden directory', () => {
        platformStub = sinon.stub(process, 'platform').value('freebsd')

        initializeParams.initializationOptions!.aws.clientInfo = undefined
        initializeParams.clientInfo = undefined
        const clientDataFolderPath = path.join(os.homedir())
        const expected = path.join(clientDataFolderPath, `.${serverName}`)

        const result = getServerDataDirPath(serverName, initializeParams)
        assert.strictEqual(result, expected)
    })
})
