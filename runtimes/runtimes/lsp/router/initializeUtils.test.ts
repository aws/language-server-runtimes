import { URI } from 'vscode-uri'
import * as path from 'path'
import os from 'os'
import * as assert from 'assert'
import * as sinon from 'sinon'
import { InitializeParams, WorkspaceFolder } from 'vscode-languageserver-protocol'
import { getWorkspaceFoldersFromInit } from './initializeUtils'
import { RemoteConsole } from 'vscode-languageserver'

describe('initializeUtils', () => {
    let consoleStub: sinon.SinonStubbedInstance<RemoteConsole>

    beforeEach(() => {
        consoleStub = {
            log: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
            info: sinon.stub(),
        } as sinon.SinonStubbedInstance<RemoteConsole>
    })

    describe('getWorkspaceFolders', () => {
        const sampleWorkspaceUri = 'file:///path/to/folder'
        const sampleWorkspaceName = 'folder'
        const sampleWorkspaceFolder: WorkspaceFolder = {
            name: sampleWorkspaceName,
            uri: sampleWorkspaceUri,
        }

        const createParams = (params: Partial<InitializeParams>) => params as InitializeParams

        it('should return workspaceFolders when provided', () => {
            const workspaceFolders: WorkspaceFolder[] = [
                sampleWorkspaceFolder,
                { name: 'folder2', uri: 'file:///path/to/folder2' },
            ]
            const params = createParams({ workspaceFolders })
            const result = getWorkspaceFoldersFromInit(consoleStub, params)

            assert.deepStrictEqual(result, workspaceFolders)
        })

        describe('should create workspace folder from rootUri when workspaceFolders is not provided', () => {
            const invalidWorkspaceFolderCases = [
                ['no workspaceFolder param', { rootUri: sampleWorkspaceUri }],
                ['empty workspaceFolder param params', { WorkspaceFolders: [], rootUri: sampleWorkspaceUri }],
            ] as const

            invalidWorkspaceFolderCases.forEach(([name, input]) => {
                it(`should return root uri for ${name}`, () => {
                    const params = createParams(input)
                    const result = getWorkspaceFoldersFromInit(consoleStub, params)
                    assert.deepStrictEqual(result, [sampleWorkspaceFolder])
                })
            })
            const params = createParams({ rootUri: sampleWorkspaceUri })
            const result = getWorkspaceFoldersFromInit(consoleStub, params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should create workspace folder from rootPath when neither workspaceFolders nor rootUri is provided', () => {
            const rootPath = '/path/to/folder'
            const params = createParams({ rootPath: rootPath })
            const result = getWorkspaceFoldersFromInit(consoleStub, params)

            assert.deepStrictEqual(result, [sampleWorkspaceFolder])
        })

        it('should use uri as folder name when URI basename is empty', () => {
            const rootUri = 'file:///'
            const params = createParams({ rootUri })
            const result = getWorkspaceFoldersFromInit(consoleStub, params)

            assert.deepStrictEqual(result, [{ name: rootUri, uri: rootUri }])
        })

        it('should handle Windows paths correctly', () => {
            const rootPath = 'C:\\Users\\test\\folder'
            const pathUri = URI.parse(rootPath).toString()
            const params = createParams({ rootPath })

            const result = getWorkspaceFoldersFromInit(consoleStub, params)
            let expectedName
            if (os.platform() === 'win32') {
                expectedName = path.basename(URI.parse(pathUri).fsPath)
            } else {
                // using path.basename on unix with a windows path
                // will cause it to return \\Users\\test\\folder instead
                expectedName = 'folder'
            }

            assert.deepStrictEqual(result, [{ name: expectedName, uri: pathUri }])
        })

        it('should handle rootUri with special characters', () => {
            const rootUri = 'file:///path/to/special%20project'
            const decodedPath = URI.parse(rootUri).path
            const folderName = path.basename(decodedPath)

            const params = createParams({ rootUri })
            const result = getWorkspaceFoldersFromInit(consoleStub, params)

            assert.deepStrictEqual(result, [{ name: folderName, uri: rootUri }])
            assert.equal('special project', result[0].name)
        })

        describe('should return empty workspaceFolder array', () => {
            const emptyArrayCases = [
                ['no params', {} as InitializeParams],
                ['undefined params', undefined as unknown as InitializeParams],
                ['null params', null as unknown as InitializeParams],
                ['empty workspaceFolders', { workspaceFolders: [] } as unknown as InitializeParams],
            ] as const

            emptyArrayCases.forEach(([name, input]) => {
                it(`should return empty array for ${name}`, () => {
                    const result = getWorkspaceFoldersFromInit(consoleStub, input)
                    assert.equal(result.length, 0)
                })
            })
        })
    })
})
