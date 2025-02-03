import { Service } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { Client, MetadataBearer, HttpHandlerOptions } from '@aws-sdk/types'
import { SmithyResolvedConfiguration } from '@aws-sdk/smithy-client'

// aws sdk v2 clients constructor type
export type SDKClientConstructorV2<T, P extends ServiceConfigurationOptions> = new (config?: P) => T
// aws sdk v3 clients constructor type
export type SDKClientConstructorV3<T, P> = new (...[configuration]: [P] | []) => T

// a generic type for all aws sdk v3 clients.
export type SDKClientV3 = Client<object, MetadataBearer, SmithyResolvedConfiguration<HttpHandlerOptions>>

export type SDKRuntimeConfigurator = {
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
     *
     * @example
     * // Example usage:
     * const mySdkV2Client = sdkRuntimeConfigurator.v2(MySdkV2Client, {
     *   region: 'example_region',
     *   endpoint: 'example_endpoint',
     * });
     */
    v2: <T extends Service, P extends ServiceConfigurationOptions>(
        Ctor: SDKClientConstructorV2<T, P>,
        current_config: P
    ) => T
    /**
     * Creates an instance of the SDK v3 client whose constructor is given as input parameter.
     *
     * @template T - Type parameter extending SDKClientV3 base type
     * @template P - Type parameter for the configurations options
     *
     * @param {SDKClientConstructorV2<T, P>} Ctor - The constructor function for creating the aws sdk v3 client
     * @param {P} current_config - The initial configuration options for the client
     *
     * @returns {T} An instance of the input sdk v3 client
     *
     * @example
     * // Example usage:
     * const mySdkV3Client = sdkRuntimeConfigurator.v3(
     *   MySdkV3Client as any,
     *   {
     *       region: 'example_region',
     *       endpoint: 'example_endpoint',
     *   }) as MySdkV3Client;
     */
    v3: <T extends SDKClientV3, P>(Ctor: SDKClientConstructorV3<T, P>, current_config: P) => T
}
