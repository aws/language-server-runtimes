export interface Encoding {
    decode(value: string): string
    encode(value: string): string
}

const HEX_PAD: string = '00'
const HEX_REGEX: RegExp = /%([0-9A-F]{2})/g
export class WebBase64Encoding implements Encoding {
    constructor(private window: WindowOrWorkerGlobalScope) {}

    decode(value: string): string {
        const decoded = this.window.atob(value)
        // to support Unicode chars
        return decodeURIComponent(
            Array.from(decoded)
                .map(char => {
                    return '%' + (HEX_PAD + char.charCodeAt(0).toString(16)).slice(-2)
                })
                .join('')
        )
    }

    encode(value: string): string {
        // to support Unicode chars
        const converted = encodeURIComponent(value).replace(HEX_REGEX, (_, arg) => {
            return String.fromCharCode(parseInt(arg, 16))
        })
        return this.window.btoa(converted)
    }
}
