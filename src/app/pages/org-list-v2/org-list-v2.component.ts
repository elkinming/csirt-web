import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  Theme,
  themeQuartz,
  GridApi,
  GridReadyEvent
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';


ModuleRegistry.registerModules([AllCommunityModule]);

// ag-Grid のテーマ（Quartz）
const myTheme = themeQuartz.withParams({
  spacing: 6,
  accentColor: 'blue',
});

/**
 * DBから取得する 1行=1役割 の明細データ型（例）
 * ※ 実際は API レスポンスに合わせて調整してください
 */
interface RawDbRow {
  COMPANY_CODE1: string;
  COMPANY_CODE2: string;
  COMPANY_TYPE: string;
  COMPANY_NAME: string;
  COMPANY_NAME_EN: string;
  COMPANY_SHORT_NAME: string;
  GROUP_CODE: string;
  REGION: string;
  COUNTRY: string;
  ROLE_CODE: string;
  OPS_EMAIL: string;
  OPS_URL: string;
  OPS_EMAIL_URL: string;
  OPS_VULNERABILITY: string;
  OPS_INFO: string;
  DEPT_NAME: string;
  LOCATION: string;
  POSITION: string;
  PERSON_NAME: string;
  PERSON_CODE: string;
  EMAIL: string;
  EMERGENCY_CONTACT: string;
  LANGUAGE: string;
}

/**
 * 画面（一覧）表示用：1行=1会社 の集約データ型
 * 各役割は「氏名(社員番号)」のように連結表示
 */
interface TableRow {
  id: number;
  companyCode1: string;
  companyCode2: string;
  companyType: string;
  companyName: string;
  companyNameEn: string;
  companyShortName: string;
  groupCode: string;
  region: string;
  country: string;
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
}

@Component({
  selector: 'app-org-list-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    NzCardModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
  ],
  templateUrl: './org-list-v2.component.html',
  styleUrls: ['./org-list-v2.component.less'],
})
export class OrgListComponentV2 implements OnInit, OnDestroy {
  /** 一覧の列定義 */
  columnDefs: ColDef[] = [];

  enableCellSpan = true;

  /** 一覧の共通列設定 */
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  /** ag-Grid Theme */
  theme: Theme | 'legacy' = myTheme;

  /** 一覧表示データ（1会社=1行） */
  rowData: TableRow[] = [];

  /** ag-Grid API（列幅調整等に使用） */
  private gridApi?: GridApi;

  /**
   * ✅ “仮DB”として保持する明細データ
   * 実システムでは API の結果をここに入れて扱うイメージ
   */
  private rawDbDataStore: RawDbRow[] = [];

  constructor(
    private msg: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    // 一覧の列定義（操作列・会社名は固定幅、残りは flex で均等）
    this.columnDefs = [
      {
        headerName: '操作',
        field: 'actions',
        width: 150,
        minWidth: 150,
        maxWidth: 150,
        // pinned: 'left',
        suppressSizeToFit: true,
        cellRenderer: this.actionCellRenderer,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
        spanRows: true,
      },
      {
        headerName: '会社コード1',
        field: 'companyCode1',
        width: 160,
        minWidth: 160,
        maxWidth: 160,
        // pinned: 'left',
        suppressSizeToFit: true,
        spanRows: true,
      },
      { headerName: '会社コード2', field: 'companyCode2', flex: 1, minWidth: 160, spanRows: true, },
      { headerName: '会社種別', field: 'companyType', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '会社名', field: 'companyName', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '会社名英語', field: 'companyNameEn', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '会社略称', field: 'companyShortName', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: 'グループコード', field: 'groupCode', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '地域', field: 'region', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '国', field: 'country', flex: 1, minWidth: 160, spanRows: true,  },
      { headerName: '役割コード', field: 'roleCode', flex: 1, minWidth: 160 },
      { headerName: 'メールオプション', field: 'opsEmail', flex: 1, minWidth: 160 },
      { headerName: 'URLオプション', field: 'opsUrl', flex: 1, minWidth: 160 },
      { headerName: 'メール・URLオプション', field: 'opsEmailUrl', flex: 1, minWidth: 160 },
      { headerName: '脆弱性オプション', field: 'opsVulnerability', flex: 1, minWidth: 160 },
      { headerName: '情報オプション', field: 'opsInfo', flex: 1, minWidth: 160 },
      { headerName: '部署名', field: 'deptName', flex: 1, minWidth: 160 },
      { headerName: '勤務地', field: 'location', flex: 1, minWidth: 160 },
      { headerName: '役職', field: 'position', flex: 1, minWidth: 160 },
      { headerName: '氏名', field: 'personName', flex: 1, minWidth: 160 },
      { headerName: '氏名コード', field: 'personCode', flex: 1, minWidth: 160 },
      { headerName: 'メールアドレス', field: 'email', flex: 1, minWidth: 160 },
      { headerName: '緊急連絡先', field: 'emergencyContact', flex: 1, minWidth: 160 },
      { headerName: '言語', field: 'language', flex: 1, minWidth: 160 },
    ];

    // ✅ 初期データ（仮）
    this.rawDbDataStore = generateMockData(5);

    // 一覧表示用 rowData を再計算
    this.refreshRowData();
  }

