export interface Company {
  companyCode1?: string | null;
  companyCode2?: string;
  companyType?: string;
  companyName?: string | null;
  companyNameEn?: string;
  companyShortName?: string;
  groupCode?: string;
  region?: string;
  country?: string;
  registUser?: string;
  registDate?: string;
  updateUser?: string;
  lastUpdate?: string;
}

export interface TransformedCompany {
  '会社コード1'?: string | null;
  '会社コード2'?: string;
  '会社種別'?: string;
  '会社名'?: string | null;
  '会社名英語'?: string;
  '会社略称'?: string;
  'グループコード'?: string;
  '地域'?: string;
  '国'?: string;
  '登録者'?: string;
  '登録日時'?: string;
  '更新者'?: string;
  '最終更新日時'?: string;
}

export interface CompanyRoleOps {
  companyCode1: string;
  companyCode2: string;
  roleCode: string;
  opsEmail: string;
  opsUrl: string;
  opsEmailUrl: string;
  opsVulnerability: string;
  opsInfo: string;
  registUser: string;
  registDate: string;
  updateUser: string;
  lastUpdate: string;
}

export interface TransformedCompanyRoleOps {
  '会社コード1': string;
  '会社コード2': string;
  '役割コード': string;
  'メールオプション': string;
  'URLオプション': string;
  'メール・URLオプション': string;
  '脆弱性オプション': string;
  '情報オプション': string;
  '登録者': string;
  '登録日時': string;
  '更新者': string;
  '最終更新日時': string;
}

export interface CompanyPermission {
  ownCompanyCode1: string;
  ownCompanyCode2: string;
  viewCompanyCode1: string;
  viewCompanyCode2: string;
  applicantCompanyCode1: string;
  applicantCompanyCode2: string;
  registUser: string;
  registDate: string;
  updateUser: string;
  lastUpdate: string;
}

export interface TransformedCompanyPermission {
  '自社コード1': string;
  '自社コード2': string;
  '閲覧会社コード1': string;
  '閲覧会社コード2': string;
  '申請会社コード1': string;
  '申請会社コード2': string;
  '登録者': string;
  '登録日時': string;
  '更新者': string;
  '最終更新日時': string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}