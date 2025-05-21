/**
 * Names of directories relevant to the crash reporting functionality.
 *
 * Moved here to resolve circular dependency issues.
 */
export const crashMonitoringDirName = 'crashMonitoring'

/** Matches Windows drive letter ("C:"). */
export const driveLetterRegex = /^[a-zA-Z]\:/

/**
 * Returns the identifier the given error.
 * Depending on the implementation, the identifier may exist on a
 * different property.
 */
export function getErrorId(error: Error): string {
    // prioritize code over the name
    return hasCode(error) ? error.code : error.name
}

/**
 * Derives an error message from the given error object.
 * Depending on the Error, the property used to derive the message can vary.
 *
 * @param withCause Append the message(s) from the cause chain, recursively.
 *                  The message(s) are delimited by ' | '. Eg: msg1 | causeMsg1 | causeMsg2
 */
export function getErrorMsg(err: Error | undefined, withCause: boolean = false): string | undefined {
    if (err === undefined) {
        return undefined
    }

    // Non-standard SDK fields added by the OIDC service, to conform to the OAuth spec
    // (https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1) :
    // - error: code per the OAuth spec
    // - error_description: improved error message provided by OIDC service. Prefer this to
    //   `message` if present.
    //   https://github.com/aws/aws-toolkit-jetbrains/commit/cc9ed87fa9391dd39ac05cbf99b4437112fa3d10
    // - error_uri: not provided by OIDC currently?
    //
    // Example:
    //
    //      [error] API response (oidc.us-east-1.amazonaws.com /token): {
    //        name: 'InvalidGrantException',
    //        '$fault': 'client',
    //        '$metadata': {
    //          httpStatusCode: 400,
    //          requestId: '7f5af448-5af7-45f2-8e47-5808deaea4ab',
    //          extendedRequestId: undefined,
    //          cfId: undefined
    //        },
    //        error: 'invalid_grant',
    //        error_description: 'Invalid refresh token provided',
    //        message: 'UnknownError'
    //      }
    const anyDesc = (err as any).error_description
    const errDesc = typeof anyDesc === 'string' ? anyDesc.trim() : ''
    let msg = errDesc !== '' ? errDesc : err.message?.trim()

    if (typeof msg !== 'string') {
        return undefined
    }

    // append the cause's message
    if (withCause) {
        const errorId = getErrorId(err)
        // - prepend id to message
        // - If a generic error does not have the `name` field explicitly set, it returns a generic 'Error' name. So skip since it is useless.
        if (errorId && errorId !== 'Error') {
            msg = `${errorId}: ${msg}`
        }

        const cause = (err as any).cause
        return `${msg}${cause ? ' | ' + getErrorMsg(cause, withCause) : ''}`
    }

    return msg
}

/**
 * Removes potential PII from a string, for logging/telemetry.
 *
 * Examples:
 * - "Failed to save c:/fooß/bar/baz.txt" => "Failed to save c:/xß/x/x.txt"
 * - "EPERM for dir c:/Users/user1/.aws/sso/cache/abc123.json" => "EPERM for dir c:/Users/x/.aws/sso/cache/x.json"
 */
function scrubNames(s: string, username?: string) {
    let r = ''
    const fileExtRe = /\.[^.\/]+$/
    const slashdot = /^[~.]*[\/\\]*/

    /** Allowlisted filepath segments. */
    const keep = new Set<string>([
        '~',
        '.',
        '..',
        '.aws',
        'aws',
        'sso',
        'cache',
        'credentials',
        'config',
        'Users',
        'users',
        'home',
        'tmp',
        'aws-toolkit-vscode',
        'globalStorage', // from vscode globalStorageUri
        crashMonitoringDirName,
    ])

    if (username && username.length > 2) {
        s = s.replaceAll(username, 'x')
    }

    // Replace contiguous whitespace with 1 space.
    s = s.replace(/\s+/g, ' ')

    // 1. split on whitespace.
    // 2. scrub words that match username or look like filepaths.
    const words = s.split(/\s+/)
    for (const word of words) {
        const pathSegments = word.split(/[\/\\]/)
        if (pathSegments.length < 2) {
            // Not a filepath.
            r += ' ' + word
            continue
        }

        // Replace all (non-allowlisted) ASCII filepath segments with "x".
        // "/foo/bar/aws/sso/" => "/x/x/aws/sso/"
        let scrubbed = ''
        // Get the frontmatter ("/", "../", "~/", or "./").
        const start = word.trimStart().match(slashdot)?.[0] ?? ''
        pathSegments[0] = pathSegments[0].trimStart().replace(slashdot, '')
        for (const seg of pathSegments) {
            if (driveLetterRegex.test(seg)) {
                scrubbed += seg
            } else if (keep.has(seg)) {
                scrubbed += '/' + seg
            } else {
                // Save the first non-ASCII (unicode) char, if any.
                const nonAscii = seg.match(/[^\p{ASCII}]/u)?.[0] ?? ''
                // Replace all chars (except [^…]) with "x" .
                const ascii = seg.replace(/[^$[\](){}:;'" ]+/g, 'x')
                scrubbed += `/${ascii}${nonAscii}`
            }
        }

        // includes leading '.', eg: '.json'
        const fileExt = pathSegments[pathSegments.length - 1].match(fileExtRe) ?? ''
        r += ` ${start.replace(/\\/g, '/')}${scrubbed.replace(/^[\/\\]+/, '')}${fileExt}`
    }

    return r.trim()
}

// Port of implementation in AWS Toolkit for VSCode
// https://github.com/aws/aws-toolkit-vscode/blob/c22efa03e73b241564c8051c35761eb8620edb83/packages/core/src/shared/errors.ts#L455
/**
 * Gets the (partial) error message detail for the `reasonDesc` field.
 *
 * @param err Error object, or message text
 */
export function getTelemetryReasonDesc(err: unknown | undefined): string | undefined {
    const m = typeof err === 'string' ? err : (getErrorMsg(err as Error, true) ?? '')
    const msg = scrubNames(m)

    // Truncate message as these strings can be very long.
    return msg && msg.length > 0 ? msg.substring(0, 350) : undefined
}

function hasCode<T>(error: T): error is T & { code: string } {
    return typeof (error as { code?: unknown }).code === 'string'
}
