/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agent as HttpsAgent } from 'node:https'
import { strict as assert } from 'node:assert'
import sinon from 'sinon'
import mockFs from 'mock-fs'
import { HttpsProxyAgent } from 'hpagent'
import { ProxyConfigManager } from './proxyUtil'
import * as certificatesReaders from './certificatesReaders'
import { Telemetry } from '../../../server-interface'
import forge from 'node-forge'

export const generateCert = (validityDays = 365) => {
    const keys = forge.pki.rsa.generateKeyPair(2048)
    const cert = forge.pki.createCertificate()
    cert.publicKey = keys.publicKey

    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * validityDays)
    cert.sign(keys.privateKey)

    return {
        cert: forge.pki.certificateToPem(cert),
        privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    }
}

describe('ProxyConfigManager', () => {
    let proxyManager: ProxyConfigManager
    let originalEnv: NodeJS.ProcessEnv
    let readMacosCertificatesStub: sinon.SinonStub
    let readLinuxCertificatesStub: sinon.SinonStub
    let readWindowsCertificatesStub: sinon.SinonStub
    let telemetryStub: Telemetry

    beforeEach(() => {
        originalEnv = { ...process.env }
        process.env = {}

        telemetryStub = {
            emitMetric: sinon.stub(),
            onClientTelemetry: sinon.stub(),
        }
        proxyManager = new ProxyConfigManager(telemetryStub)

        readMacosCertificatesStub = sinon.stub(certificatesReaders, 'readMacosCertificates').returns([])
        readLinuxCertificatesStub = sinon.stub(certificatesReaders, 'readLinuxCertificates').returns([])
        readWindowsCertificatesStub = sinon.stub(certificatesReaders, 'readWindowsCertificates').returns([])
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
        beforeEach(() => {
            sinon.stub(process, 'platform').value('linux')
        })

        afterEach(() => {
            delete process.env.AWS_CA_BUNDLE
            delete process.env.NODE_EXTRA_CA_CERTS
        })

        it('should read system certificates', () => {
            const cert = generateCert()
            const sysCerts = [cert.cert]
            readLinuxCertificatesStub.returns(sysCerts)

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, sysCerts)
        })

        it('should read AWS_CA_BUNDLE when set', () => {
            const cert = generateCert()
            process.env.AWS_CA_BUNDLE = '/path/to/aws/cert/aws-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': cert.cert,
                },
            })

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [cert.cert])
        })

        it('should read NODE_EXTRA_CA_CERTS when set', () => {
            const cert = generateCert()
            process.env.NODE_EXTRA_CA_CERTS = '/path/to/aws/cert/aws-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': cert.cert,
                },
            })

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [cert.cert])
        })

        it('should combine certificates from all sources when set', () => {
            const cert = generateCert()
            const sysCerts = [cert.cert]
            readLinuxCertificatesStub.returns(sysCerts)

            const awsCert = generateCert()
            process.env.AWS_CA_BUNDLE = '/path/to/aws/cert/aws-cert.pem'
            const nodeCaCert = generateCert()
            process.env.NODE_EXTRA_CA_CERTS = '/path/to/aws/cert/node-ca-extra-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': awsCert.cert,
                    'node-ca-extra-cert.pem': nodeCaCert.cert,
                },
            })

            const certs = proxyManager.getCertificates()
            assert.deepStrictEqual(certs, [...sysCerts, awsCert.cert, nodeCaCert.cert])
        })

        it('should remove invalid certificates', () => {
            const validCert1 = generateCert()
            const validCert2 = generateCert()
            const invalidCert = generateCert(-365)
            const sysCerts = [validCert1.cert, invalidCert.cert, validCert2.cert]

            readLinuxCertificatesStub.returns(sysCerts)

            const invalidAwsCert = generateCert(-365)
            process.env.AWS_CA_BUNDLE = '/path/to/aws/cert/aws-cert.pem'
            const invalidNodeCaCert = generateCert(-365)
            process.env.NODE_EXTRA_CA_CERTS = '/path/to/aws/cert/node-ca-extra-cert.pem'
            mockFs({
                '/path/to/aws/cert': {
                    'aws-cert.pem': invalidAwsCert.cert,
                    'node-ca-extra-cert.pem': invalidNodeCaCert.cert,
                },
            })

            const certs = proxyManager.getCertificates()
            assert.equal(certs.length, 2)
            assert.deepStrictEqual(certs, [validCert1.cert, validCert2.cert])
        })
    })

    describe('readSystemCertificates', () => {
        it('should read use platform-specific certificates reader', () => {
            sinon.stub(process, 'platform').value('linux')
            proxyManager.getCertificates()

            sinon.stub(process, 'platform').value('darwin')
            proxyManager.getCertificates()

            sinon.stub(process, 'platform').value('win32')
            proxyManager.getCertificates()

            assert(readLinuxCertificatesStub.calledOnce)
            assert(readMacosCertificatesStub.calledOnce)
            assert(readWindowsCertificatesStub.calledOnce)
        })

        it('should return empty list on unsupported platform', () => {
            sinon.stub(process, 'platform').value('unsupported-platform')
            readLinuxCertificatesStub.returns(['testcert'])
            readWindowsCertificatesStub.returns(['testcert'])
            readMacosCertificatesStub.returns(['testcert'])

            const certs = proxyManager.getCertificates()

            assert(readLinuxCertificatesStub.notCalled)
            assert(readMacosCertificatesStub.notCalled)
            assert(readWindowsCertificatesStub.notCalled)
            assert.deepStrictEqual(certs, [])
        })
    })

    describe('createSecureAgent', () => {
        beforeEach(() => {
            sinon.stub(process, 'platform').value('linux')
            const sysCerts = [generateCert().cert, generateCert().cert, generateCert().cert]
            readLinuxCertificatesStub.returns(sysCerts)
        })

        it('should create HttpsAgent when no proxy set (transparent proxy)', () => {
            const agent = proxyManager.createSecureAgent()

            assert(agent instanceof HttpsAgent)
            assert.strictEqual((agent as HttpsAgent).options.rejectUnauthorized, true)
            // @ts-ignore
            assert.strictEqual(agent.proxy, undefined)
            assert(
                // @ts-ignore
                telemetryStub.emitMetric.calledOnceWithExactly({
                    name: 'runtime_httpProxyConfiguration',
                    result: 'Succeeded',
                    data: {
                        proxyMode: 'Transparent',
                        certificatesNumber: 3,
                    },
                })
            )
        })

        it('should create HttpsProxyAgent when proxy set', () => {
            process.env.HTTPS_PROXY = 'https://proxy'
            const agent = proxyManager.createSecureAgent()

            assert(agent instanceof HttpsProxyAgent)
            assert.strictEqual(agent.options.rejectUnauthorized, true)
            // @ts-ignore
            assert.strictEqual(agent.proxy.origin, 'https://proxy')
            assert(
                // @ts-ignore
                telemetryStub.emitMetric.calledOnceWithExactly({
                    name: 'runtime_httpProxyConfiguration',
                    result: 'Succeeded',
                    data: {
                        proxyMode: 'Explicit',
                        proxyUrl: 'https://proxy',
                        certificatesNumber: 3,
                    },
                })
            )
        })
    })
})
