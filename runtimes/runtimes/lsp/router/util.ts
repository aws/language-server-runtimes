function func(value: any): value is Function {
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
    const merged: any = {}

    for (let key in obj1) {
        if (obj1.hasOwnProperty(key)) {
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
                merged[key] = mergeObjects(obj1[key], obj2[key])
            } else {
                merged[key] = obj1[key]
                if (obj2.hasOwnProperty(key)) {
                    merged[key] = obj2[key]
                }
            }
        }
    }

    for (let key in obj2) {
        if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
            merged[key] = obj2[key]
        }
    }
    return merged
}
