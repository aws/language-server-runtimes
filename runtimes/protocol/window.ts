import {
    ProtocolRequestType,
    SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD,
    ShowSaveFileDialogParams,
    ShowSaveFileDialogResult,
} from './lsp'

export const ShowSaveFileDialogRequestType = new ProtocolRequestType<
    ShowSaveFileDialogParams,
    ShowSaveFileDialogResult,
    never,
    void,
    void
>(SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD)
