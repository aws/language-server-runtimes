import assert from 'assert'
import { WebBase64Encoding } from './encoding'
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon'

describe('WebBase64Encoding', () => {
    const wdw = <WindowOrWorkerGlobalScope>{}
    const encoding = new WebBase64Encoding(wdw)

    it('encodes and decodes string', () => {
        const val = 'server1__1'
        const encodedVal = 'xxxx'
        wdw.btoa = sinon.stub().withArgs(val).returns(encodedVal)
        wdw.atob = sinon.stub().withArgs(encodedVal).returns(val)
        const valAfterEncoding = encoding.decode(encoding.encode(val))
        assert.equal(valAfterEncoding, val)
    })

    it('encodes and decodes unicode', () => {
        const val = 'Σ'
        const convertedVal = 'Î£'
        const encodedVal = 'xxxx'
        wdw.btoa = sinon.stub().withArgs(convertedVal).returns(encodedVal)
        wdw.atob = sinon.stub().withArgs(encodedVal).returns(convertedVal)
        const valAfterEncoding = encoding.decode(encoding.encode(val))
        assert.equal(valAfterEncoding, val)
    })
})
