import { InitializeParams } from '../../protocol'
import { LspRouter } from '../lsp/router/lspRouter'

export const getClientInitializeParamsHandlerFactory = (lspRouter: LspRouter): (() => InitializeParams | undefined) => {
    return () => lspRouter.clientInitializeParams
}
