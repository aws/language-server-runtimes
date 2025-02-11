import sinon, { stubInterface } from 'ts-sinon'
import { AwsCognitoApiGatewaySender } from './aws-cognito-gateway-sender'
import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from '@aws-sdk/client-cognito-identity'
import axios, { AxiosInstance } from 'axios'
import { SignatureV4 } from '@smithy/signature-v4'
import { diag } from '@opentelemetry/api'

describe('AwsCognitoApiGatewaySender', () => {
    let sender: AwsCognitoApiGatewaySender
    let cognitoSendStub: sinon.SinonStub
    let axiosStub: sinon.SinonStubbedInstance<AxiosInstance>
    let axiosCreateStub: sinon.SinonStub
    let signRequestStub: sinon.SinonStub
    let diagStub: sinon.SinonStub

    const testEndpoint = 'https://test.amazon.com'
    const testRegion = 'us-west-2'
    const testPoolId = '12345'

    const testData = {
        timestamp: 12345,
        metrics: [],
    } as any

    beforeEach(() => {
        sender = new AwsCognitoApiGatewaySender(testEndpoint, testRegion, testPoolId)
        cognitoSendStub = sinon.stub(CognitoIdentityClient.prototype, 'send')

        axiosStub = stubInterface<AxiosInstance>()
        axiosStub.post.resolves({ status: 200, statusText: 'ok' })
        axiosStub.interceptors = sinon.stub() as any
        axiosStub.interceptors.response = sinon.stub() as any
        axiosStub.interceptors.response.use = sinon.stub()
        axiosCreateStub = sinon.stub(axios, 'create').returns(axiosStub as any)

        signRequestStub = sinon.stub(SignatureV4.prototype, 'sign').resolves({
            headers: {
                Authorization: 'signedHeader',
            },
        } as any)
        diagStub = sinon.stub(diag, 'info')
    })

    afterEach(() => {
        sinon.restore()
    })

    describe('sendOperationalTelemetryData', () => {
        it('should not refresh credentials before expiration buffer time', async () => {
            cognitoSendStub.callsFake(async command => {
                if (command instanceof GetIdCommand) {
                    return { IdentifyId: 'testId' }
                } else if (command instanceof GetCredentialsForIdentityCommand) {
                    return {
                        Credentials: {
                            AccessKeyId: 'testAccessKeyId',
                            SecretKey: 'testSecretKey',
                            SessionToken: 'testSessionToken',
                        },
                    }
                }
            })

            await sender.sendOperationalTelemetryData(testData)
            await sender.sendOperationalTelemetryData(testData)

            // credentials retrieved once (cognito stub called two times) after short time gap
            sinon.assert.calledTwice(cognitoSendStub)
            sinon.assert.calledTwice(axiosStub.post)
            sinon.assert.calledTwice(signRequestStub)

            const clock = sinon.useFakeTimers(Date.now())
            clock.tick(58 * 60 * 1000)
            await sender.sendOperationalTelemetryData(testData)

            // credentials retrieved once (cognito stub called two times) after 58 minutes
            sinon.assert.calledTwice(cognitoSendStub)

            clock.tick(2 * 60 * 1000)
            await sender.sendOperationalTelemetryData(testData)

            // credentials retrieved two times (cognito stub called four times) after 60 minutes
            sinon.assert.callCount(cognitoSendStub, 4)

            clock.restore()
        })
    })
})
