import * as fqn from '@aws/fully-qualified-names'
import * as assert from 'assert'
import sinon from 'ts-sinon'
import { findNames } from './fqnExtractor'

describe('fqnExtractor.findNames', () => {
    let typescriptStub: sinon.SinonStub
    let javaStub: sinon.SinonStub
    const tsResult = {}
    const javaResult = {}
    const mockRange = {
        start: {
            line: 0,
            character: 0,
        },
        end: {
            line: 1,
            character: 1,
        },
    }
    const mockFileText = `console.log('abc')`

    beforeEach(() => {
        typescriptStub = sinon.stub(fqn.TypeScript, 'findNames').callsFake(() => Promise.resolve(tsResult))
        javaStub = sinon.stub(fqn.Java, 'findNames').callsFake(() => Promise.resolve(javaResult))
    })

    afterEach(() => {
        typescriptStub.restore()
        javaStub.restore()
    })

    it('throws error with unsupported languageId', async () => {
        await assert.rejects(() =>
            findNames(fqn, {
                languageId: 'lolcode' as any,
                fileText: mockFileText,
            })
        )
    })

    it('calls the corresponding fqn function', async () => {
        let result = await findNames(fqn, {
            languageId: 'typescript',
            fileText: mockFileText,
        })

        sinon.assert.calledOnceWithMatch(typescriptStub, mockFileText)

        // reference check
        assert.strictEqual(result, tsResult)

        result = await findNames(fqn, {
            languageId: 'java',
            fileText: mockFileText,
        })

        sinon.assert.calledOnceWithMatch(javaStub, mockFileText)

        // reference check
        assert.strictEqual(result, javaResult)
    })

    describe('calls findNamesWithInExtent if selection exists, which', () => {
        let typescriptStub: sinon.SinonStub
        let javaStub: sinon.SinonStub

        beforeEach(() => {
            typescriptStub = sinon
                .stub(fqn.TypeScript, 'findNamesWithInExtent')
                .callsFake(() => Promise.resolve(tsResult))
            javaStub = sinon.stub(fqn.Java, 'findNamesWithInExtent').callsFake(() => Promise.resolve(javaResult))
        })

        afterEach(() => {
            typescriptStub.restore()
            javaStub.restore()
        })

        it('throws error with unsupported languageId', async () => {
            await assert.rejects(() =>
                findNames(fqn, {
                    languageId: 'lolcode' as any,
                    fileText: mockFileText,
                    selection: mockRange,
                })
            )
        })

        it('calls the corresponding fqn function', async () => {
            let result = await findNames(fqn, {
                languageId: 'typescript',
                fileText: mockFileText,
                selection: mockRange,
            })

            sinon.assert.calledOnceWithMatch(typescriptStub, mockFileText, sinon.match.instanceOf(fqn.Extent))

            // reference check
            assert.strictEqual(result, tsResult)

            result = await findNames(fqn, {
                languageId: 'java',
                fileText: mockFileText,
                selection: mockRange,
            })

            sinon.assert.calledOnceWithMatch(javaStub, mockFileText, sinon.match.instanceOf(fqn.Extent))

            // reference check
            assert.strictEqual(result, javaResult)
        })
    })
})
