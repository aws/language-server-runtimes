import { Service } from 'aws-sdk2-types'
import { ServiceConfigurationOptions } from 'aws-sdk2-types/lib/service'

// aws sdk v2 clients constructor type
export type SDKClientConstructorV2<T, P extends ServiceConfigurationOptions> = new (config?: P) => T
// aws sdk v3 clients constructor type
export type SDKClientConstructorV3<T, P> = new (...[configuration]: [P] | []) => T

/**
 * SDKInitializator type initializes AWS SDK clients whose constructor and initial configurations are passed as input.
 * This type serves as a client factory that wraps SDK client constructors, and instantiates them at runtime, allowing additional runtime/environment-specific
 * configurations (e.g. proxy settings) to be injected at runtime. It provides a unified interface
 * for instantiating both AWS SDK v2 and v3 clients, with v3 being the default implementation.
 *
 * @template T - Type parameter for the aws sdk client (v2 or v3)
 * @template P - Type parameter for the configurations options
 *
 * @example
 * // V3 usage (default)
 * const v3Client = sdkInitializator(MySdkV3Client, {
 *     region: 'example_region',
 *     endpoint: 'example_endpoint'
 * });
 *
 * // V2 usage (through .v2 property)
 * const v2Client = sdkInitializator.v2(MySdkV2Client, {
 *     region: 'example_region',
 *     endpoint: 'example_endpoint'
 * });
 */
export type SDKInitializator = {
    /**
     * Creates an instance of the SDK v2 client whose constructor is given as input parameter.
     *
     * @template T - Type parameter extending Service base type
     * @template P - Type parameter extending ServiceConfigurationOptions
     *
     * @param {SDKClientConstructorV2<T, P>} Ctor - The constructor function for creating the aws sdk v2 client
     * @param {P} current_config - The initial configuration options for the client
     *
     * @returns {T} An instance of the input sdk v2 client
     */
    v2: <T extends Service, P extends ServiceConfigurationOptions>(
        Ctor: SDKClientConstructorV2<T, P>,
        current_config: P
    ) => T
} /**
 * Creates an instance of the SDK v3 client whose constructor is given as input parameter.
 * This is the default behavior when calling the configurator directly.
 *
 * @template T - Type parameter for the aws sdk v3 client
 * @template P - Type parameter for the configurations options
 *
 * @param {SDKClientConstructorV3<T, P>} Ctor - The constructor function for creating the aws sdk v3 client
 * @param {P} current_config - The initial configuration options for the client
 *
 * @returns {T} An instance of the input sdk v3 client
 */ & (<T, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P) => T)