  /** grid 初期化時：列幅をウィンドウサイズに合わせて調整 */
  onGridReady(e: GridReadyEvent) {
    this.gridApi = e.api;
    this.gridApi.sizeColumnsToFit();
    window.addEventListener('resize', this.handleResize);
  }

  /** 初回描画後：列幅を再調整（モーダル/初期レイアウトでズレることがあるため） */
  onFirstDataRendered() {
    this.gridApi?.sizeColumnsToFit();
  }

  /** 画面リサイズ時：列幅を再調整 */
  private handleResize = () => this.gridApi?.sizeColumnsToFit();

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }

  /** 操作列のボタン（HTML） */
  actionCellRenderer(_params: any): string {
    return `
      <button class="ag-action-btn ag-edit-btn" data-action="edit" type="button">編集</button>
      <button class="ag-action-btn ag-delete-btn" data-action="delete" type="button">削除</button>
    `;
  }

  /**
   * 操作列クリックイベントを拾って「編集／削除」を実行する
   * ※ HTMLの data-action 属性で分岐
   */
  onCellClicked(event: any): void {
    if (event?.colDef?.field !== 'actions') return;

    const target = event?.event?.target as HTMLElement | null;
    if (!target) return;

    const action = target.getAttribute('data-action');
    // const row = event.data as OrgRow;

    if (action === 'edit') {
      // this.openEditModal(row);
      return;
    }

    if (action === 'delete') {
      // this.deleteCompany(row.companyName);
      return;
    }
  }


  /**
   * 「削除」：会社単位で削除（一覧が 1会社=1行 のため）
   * ※ 要件により「役割単位削除」へ変更も可能
   */
  private deleteCompany(companyName: string) {
    if (!confirm(`「${companyName}」を削除しますか？`)) return;

    // this.rawDbDataStore = this.rawDbDataStore.filter(r => r.companyName !== companyName);
    this.refreshRowData();
    this.msg.success('削除しました');
  }


  /** “仮DB”から一覧表示用 rowData を再生成 */
  private refreshRowData() {
    this.rowData = convertToOrgRows(this.rawDbDataStore);
    // 反映後に列幅を再調整
    setTimeout(() => this.gridApi?.sizeColumnsToFit());
  }
}

/** 文字列連結用：既に値がある場合は改行でつなげる */
function appendLine(base: string, value: string): string {
  if (!base) return value;
  return base + '\n' + value;
}

function convertToOrgRows(db: RawDbRow[]): TableRow[] {
  const tableRows: TableRow[] = [];
  let count = 0;
  db.forEach((row) => {
    tableRows.push({
      id: count,
      companyCode1: row.COMPANY_CODE1,
      companyCode2: row.COMPANY_CODE2,
      companyName: row.COMPANY_NAME,
      companyType: row.COMPANY_TYPE,
      groupCode: row.GROUP_CODE,
      region: row.REGION,
      country: row.COUNTRY,
      companyNameEn: row.COMPANY_NAME_EN,
      companyShortName: row.COMPANY_SHORT_NAME,
      roleCode: row.ROLE_CODE,
      opsEmail: row.OPS_EMAIL,
      opsUrl: row.OPS_URL,
      opsEmailUrl: row.OPS_EMAIL_URL,
      opsInfo: row.OPS_INFO,
      opsVulnerability: row.OPS_VULNERABILITY,
      deptName: row.DEPT_NAME,
      location: row.LOCATION,
      position: row.POSITION,
      personName: row.PERSON_NAME,
      personCode: row.PERSON_CODE,
      email: row.EMAIL,
      emergencyContact: row.EMERGENCY_CONTACT,
      language: row.LANGUAGE,
    })
    count++;
  });
  return tableRows;
}

