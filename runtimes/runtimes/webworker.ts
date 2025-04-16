import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageserver/browser'

import { baseRuntime } from './base-runtime'

declare const self: WindowOrWorkerGlobalScope

export const webworker = baseRuntime({ reader: new BrowserMessageReader(self), writer: new BrowserMessageWriter(self) })
