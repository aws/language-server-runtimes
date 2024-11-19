import sinon, { assert } from 'sinon'
import { Encoding } from '../../encoding'
import { EventIdentifier, FollowupIdentifier } from '../../../protocol'
import { RouterByServerName } from './routerByServerName'

describe('RouterByServerName', () => {
    const encoding = <Encoding>{
        encode: value => Buffer.from(value).toString('base64'),
        decode: value => Buffer.from(value, 'base64').toString('utf-8'),
    }
    const serverName = 'Server_XXX'

    let router: RouterByServerName<Partial<EventIdentifier>, FollowupIdentifier>

    beforeEach(() => {
        router = new RouterByServerName<Partial<EventIdentifier>, FollowupIdentifier>(serverName, encoding)
    })

    describe('send', () => {
        it('attaches serverName to id if id is defined', () => {
            const sendSpy = sinon.spy()
            router.send(sendSpy, { id: '123' })

            const expectedEncodedId = encoding.encode('{"serverName":"Server_XXX","id":"123"}')
            assert.calledWithMatch(sendSpy, { id: expectedEncodedId })
        })
        it('uses original params if id is not defined', () => {
            const sendSpy = sinon.spy()
            router.send(sendSpy, {})
            assert.calledWith(sendSpy, {})
        })
    })
    describe('processFollowup', () => {
        it('calls followup handler if id contains serverName and removes serverName from id', () => {
            const followupHandlerSpy = sinon.spy()
            const params = {
                source: {
                    id: encoding.encode('{"serverName":"Server_XXX", "id":"123"}'),
                },
            }
            router.processFollowup(followupHandlerSpy, params)
            assert.calledOnceWithMatch(followupHandlerSpy, { source: { id: '123' } })
        })
        it('does not call followup handler if id does not contain serverName', () => {
            const followupHandlerSpy = sinon.spy()
            const params = { source: { id: 'A' } }
            router.processFollowup(followupHandlerSpy, params)
            assert.notCalled(followupHandlerSpy)
        })
        it('does not call followup handler if id contains different serverName', () => {
            const followupHandlerSpy = sinon.spy()
            const params = {
                source: {
                    id: encoding.encode('{"serverName":"Fake", "id":"123"}'),
                },
            }
            router.processFollowup(followupHandlerSpy, params)
            assert.notCalled(followupHandlerSpy)
        })
    })
})