/**
 * role（文字列）を roleCode / roleNameJa / roleNameEn へ変換する
 * ※ 子コンポーネント（OrgDetailListComponent）の roleOptions と揃える
 */
function mapRoleTextToRoleInfo(roleText: string): { roleCode: number; roleNameJa: string; roleNameEn: string } {
  if (roleText?.startsWith('1.情報セキュリティ最高責任者')) {
    return {
      roleCode: 1,
      roleNameJa: '1.情報セキュリティ最高責任者(社長/役員)',
      roleNameEn: 'Chief officer in charge of Information security(company president/officer)',
    };
  }
  if (roleText?.startsWith('2.情報セキュリティ運用管理責任者')) {
    return {
      roleCode: 2,
      roleNameJa: '2.情報セキュリティ運用管理責任者(部長/部門長格)',
      roleNameEn: 'Supervisor of information security operations management',
    };
  }
  if (roleText?.startsWith('3.情報セキュリティ運用管理担当者')) {
    return {
      roleCode: 3,
      roleNameJa: '3.情報セキュリティ運用管理担当者',
      roleNameEn: 'Staff of information security operations management',
    };
  }
  if (roleText?.startsWith('4.CSIRT担当者')) {
    return {
      roleCode: 4,
      roleNameJa: '4.CSIRT担当者（正）',
      roleNameEn: 'Person engaged in CSIRT(regular)',
    };
  }
  if (roleText?.startsWith('5.CSIRT担当者')) {
    return {
      roleCode: 5,
      roleNameJa: '5.CSIRT担当者（副）',
      roleNameEn: 'Person engaged in CSIRT(deputy)',
    };
  }

  // 想定外：roleCode=0 として返す（本番ではエラー処理でもOK）
  return { roleCode: 0, roleNameJa: roleText || '', roleNameEn: '' };
}

