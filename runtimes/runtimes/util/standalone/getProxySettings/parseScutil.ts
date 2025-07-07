/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Based on mac-system-proxy 1.0.2 (Apache-2.0).
 * https://github.com/httptoolkit/mac-system-proxy/blob/main/src/parse-scutil.ts
 */
const TYPE_KEY = '__scutil__type__'

// Quick hacky parser, which translates output into valid JSON:
export function parseScutilOutput(output: string): {} {
    try {
        // Unclear how this happens, but it seems that it can in some cases:
        if (output === '') return {}

        const unquotedJsonString = output
            // Reduce type markers to just an inline __scutil__type__ marker on array objects:
            .replace(/<dictionary> /g, '')
            .replace(/<array> {/g, `{\n${TYPE_KEY} : array`)
            .trim()

        // Turn unquoted key/value string into a string of quote key values (but with no commas).
        // We effectively parse by splitting on the first " : " in each line, if present.
        const jsonKeyValues = unquotedJsonString.split('\n').map(line => {
            const [key, value] = line.split(/ : (.*)/)

            if (value === undefined) return key.trim()
            else if (value === '{') return `"${key.trim()}": {`
            else return `"${key.trim()}": ${JSON.stringify(value.trim())}`
        })

        // Insert commas everywhere they're needed
        const jsonFormattedString = jsonKeyValues.reduce((jsonString, nextValue) => {
            if (!jsonString || jsonString.endsWith('{') || nextValue === '}') {
                // JSON has no commas after/before object {} tokens or
                // at the very start of the string:
                return jsonString + nextValue
            } else {
                return jsonString + ', ' + nextValue
            }
        }, '')

        const data = JSON.parse(jsonFormattedString, (key, value) => {
            // Convert array-tagged objects back into arrays:
            if (value[TYPE_KEY] === 'array') {
                delete value[TYPE_KEY]
                return Object.values(value)
            } else {
                return value
            }
        })

        return data
    } catch (e) {
        throw Object.assign(
            new Error('Unexpected scutil proxy output format'),
            { scutilOutput: output } // Attach output for debugging elsewhere
        )
    }
}
