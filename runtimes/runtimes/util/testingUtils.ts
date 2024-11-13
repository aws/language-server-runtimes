import sinon from 'sinon'

export function createStubFromInterface<T>(): sinon.SinonStubbedInstance<T> & T {
    const stub = {} as sinon.SinonStubbedInstance<T> & T
    return new Proxy(stub, {
        get: (target, property) => {
            if (property in target) {
                return target[property as keyof typeof target]
            }
            const method = sinon.stub()
            ;(target as any)[property] = method
            return method
        },
    })
}
