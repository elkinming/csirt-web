export interface TableRow {
  id: number;
  companyCode1?: string | null;
  companyCode2?: string;
  companyType?: string;
  companyName?: string | null;
  companyNameEn?: string;
  companyShortName?: string;
  groupCode?: string;
  region?: string;
  country?: string;
  roleCode: number;
  opsEmail: string;
  opsUrl: string;
  opsEmailUrl: string;
  opsVulnerability: string;
  opsInfo: string;
  deptName: string;
  location: string;
  position: string;
  personName: string;
  personCode: string;
  email: string;
  emergencyContact: string;
  language: string;
  isMainRecord: boolean;
  childrenNumber: number;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  message: string;
}

export enum FilterType {
  Contains = 1,
  ExactMatch = 2,
  NotContains = 3
}

export enum LogicCondition {
  And = 1,
  Or = 2
}

export interface FilterContent {
  filterType1: FilterType;
  filterType2: FilterType;
  filterType3: FilterType;

  filterData1: string;
  filterData2: string;
  filterData3: string;

  logicCondition1: LogicCondition;
  logicCondition2: LogicCondition;
}

export interface InformationSecuritySearchDto {
  companyCode1?: FilterContent;
  companyCode2?: FilterContent;
  companyType?: FilterContent;
  companyName?: FilterContent;
  companyNameEn?: FilterContent;
  companyShortName?: FilterContent;
  groupCode?: FilterContent;
  region?: FilterContent;
  country?: FilterContent;
}

export interface ColumnFilterState {
  visible: boolean;
  active: boolean;
  data: FilterContent;
}

export type ColumnKey =
  | 'companyCode1'
  | 'companyCode2'
  | 'companyType'
  | 'companyName'
  | 'companyNameEn'
  | 'companyShortName'
  | 'groupCode'
  | 'region'
  | 'country';

export interface TableColumn {
  key: ColumnKey;
  name: string;
  width: string;
}