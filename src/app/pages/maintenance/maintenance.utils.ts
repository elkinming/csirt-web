import { Company, CompanyPermission, CompanyRoleOps, TransformedCompany, TransformedCompanyPermission, TransformedCompanyRoleOps } from "./maintenance.models";

export function transformCompanyData(companies: Company[]): TransformedCompany[] {
  return companies.map(company => ({
    '会社コード1': company.companyCode1,
    '会社コード2': company.companyCode2,
    '会社種別': company.companyType,
    '会社名': company.companyName,
    '会社名英語': company.companyNameEn,
    '会社略称': company.companyShortName,
    'グループコード': company.groupCode,
    '地域': company.region,
    '国': company.country,
    '登録者': company.registUser,
    '登録日時': company.registDate,
    '更新者': company.updateUser,
    '最終更新日時': company.lastUpdate
  }));
}

export function transformCompanyRoleOps(data: CompanyRoleOps[]): TransformedCompanyRoleOps[] {
  return data.map(item => ({
    '会社コード1': item.companyCode1,
    '会社コード2': item.companyCode2,
    '役割コード': item.roleCode,
    'メールオプション': item.opsEmail,
    'URLオプション': item.opsUrl,
    'メール・URLオプション': item.opsEmailUrl,
    '脆弱性オプション': item.opsVulnerability,
    '情報オプション': item.opsInfo,
    '登録者': item.registUser,
    '登録日時': item.registDate,
    '更新者': item.updateUser,
    '最終更新日時': item.lastUpdate
  }));
}

export function transformCompanyPermission(data: CompanyPermission[]): TransformedCompanyPermission[] {
  return data.map(item => ({
    '自社コード1': item.ownCompanyCode1,
    '自社コード2': item.ownCompanyCode2,
    '閲覧会社コード1': item.viewCompanyCode1,
    '閲覧会社コード2': item.viewCompanyCode2,
    '申請会社コード1': item.applicantCompanyCode1,
    '申請会社コード2': item.applicantCompanyCode2,
    '登録者': item.registUser,
    '登録日時': item.registDate,
    '更新者': item.updateUser,
    '最終更新日時': item.lastUpdate,
  }));
}

export function transformBackToOriginalFormat(data: any[]): any[] {
  return data.map(item => {
    return {
      companyCode1: item['会社コード1'],
      companyCode2: item['会社コード2'],
      companyType: item['会社種別'],
      companyName: item['会社名'],
      companyNameEn: item['会社名英語'],
      companyShortName: item['会社略称'],
      groupCode: item['グループコード'],
      region: item['地域'],
      country: item['国'],
      registUser: item['登録者'],
      registDate: item['登録日時'],
      updateUser: item['更新者'],
      lastUpdate: item['最終更新日時']
    };
  });
}