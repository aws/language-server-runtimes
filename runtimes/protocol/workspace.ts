import { ProtocolNotificationType, CursorStateChangeParams } from './lsp'

export const cursorStateChangeNotificationType = new ProtocolNotificationType<CursorStateChangeParams, void>(
    'aws/cursorStateChange'
)
