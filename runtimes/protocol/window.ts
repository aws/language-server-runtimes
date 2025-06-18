import {
    ProtocolRequestType,
    SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD,
    ShowSaveFileDialogParams,
    ShowSaveFileDialogResult,
    ShowOpenDialogResult,
    ShowOpenDialogParams,
    SHOW_OPEN_FILE_DIALOG_REQUEST_METHOD,
} from './lsp'

/**
 * The show message notification is sent from a server to a client to ask the client to display "Save File" dialog.
 * Server may indicate list of filetypes and default save path to show in the dialog.
 */
export const ShowSaveFileDialogRequestType = new ProtocolRequestType<
    ShowSaveFileDialogParams,
    ShowSaveFileDialogResult,
    never,
    void,
    void
>(SHOW_SAVE_FILE_DIALOG_REQUEST_METHOD)

export const ShowOpenDialogRequestType = new ProtocolRequestType<
    ShowOpenDialogParams,
    ShowOpenDialogResult,
    never,
    void,
    void
>(SHOW_OPEN_FILE_DIALOG_REQUEST_METHOD)