function generateMockData(desiredAmount: number): RawDbRow[] {
  const mockData: RawDbRow[] = [];
  const baseData = {
    COMPANY_CODE1: 'Z101',
    COMPANY_CODE2: 'S36201',
    COMPANY_TYPE: 'AI国内子会社 1',
    COMPANY_NAME: '光南工業株式会社',
    COMPANY_NAME_EN: 'KONAN KOGYO CO.,LTD.',
    COMPANY_SHORT_NAME: '光南',
    GROUP_CODE: '01_AI',
    REGION: 'アジア',
    COUNTRY: '日本	'
  }

  const baseData2 = {
    COMPANY_CODE1: 'Z102',
    COMPANY_CODE2: 'S36202',
    COMPANY_TYPE: 'AI国内子会社 2',
    COMPANY_NAME: '光南工業株式会社 2',
    COMPANY_NAME_EN: 'KONAN KOGYO CO.,LTD. 2',
    COMPANY_SHORT_NAME: '光南 2',
    GROUP_CODE: '01_AI 2',
    REGION: 'アジア',
    COUNTRY: '日本	'
  }
  mockData.push({
    ...baseData,
    ROLE_CODE: '1_最高責任者',
    OPS_EMAIL: 'X',
    OPS_URL: '日',
    OPS_EMAIL_URL: '日',
    OPS_VULNERABILITY: '日',
    OPS_INFO: '日',
    DEPT_NAME: 'Manufacturing Engineering',
    LOCATION: 'Head Office',
    POSITION: '副部長',
    PERSON_NAME: '氏名1',
    PERSON_CODE: '9000001',
    EMAIL: '9000001@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese	',
  });
  mockData.push({
    ...baseData,
    ROLE_CODE: '2_運用管理責任者',
    OPS_EMAIL: '日',
    OPS_URL: '日',
    OPS_EMAIL_URL: '日',
    OPS_VULNERABILITY: '日',
    OPS_INFO: '日',
    DEPT_NAME: 'President',
    LOCATION: 'Head Office',
    POSITION: '総経理',
    PERSON_NAME: '氏名2',
    PERSON_CODE: '9000002',
    EMAIL: '9000002@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Chinese	',
  });
  mockData.push({
    ...baseData,
    ROLE_CODE: '3_運用管理担当者',
    OPS_EMAIL: '中日',
    OPS_URL: '中日',
    OPS_EMAIL_URL: '中日',
    OPS_VULNERABILITY: '中日',
    OPS_INFO: '中日',
    DEPT_NAME: 'President',
    LOCATION: 'Head Office',
    POSITION: 'Ms',
    PERSON_NAME: '氏名3',
    PERSON_CODE: '9000003',
    EMAIL: '9000003@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese/Chinese',
  });
  mockData.push({
    ...baseData,
    ROLE_CODE: '4_CSIRT（正)',
    OPS_EMAIL: '英日',
    OPS_URL: '英日',
    OPS_EMAIL_URL: '英日',
    OPS_VULNERABILITY: '英日',
    OPS_INFO: '英日',
    DEPT_NAME: 'Staff',
    LOCATION: 'Headquarters in Sop…',
    POSITION: 'President',
    PERSON_NAME: '氏名4',
    PERSON_CODE: '9000004',
    EMAIL: '9000004@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese/English',
  });
  mockData.push({
    ...baseData,
    ROLE_CODE: '5_CSIRT（副）',
    OPS_EMAIL: '×',
    OPS_URL: '中日',
    OPS_EMAIL_URL: '中日',
    OPS_VULNERABILITY: '中日',
    OPS_INFO: '×',
    DEPT_NAME: 'France Headquarters',
    LOCATION: 'Head Office',
    POSITION: 'Mr',
    PERSON_NAME: '氏名5',
    PERSON_CODE: '9000005',
    EMAIL: '9000005@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese',
  });

  mockData.push({
    ...baseData2,
    ROLE_CODE: '1_最高責任者',
    OPS_EMAIL: 'X',
    OPS_URL: '日',
    OPS_EMAIL_URL: '日',
    OPS_VULNERABILITY: '日',
    OPS_INFO: '日',
    DEPT_NAME: 'Manufacturing Engineering',
    LOCATION: 'Head Office',
    POSITION: '副部長',
    PERSON_NAME: '氏名1',
    PERSON_CODE: '9000001',
    EMAIL: '9000001@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese	',
  });
  mockData.push({
    ...baseData2,
    ROLE_CODE: '2_運用管理責任者',
    OPS_EMAIL: '日',
    OPS_URL: '日',
    OPS_EMAIL_URL: '日',
    OPS_VULNERABILITY: '日',
    OPS_INFO: '日',
    DEPT_NAME: 'President',
    LOCATION: 'Head Office',
    POSITION: '総経理',
    PERSON_NAME: '氏名2',
    PERSON_CODE: '9000002',
    EMAIL: '9000002@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Chinese	',
  });
  mockData.push({
    ...baseData2,
    ROLE_CODE: '3_運用管理担当者',
    OPS_EMAIL: '中日',
    OPS_URL: '中日',
    OPS_EMAIL_URL: '中日',
    OPS_VULNERABILITY: '中日',
    OPS_INFO: '中日',
    DEPT_NAME: 'President',
    LOCATION: 'Head Office',
    POSITION: 'Ms',
    PERSON_NAME: '氏名3',
    PERSON_CODE: '9000003',
    EMAIL: '9000003@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese/Chinese',
  });
  mockData.push({
    ...baseData2,
    ROLE_CODE: '4_CSIRT（正)',
    OPS_EMAIL: '英日',
    OPS_URL: '英日',
    OPS_EMAIL_URL: '英日',
    OPS_VULNERABILITY: '英日',
    OPS_INFO: '英日',
    DEPT_NAME: 'Staff',
    LOCATION: 'Headquarters in Sop…',
    POSITION: 'President',
    PERSON_NAME: '氏名4',
    PERSON_CODE: '9000004',
    EMAIL: '9000004@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese/English',
  });
  mockData.push({
    ...baseData2,
    ROLE_CODE: '5_CSIRT（副）',
    OPS_EMAIL: '×',
    OPS_URL: '中日',
    OPS_EMAIL_URL: '中日',
    OPS_VULNERABILITY: '中日',
    OPS_INFO: '×',
    DEPT_NAME: 'France Headquarters',
    LOCATION: 'Head Office',
    POSITION: 'Mr',
    PERSON_NAME: '氏名5',
    PERSON_CODE: '9000005',
    EMAIL: '9000005@mail.com',
    EMERGENCY_CONTACT: 'xxx-xxxx-xxxx',
    LANGUAGE: 'Japanese',
  });
  
  return mockData
}