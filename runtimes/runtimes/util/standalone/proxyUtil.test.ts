/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { strict as assert } from 'assert'
import sinon from 'sinon'
import mockFs from 'mock-fs'
import { HttpsProxyAgent } from 'hpagent'
import { Agent as HttpsAgent } from 'node:https'
import { ProxyConfigManager } from './proxyUtil'

describe('ProxyConfigManager', () => {
    let proxyManager: ProxyConfigManager
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        originalEnv = { ...process.env }
        process.env = {}
        proxyManager = new ProxyConfigManager()
    })

    afterEach(() => {
        process.env = originalEnv
        sinon.restore()
        mockFs.restore()
    })

    it('should cache and return same V2 config', () => {
        const config1 = proxyManager.getV2ProxyConfig()
        const config2 = proxyManager.getV2ProxyConfig()

        assert.strictEqual(config1, config2)
        assert.strictEqual(config1.httpOptions?.agent, config2.httpOptions?.agent)
    })

    it('should cache and return same V3 config', () => {
        const config1 = proxyManager.getV3ProxyConfig()
        const config2 = proxyManager.getV3ProxyConfig()

        assert.strictEqual(config1, config2)
    })

    it('should use same agent for V2 and V3 configs', () => {
        const getAgentSpy = sinon.spy(proxyManager, 'getSecureAgent')
        proxyManager.getV2ProxyConfig()
        proxyManager.getV3ProxyConfig()

        assert(getAgentSpy.calledTwice)
        assert.strictEqual(getAgentSpy.firstCall.returnValue, getAgentSpy.secondCall.returnValue)
    })

    describe('getProxyUrl', () => {
        it('should return undefined when no proxy environment variables are set', () => {
            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, undefined)
        })

        it('should prioritize HTTPS_PROXY over all other variables', () => {
            process.env.HTTPS_PROXY = 'https://proxy1.example.com'
            process.env.https_proxy = 'https://proxy2.example.com'
            process.env.HTTP_PROXY = 'http://proxy3.example.com'
            process.env.http_proxy = 'http://proxy4.example.com'

            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, 'https://proxy1.example.com')
        })

        it('should use https_proxy when HTTPS_PROXY is not set', () => {
            process.env.https_proxy = 'https://proxy2.example.com'
            process.env.HTTP_PROXY = 'http://proxy3.example.com'
            process.env.http_proxy = 'http://proxy4.example.com'

            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, 'https://proxy2.example.com')
        })

        it('should use HTTP_PROXY when no HTTPS proxies are set', () => {
            process.env.HTTP_PROXY = 'http://proxy3.example.com'
            process.env.http_proxy = 'http://proxy4.example.com'

            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, 'http://proxy3.example.com')
        })

        it('should use http_proxy when it is the only proxy set', () => {
            process.env.http_proxy = 'http://proxy4.example.com'

            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, 'http://proxy4.example.com')
        })

        it('should handle invalid proxy URLs', () => {
            process.env.HTTPS_PROXY = 'invalid-url'
            process.env.HTTP_PROXY = 'http://valid.example.com'

            const proxyUrl = proxyManager.getProxyUrl()
            assert.strictEqual(proxyUrl, 'http://valid.example.com')
        })
    })

    describe('getCertificates', () => {
        let getCertificatesStub: sinon.SinonStub

        beforeEach(() => {
            getCertificatesStub = sinon.stub(proxyManager, 'readSystemCertificates')
        })

        afterEach(() => {
            delete process.env.AWS_CA_BUNDLE
            delete process.env.NODE_EXTRA_CA_CERTS
            getCertificatesStub.restore()
        })

        it('should read system certificates', () => {
            const sysCerts = ['system-cert']
            getCertificatesStub.returns(sysCerts)

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, sysCerts)
            assert(getCertificatesStub.calledOnce)
        })

        it('should read AWS_CA_BUNDLE when set', () => {
            const awsCert = 'aws-cert-content'
            process.env.AWS_CA_BUNDLE = '/path/to/aws/cert/aws-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': awsCert,
                },
            })

            getCertificatesStub.returns([])

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [awsCert])
        })

        it('should read NODE_EXTRA_CA_CERTS when set', () => {
            const nodeCaCert = 'node-extra-ca-certs-content'
            process.env.NODE_EXTRA_CA_CERTS = '/path/to/aws/cert/aws-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': nodeCaCert,
                },
            })

            getCertificatesStub.returns([])

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [nodeCaCert])
        })

        it('should combine certificates from all sourcves when set', () => {
            const sysCerts = ['system-cert']
            getCertificatesStub.returns(sysCerts)

            const awsCert = 'aws-cert-content'
            process.env.AWS_CA_BUNDLE = '/path/to/aws/cert/aws-cert.pem'
            const nodeCaCert = 'node-extra-ca-certs-content'
            process.env.NODE_EXTRA_CA_CERTS = '/path/to/aws/cert/node-ca-extra-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': awsCert,
                    'node-ca-extra-cert.pem': nodeCaCert,
                },
            })

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [...sysCerts, awsCert, nodeCaCert])
        })
    })

    describe('createSecureAgent', () => {
        it('should create HttpsAgent when no proxy set (transparent proxy)', () => {
            const agent = proxyManager.createSecureAgent()

            assert(agent instanceof HttpsAgent)
            assert.strictEqual((agent as HttpsAgent).options.rejectUnauthorized, true)
            // @ts-ignore
            assert.strictEqual(agent.proxy, undefined)
        })

        it('should create HttpsProxyAgent when proxy set', () => {
            process.env.HTTPS_PROXY = 'https://proxy'
            const agent = proxyManager.createSecureAgent()

            assert(agent instanceof HttpsProxyAgent)
            assert.strictEqual(agent.options.rejectUnauthorized, true)
            // @ts-ignore
            assert.strictEqual(agent.proxy.origin, 'https://proxy')
        })
    })
})
