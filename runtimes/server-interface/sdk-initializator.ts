// aws sdk v3 clients constructor type
export type SDKClientConstructorV3<T, P> = new (...[configuration]: [P] | []) => T

/**
 * SDKInitializator type initializes AWS SDK v3 clients whose constructor and initial configurations are passed as input.
 * This type serves as a client factory that wraps SDK client constructors, and instantiates them at runtime, allowing additional runtime/environment-specific
 * configurations (e.g. proxy settings) to be injected at runtime.
 *
 * @template T - Type parameter for the aws sdk v3 client
 * @template P - Type parameter for the configurations options
 *
 * @example
 * const v3Client = sdkInitializator(MySdkV3Client, {
 *     region: 'example_region',
 *     endpoint: 'example_endpoint'
 * });
 */
export type SDKInitializator = <T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P) => T
