export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

export interface LogInfo {
  userCode: string;
  logDate: string;
  viewName: string;
  operation: string;
}

export interface TransformedLogInfo {
  '氏名コード': string;
  '日付': string;
  '画面名': string;
  '操作': string;
}


