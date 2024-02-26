import {
  ExecuteCommandParams,
  ExecuteCommandRegistrationOptions,
  ProtocolRequestType,
} from "vscode-languageserver";

export type SecurityScanStatus = "Succeeded" | "Failed" | "InProgress";
export interface SecurityScanResult {
  status: SecurityScanStatus;
  securityScanFindings?: string;
}
export interface SecurityScanRequestParams extends ExecuteCommandParams {}
export interface SecurityScanResponseParams {
  result: SecurityScanResult;
  error?: string;
}

// Todo: update when executeCommand PR mereges
export const SecurityScanRequestType = new ProtocolRequestType<
  SecurityScanRequestParams,
  SecurityScanResponseParams,
  any,
  void,
  ExecuteCommandRegistrationOptions
>("aws/codewhisperer/runSecurityScan");



