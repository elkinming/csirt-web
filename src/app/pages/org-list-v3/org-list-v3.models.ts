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
  roleCode: string;
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