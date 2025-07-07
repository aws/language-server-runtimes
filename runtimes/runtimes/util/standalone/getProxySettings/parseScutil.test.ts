/*
 * Based on mac-system-proxy 1.0.2 (Apache-2.0).
 * https://github.com/httptoolkit/mac-system-proxy/blob/main/test/parse-scutil.spec.ts
 */
import * as assert from 'assert'
import { parseScutilOutput } from './parseScutil'

describe('parseScutilOutput', () => {
    it('should parse totally blank scutil output', () => {
        const parsed = parseScutilOutput('')
        assert.deepStrictEqual(parsed, {})
    })

    it('should parse an empty proxy configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
}
`
        )
        assert.deepStrictEqual(parsed, {})
    })

    it('should parse a disabled proxy configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    HTTPEnable : 0
    HTTPSEnable : 0
}
`
        )
        assert.deepStrictEqual(parsed, {
            HTTPEnable: '0',
            HTTPSEnable: '0',
        })
    })

    it('should parse an empty proxy configuration with an exceptions array', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExceptionsList : <array> {
        0 : localhost
        1 : 127.0.0.1
    }
    ExcludeSimpleHostnames : 1
    HTTPEnable : 0
    HTTPSEnable : 0
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExceptionsList: ['localhost', '127.0.0.1'],
            ExcludeSimpleHostnames: '1',
            HTTPEnable: '0',
            HTTPSEnable: '0',
        })
    })

    it('should parse an empty proxy configuration with blank auth details', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    HTTPEnable : 0
    HTTPSEnable : 0
    HTTPSUser :${' '}
    HTTPUser :${' '}
}
`
        )
        assert.deepStrictEqual(parsed, {
            HTTPEnable: '0',
            HTTPSEnable: '0',
            HTTPSUser: '',
            HTTPUser: '',
        })
    })

    it('should parse an HTTP and HTTPS proxy configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExcludeSimpleHostnames : 1
    HTTPEnable : 1
    HTTPPort : 8000
    HTTPProxy : 127.0.0.1
    HTTPSEnable : 1
    HTTPSPort : 8443
    HTTPSProxy : 127.0.0.1
    HTTPSUser : domain\\user
    SOCKSEnable : 0
    SOCKSUser : user
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExcludeSimpleHostnames: '1',
            HTTPEnable: '1',
            HTTPPort: '8000',
            HTTPProxy: '127.0.0.1',
            HTTPSEnable: '1',
            HTTPSPort: '8443',
            HTTPSProxy: '127.0.0.1',
            HTTPSUser: 'domain\\user',
            SOCKSEnable: '0',
            SOCKSUser: 'user',
        })
    })

    it('should parse values containing commas', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExceptionsList : <array> {
        0 : *.local, 169.254/16
    }
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExceptionsList: ['*.local, 169.254/16'],
        })
    })

    it('should parse an WPAD PAC proxy configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExceptionsList : <array> {
        0 : localhost
        1 : 127.0.0.1
    }
    ExcludeSimpleHostnames : 1
    HTTPEnable : 0
    HTTPSEnable : 0
    ProxyAutoConfigEnable : 1
    ProxyAutoConfigURLString : http://wpad/wpad.dat
    ProxyAutoDiscoveryEnable : 1
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExceptionsList: ['localhost', '127.0.0.1'],
            ExcludeSimpleHostnames: '1',
            HTTPEnable: '0',
            HTTPSEnable: '0',
            ProxyAutoConfigEnable: '1',
            ProxyAutoConfigURLString: 'http://wpad/wpad.dat',
            ProxyAutoDiscoveryEnable: '1',
        })
    })

    it('should parse a SOCKS proxy configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExcludeSimpleHostnames : 1
    HTTPEnable : 0
    HTTPSEnable : 0
    SOCKSEnable : 1
    SOCKSPort : 2020
    SOCKSProxy : 127.0.0.1
    SOCKSUser : user
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExcludeSimpleHostnames: '1',
            HTTPEnable: '0',
            HTTPSEnable: '0',
            SOCKSEnable: '1',
            SOCKSPort: '2020',
            SOCKSProxy: '127.0.0.1',
            SOCKSUser: 'user',
        })
    })

    it('should parse an explicit PAC configuration', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    ExcludeSimpleHostnames : 1
    HTTPEnable : 0
    HTTPSEnable : 0
    ProxyAutoConfigEnable : 1
    ProxyAutoConfigURLString : http://example.com/proxy.pac
}
`
        )
        assert.deepStrictEqual(parsed, {
            ExcludeSimpleHostnames: '1',
            HTTPEnable: '0',
            HTTPSEnable: '0',
            ProxyAutoConfigEnable: '1',
            ProxyAutoConfigURLString: 'http://example.com/proxy.pac',
        })
    })

    it('should parse a complex made-up output structure', () => {
        const parsed = parseScutilOutput(
            `<dictionary> {
    InitialValue : :value:
    FirstArray : <array> {
    }
    SecondArray : <array> {
        0 : .
    }
    ThirdArray : <array> {
        0 : <dictionary> {
            inner-value : special{value}
        }
    }
    Value : <dictionary> {
        a : b
        c : d
    }
}
`
        )
        assert.deepStrictEqual(parsed, {
            InitialValue: ':value:',
            FirstArray: [],
            SecondArray: ['.'],
            ThirdArray: [{ 'inner-value': 'special{value}' }],
            Value: {
                a: 'b',
                c: 'd',
            },
        })
    })

    it('should clearly error given invalid input', () => {
        assert.throws(() => parseScutilOutput('{'), /Unexpected scutil proxy output format/)
    })

    it('should clearly error given incomplete value', () => {
        assert.throws(
            () =>
                parseScutilOutput(
                    `<dictionary> {
    IncompleteValue :
}
`
                ),
            /Unexpected scutil proxy output format/
        )
    })

    it('should handle corrupted local user file data', () => {
        assert.throws(() => parseScutilOutput('corrupted\x00\x01data'), /Unexpected scutil proxy output format/)
    })
})
