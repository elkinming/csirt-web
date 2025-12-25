import { LogInfo, TransformedLogInfo } from "./log-search.models";

export function transformLogInfoData(logInfoRecords: LogInfo[]): TransformedLogInfo[] {
  return logInfoRecords.map(logInfo  => ({
    '氏名コード': logInfo.userCode,
    '日付': logInfo.logDate,
    '画面名': logInfo.viewName,
    '操作': logInfo.operation
  }));
}