export interface Encoding {
    decode(value: string): string
    encode(value: string): string
}

export class WebBase64Encoding implements Encoding {
    constructor(private window: WindowOrWorkerGlobalScope) {}

    decode(value: string): string {
        if (!value) {
            return value
        }
        const decoded = this.window.atob(value)
        // to support Unicode chars
        return decodeURIComponent(
            Array.from(decoded)
                .map(char => {
                    return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2)
                })
                .join('')
        )
    }

    encode(value: string): string {
        if (!value) {
            return value
        }
        // to support Unicode chars
        const converted = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, arg) => {
            return String.fromCharCode(parseInt(arg, 16))
        })
        return this.window.btoa(converted)
    }
}
