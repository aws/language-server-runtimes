function func(value: any): value is (...args: any[]) => any {
    return typeof value === 'function'
}

function thenable<T>(value: any): value is Thenable<T> {
    return value && func(value.then)
}

export function asPromise<T>(value: Promise<T>): Promise<T>
export function asPromise<T>(value: Thenable<T>): Promise<T>
export function asPromise<T>(value: T): Promise<T>
export function asPromise(value: any): Promise<any> {
    if (value instanceof Promise) {
        return value
    } else if (thenable(value)) {
        return new Promise((resolve, reject) => {
            value.then(
                resolved => resolve(resolved),
                error => reject(error)
            )
        })
    } else {
        return Promise.resolve(value)
    }
}

export function mergeObjects(obj1: any, obj2: any) {
    let merged: any = {}

    for (const key in obj1) {
        if (Object.prototype.hasOwnProperty.call(obj1, key)) {
            if (Array.isArray(obj1) && Array.isArray(obj2)) {
                merged = [...new Set([...obj1, ...obj2])]
            } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                merged[key] = mergeObjects(obj1[key], obj2[key])
            } else {
                merged[key] = obj1[key]
                if (Object.prototype.hasOwnProperty.call(obj2, key)) {
                    merged[key] = obj2[key]
                }
            }
        }
    }

    for (const key in obj2) {
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            continue
        } else if (
            Object.prototype.hasOwnProperty.call(obj2, key) &&
            !Object.prototype.hasOwnProperty.call(obj1, key)
        ) {
            merged[key] = obj2[key]
        }
    }
    return merged
}

export function findDuplicates<T>(array: T[]): T[] | undefined {
    const seen = new Set<T>()
    const dups = array
        .filter(a => a !== undefined)
        .filter(function (a) {
            if (seen.has(a)) {
                return true
            }
            seen.add(a)
            return false
        })
    return dups.length > 0 ? dups : undefined
}
