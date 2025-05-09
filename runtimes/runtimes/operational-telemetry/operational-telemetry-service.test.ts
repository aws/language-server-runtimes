import { OperationalTelemetryService } from './operational-telemetry-service'
import assert from 'assert'
import http from 'http'
import { AddressInfo } from 'net'
import { promisify } from 'util'
import resourceMetrics from './resource-metrics.test.json'
import resourceLogs from './resource-logs.test.json'

describe('OperationalTelemetryService with OpenTelemetry SDK', () => {
    let server: http.Server
    let serverUrl: string
    let receivedRequests: {
        path: string
        method: string
        headers: http.IncomingHttpHeaders
        body: any
    }[] = []

    const mockServiceName = 'test-telemetry-service'
    const mockServiceVersion = '1.0.0'

    beforeEach(async () => {
        receivedRequests = []

        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', chunk => {
                body += chunk.toString()
            })

            req.on('end', () => {
                receivedRequests.push({
                    path: req.url || '',
                    method: req.method || '',
                    headers: req.headers,
                    body: JSON.parse(body),
                })

                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ status: 'success' }))
            })
        })

        await new Promise<void>(resolve => {
            server.listen(0, () => resolve())
        })

        const address = server.address() as AddressInfo
        serverUrl = `http://localhost:${address.port}`

        // @ts-ignore
        OperationalTelemetryService.instance = undefined
    })

    afterEach(async () => {
        const instance = OperationalTelemetryService['instance']
        if (instance) {
            // @ts-ignore
            await instance.shutdownApi()
        }

        await promisify(server.close.bind(server))()
    })

    function makeMetricsRequestDeterministic(jsonStr: string): string {
        return jsonStr
            .replace(/"(startTimeUnixNano|timeUnixNano)":"[0-9]+"/g, '"$1":"1746710710801000000"')
            .replace(
                /"key":"sessionId","value":{"stringValue":"[^"]+"/g,
                '"key":"sessionId","value":{"stringValue":"80fd44e9-55e5-4b80-a08a-4f2bcaf2e1b9"'
            )
    }

    function makeLogsRequestDeterministic(jsonStr: string): string {
        return jsonStr
            .replace(/"(timeUnixNano|observedTimeUnixNano)":"[0-9]+"/g, '"$1":"1746710710801000000"')
            .replace(
                /"key":"sessionId","value":{"stringValue":"[^"]+"}}/g,
                '"key":"sessionId","value":{"stringValue":"80fd44e9-55e5-4b80-a08a-4f2bcaf2e1b9"}}'
            )
    }

    function getOperationalTelemetryConfig() {
        return {
            serviceName: mockServiceName,
            serviceVersion: mockServiceVersion,
            lspConsole: {
                debug: () => {},
                error: () => {},
                info: () => {},
                log: () => {},
                warn: () => {},
            } as any,
            endpoint: serverUrl,
            telemetryOptOut: false,
            extendedClientInfo: {
                name: 'test-client',
                version: '1.0.0',
                clientId: 'test-client-id',
                extension: {
                    name: 'test-extension',
                    version: '1.0.0',
                },
            },
            exportIntervalMillis: 500,
            scheduledDelayMillis: 500,
        }
    }

    async function waitForRequests(count = 1, timeoutMs = 5000): Promise<void> {
        const startTime = Date.now()
        while (receivedRequests.length < count) {
            if (Date.now() - startTime > timeoutMs) {
                throw new Error(`Timed out waiting for ${count} requests. Received ${receivedRequests.length}`)
            }
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    it('should send metrics to the configured endpoint', async function () {
        this.timeout(10000)

        const telemetryService = OperationalTelemetryService.getInstance(getOperationalTelemetryConfig())
        telemetryService.registerGaugeProvider('heapUsed', () => 12345, 'byte')

        await waitForRequests(1, 5000)
        assert(receivedRequests.length > 0, 'Should have received at least one request')
        const request = receivedRequests[0]
        assert(request.method === 'POST', 'Request should use POST method')

        const requestBodyStr = JSON.stringify(request.body)
        const normalizedBody = makeMetricsRequestDeterministic(requestBodyStr)
        assert.deepStrictEqual(JSON.parse(normalizedBody), resourceMetrics)
    })

    it('should send logs to the configured endpoint', async function () {
        this.timeout(10000)

        const telemetryService = OperationalTelemetryService.getInstance(getOperationalTelemetryConfig())

        telemetryService.emitEvent({
            errorName: 'TestError',
            errorOrigin: 'caughtError' as const,
            errorType: 'Error',
        })

        await waitForRequests(1, 5000)

        assert(receivedRequests.length > 0, 'Should have received at least one request')
        const request = receivedRequests[0]
        assert(request.method === 'POST', 'Request should use POST method')
        const requestBodyStr = JSON.stringify(request.body)

        const normalizedBody = makeLogsRequestDeterministic(requestBodyStr)

        assert.deepStrictEqual(JSON.parse(normalizedBody), resourceLogs)
    })

    it('should register and send multiple metrics', async function () {
        this.timeout(10000)

        const telemetryService = OperationalTelemetryService.getInstance(getOperationalTelemetryConfig())

        telemetryService.registerGaugeProvider('heapUsed', () => 12345)
        telemetryService.registerGaugeProvider('heapTotal', () => 67890)
        telemetryService.registerGaugeProvider('rss', () => 54321)

        await waitForRequests(1, 5000)
        assert(receivedRequests.length > 0, 'Should have received at least one request')
        const requestBodyStr = JSON.stringify(receivedRequests[0].body)
        assert(requestBodyStr.includes('heapUsed'), 'Request should include heapUsed metric')
        assert(requestBodyStr.includes('heapTotal'), 'Request should include heapTotal metric')
        assert(requestBodyStr.includes('rss'), 'Request should include rss metric')
    })

    it('should not initialize providers when opted out', async function () {
        OperationalTelemetryService.getInstance({
            ...getOperationalTelemetryConfig(),
            telemetryOptOut: true,
        })

        assert(
            //@ts-ignore
            OperationalTelemetryService.instance.loggerProvider === null,
            'Logger provider should not be initialized'
        )
        //@ts-ignore
        assert(OperationalTelemetryService.instance.meterProvider === null, 'Meter provider should not be initialized')
    })

    it('should not send telemetry when opted out', async function () {
        this.timeout(10000)

        const telemetryService = OperationalTelemetryService.getInstance({
            ...getOperationalTelemetryConfig(),
            telemetryOptOut: true,
        })

        telemetryService.registerGaugeProvider('heapTotal', () => 12345)
        telemetryService.emitEvent({
            errorName: 'OptOutTest',
            errorOrigin: 'other' as const,
            errorType: 'Test',
        })

        await new Promise(resolve => setTimeout(resolve, 2000))
        assert.strictEqual(receivedRequests.length, 0, 'Should not receive any requests when opted out')

        telemetryService.toggleOptOut(false)
        telemetryService.emitEvent({
            errorName: 'OptInTest',
            errorOrigin: 'other' as const,
            errorType: 'Test',
        })

        await waitForRequests(1, 5000)
        assert(receivedRequests.length > 0, 'Should receive requests after opting in')
        const requestBodyStr = JSON.stringify(receivedRequests[0].body)
        assert(!requestBodyStr.includes('OptOutTest'))
        assert(!requestBodyStr.includes('heapTotal'))
        assert(requestBodyStr.includes('OptInTest'))
    })

    it('should return the same instance when getInstance is called multiple times', () => {
        const instance1 = OperationalTelemetryService.getInstance(getOperationalTelemetryConfig())
        const instance2 = OperationalTelemetryService.getInstance(getOperationalTelemetryConfig())

        assert.strictEqual(instance1, instance2)
    })
})
