import { TableRow } from "./org-list-v3.models";

const detailedInfo = [
  {
    roleCode: '1_最高責任者',
    opsEmail: 'X',
    opsUrl: '日',
    opsEmailUrl: '日',
    opsVulnerability: '日',
    opsInfo: '日',
    deptName: 'Manufacturing Engineering',
    location: 'Head Office',
    position: '副部長',
    personName: '氏名1',
    personCode: '9000001',
    email: '9000001@mail.com',
    emergencyContact: 'xxx-xxxx-xxxx',
    language: 'Japanese	',
  },
  {
    roleCode: '2_運用管理責任者',
    opsEmail: '日',
    opsUrl: '日',
    opsEmailUrl: '日',
    opsVulnerability: '日',
    opsInfo: '日',
    deptName: 'President',
    location: 'Head Office',
    position: '総経理',
    personName: '氏名2',
    personCode: '9000002',
    email: '9000002@mail.com',
    emergencyContact: 'xxx-xxxx-xxxx',
    language: 'Chinese	',
  },
  {
    roleCode: '3_運用管理担当者',
    opsEmail: '中日',
    opsUrl: '中日',
    opsEmailUrl: '中日',
    opsVulnerability: '中日',
    opsInfo: '中日',
    deptName: 'President',
    location: 'Head Office',
    position: 'Ms',
    personName: '氏名3',
    personCode: '9000003',
    email: '9000003@mail.com',
    emergencyContact: 'xxx-xxxx-xxxx',
    language: 'Japanese/Chinese',
  },
  {
    roleCode: '4_CSIRT（正）',
    opsEmail: '英日',
    opsUrl: '英日',
    opsEmailUrl: '英日',
    opsVulnerability: '英日',
    opsInfo: '英日',
    deptName: 'Staff',
    location: 'Headquarters in Sop…',
    position: 'President',
    personName: '氏名4',
    personCode: '9000004',
    email: '9000004@mail.com',
    emergencyContact: 'xxx-xxxx-xxxx',
    language: 'Japanese/English',
  },
  {
    roleCode: '5_CSIRT（副）',
    opsEmail: '×',
    opsUrl: '中日',
    opsEmailUrl: '中日',
    opsVulnerability: '中日',
    opsInfo: '×',
    deptName: 'France Headquarters',
    location: 'Head Office',
    position: 'Mr',
    personName: '氏名5',
    personCode: '9000005',
    email: '9000005@mail.com',
    emergencyContact: 'xxx-xxxx-xxxx',
    language: 'Japanese',
  }
]

export const generateMockData = (desiredNumber: number) => {

  const mockData: TableRow[] = [];

  for (let i = 0; i < desiredNumber; i++) {
    const baseData: any = {
      id: i,
      companyCode1: 'Z10' + i,
      companyCode2: 'S3620' + i,
      companyType: 'AI国内子会社 '+ i,
      companyName: '光南工業株式会社 '+ i,
      companyNameEn: 'KONAN KOGYO CO.,LTD. '+ i,
      companyShortName: '光南 ' + i,
      groupCode: '01_AI ' + i,
      region: 'アジア ' + i,
      country: '日本 ' + i,
      isMainRecord: true,
      childrenNumber: 5
    }
    const mockElement = {
      ...baseData,
      ...detailedInfo[0]
    }
    mockData.push(mockElement);
    for (let j = 1; j < detailedInfo.length; j++) {
      const element = detailedInfo[j];
      const mockElement = {
        id: j,
        isMainRecord: false,
        childrenNumber: 5,
        ...element
      }
      mockData.push(mockElement);
    }
    
  }
  
  return mockData

}

