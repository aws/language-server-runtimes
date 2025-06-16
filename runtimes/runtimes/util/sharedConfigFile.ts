/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * The implementation is inspired by https://github.com/aws/aws-toolkit-vscode/blob/2c8d6667ec45f747db25f456a524e50242ff454b/packages/core/src/auth/credentials/sharedCredentialsFile.ts#L44
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export function checkAWSConfigFile(): boolean {
    const awsConfigFile = process.env.AWS_CONFIG_FILE
    if (awsConfigFile) {
        return fs.existsSync(awsConfigFile)
    } else {
        const homedir = os.homedir()
        const defaultConfigPath = path.join(homedir, '.aws', 'config')
        return fs.existsSync(defaultConfigPath)
    }
}
