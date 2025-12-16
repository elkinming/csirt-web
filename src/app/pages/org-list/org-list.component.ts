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

import { OrgDetailListComponent, RawDbRow as DetailRow } from './org-detail-list/org-detail-list.component';

ModuleRegistry.registerModules([AllCommunityModule]);

// ag-Grid のテーマ（Quartz）
const myTheme = themeQuartz.withParams({
  spacing: 12,
  accentColor: 'blue',
});

/**
 * DBから取得する 1行=1役割 の明細データ型（例）
 * ※ 実際は API レスポンスに合わせて調整してください
 */
interface RawDbRow {
  companyName: string;

  roleCode: number;       // 1〜5
  roleNameJa: string;     // 役割（日本語）
  roleNameEn: string;     // 役割（英語）

  department: string;     // 部署名
  location?: string;      // 勤務地
  title: string;          // 役職
  name: string;           // 氏名
  employeeId: string;     // 従業員コード
  email: string;          // メール
  emergencyContact: string; // 緊急連絡先
  language: string;       // 言語
}

/**
 * 画面（一覧）表示用：1行=1会社 の集約データ型
 * 各役割は「氏名(社員番号)」のように連結表示
 */
interface OrgRow {
  id: number;
  companyName: string;

  chiefSecurityOfficer: string;   // 1. 情報セキュリティ最高責任者
  securityOpsSupervisor: string;  // 2. 情報セキュリティ運用管理責任者
  securityOpsStaff: string;       // 3. 情報セキュリティ運用管理担当者（複数なら改行連結）
  csirtPrimary: string;           // 4. CSIRT担当者（正）
  csirtDeputy: string;            // 5. CSIRT担当者（副）
}

@Component({
  selector: 'app-org-list',
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
  templateUrl: './org-list.component.html',
  styleUrls: ['./org-list.component.less'],
})
export class OrgListComponent implements OnInit, OnDestroy {
  /** 一覧の列定義 */
  columnDefs: ColDef[] = [];

  /** 一覧の共通列設定 */
  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  /** ag-Grid Theme */
  theme: Theme | 'legacy' = myTheme;

  /** 一覧表示データ（1会社=1行） */
  rowData: OrgRow[] = [];

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
        pinned: 'left',
        suppressSizeToFit: true,
        cellRenderer: this.actionCellRenderer,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      },
      {
        headerName: '会社名',
        field: 'companyName',
        width: 260,
        minWidth: 260,
        maxWidth: 260,
        pinned: 'left',
        suppressSizeToFit: true,
      },
      { headerName: '情報セキュリティ最高責任者', field: 'chiefSecurityOfficer', flex: 1, minWidth: 250 },
      { headerName: '情報セキュリティ運用管理責任者', field: 'securityOpsSupervisor', flex: 1, minWidth: 280 },
      { headerName: '情報セキュリティ運用管理担当者', field: 'securityOpsStaff', flex: 1, minWidth: 280 },
      { headerName: 'CSIRT担当者（正）', field: 'csirtPrimary', flex: 1, minWidth: 200 },
      { headerName: 'CSIRT担当者（副）', field: 'csirtDeputy', flex: 1, minWidth: 200 },
    ];

    // ✅ 初期データ（仮）
    this.rawDbDataStore = [
      {
        companyName: 'XXX株式会社 / XYZ CO.,LTD',
        roleCode: 1,
        roleNameJa: '1.情報セキュリティ最高責任者(社長/役員)',
        roleNameEn: 'Chief officer in charge of Information security(company president/officer)',
        department: 'XXX本社 / XXX Head Office',
        title: 'XXX',
        name: 'XXXX XXXX',
        employeeId: '1000011',
        email: 'xxxx@yyyyyy.kk.ee',
        emergencyContact: '+81-90-1234-5678',
        language: 'Japanese',
      },
      {
        companyName: 'XXX株式会社 / XYZ CO.,LTD',
        roleCode: 2,
        roleNameJa: '2.情報セキュリティ運用管理責任者(部長/部門長格)',
        roleNameEn: 'Supervisor of information security operations management',
        department: '○○○部 □□□G / XXX Department',
        location: 'XXX本社 / XXX Head Office',
        title: 'XXX',
        name: 'XXXX XXXX',
        employeeId: '2000001',
        email: 'zzzzz@yyyyyy.kk.ee',
        emergencyContact: '+81-90-2345-6789',
        language: 'English',
      },
      {
        companyName: 'XXX株式会社 / XYZ CO.,LTD',
        roleCode: 3,
        roleNameJa: '3.情報セキュリティ運用管理担当者',
        roleNameEn: 'Staff of information security operations management',
        department: '○○○部 □□□G △△△T / XXX Department xxx section',
        location: 'XXX本社 / XXX Head Office',
        title: 'XXX',
        name: 'XXXX XXXX',
        employeeId: '2000012',
        email: 'fffffff@yyyyyy.kk.ee',
        emergencyContact: '+81-90-3456-7890',
        language: 'Japanese/English',
      },
      {
        companyName: 'XXX株式会社 / XYZ CO.,LTD',
        roleCode: 4,
        roleNameJa: '4.CSIRT担当者（正）',
        roleNameEn: 'Person engaged in CSIRT(regular)',
        department: '○○○部 □□□G △△△T / XXX Department xxx section xxx team',
        location: 'XXX本社 / XXX Head Office',
        title: 'XXX',
        name: 'XXXX XXXX',
        employeeId: '5000012',
        email: 'yyyy@yyyyyy.kk.ee',
        emergencyContact: '+81-90-9876-1234',
        language: 'Japanese/English',
      },
      {
        companyName: 'XXX株式会社 / XYZ CO.,LTD',
        roleCode: 5,
        roleNameJa: '5.CSIRT担当者（副）',
        roleNameEn: 'Person engaged in CSIRT(deputy)',
        department: '○○○部 □□□G △△△T / XXX Department xxx section xxx team',
        location: 'XXX本社 / XXX Head Office',
        title: 'XXX',
        name: 'XXXX XXXX',
        employeeId: '3000010',
        email: 'aaaa@yyyyyy.kk.ee',
        emergencyContact: '+81-90-1111-2222',
        language: 'Japanese/English',
      },
    ];

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
    const row = event.data as OrgRow;

    if (action === 'edit') {
      this.openEditModal(row);
      return;
    }

    if (action === 'delete') {
      this.deleteCompany(row.companyName);
      return;
    }
  }

  /** 「新規追加」：モーダルを開き、保存後に一覧へ反映 */
  openCreateModal() {
    const ref = this.modal.create({
      nzTitle: '新規追加',
      nzContent: OrgDetailListComponent,
      nzWidth: '90vw',
      nzStyle: { top: '24px' },
      nzMaskClosable: false,
      nzFooter: null,
      nzData: {
        mode: 'create',
        companyName: '',
        rawDbRows: [],
      },
    });

    // モーダル保存（close(rows)）されたら明細を“仮DB”へ反映して一覧を更新
    ref.afterClose.subscribe((rows: DetailRow[] | undefined) => {
      if (!rows || rows.length === 0) return;

      this.upsertDetailRows(rows);
      this.refreshRowData();
      this.msg.success('登録しました');
    });
  }

  /** 「編集」：該当会社の明細をモーダルへ渡し、保存後に一覧へ反映 */
  openEditModal(row: OrgRow) {
    const detailRows = this.getRawDbRowsByCompany(row.companyName);

    // 親の“仮DB形式” -> 子（モーダル）で使う 10列形式へ変換
    const modalRows: DetailRow[] = detailRows.map(r => ({
      companyName: r.companyName,
      role: r.roleNameJa, // 子コンポーネントの roleOptions と合わせて「日文文字列」を使用
      department: r.department ?? '',
      location: r.location ?? '',
      title: r.title ?? '',
      name: r.name ?? '',
      employeeId: r.employeeId ?? '',
      email: r.email ?? '',
      emergencyContact: r.emergencyContact ?? '',
      language: r.language ?? '',
    }));

    const ref = this.modal.create({
      nzTitle: '編集',
      nzContent: OrgDetailListComponent,
      nzWidth: '90vw',
      nzStyle: { top: '24px' },
      nzMaskClosable: false,
      nzFooter: null,
      nzData: {
        mode: 'edit',
        companyName: row.companyName,
        rawDbRows: modalRows,
      },
    });

    // 保存された明細を“仮DB”へ反映し、一覧へ再計算
    ref.afterClose.subscribe((rows: DetailRow[] | undefined) => {
      if (!rows) return; // cancel の場合
      this.upsertDetailRows(rows, row.companyName);
      this.refreshRowData();
      this.msg.success('更新しました');
    });
  }

  /**
   * 「削除」：会社単位で削除（一覧が 1会社=1行 のため）
   * ※ 要件により「役割単位削除」へ変更も可能
   */
  private deleteCompany(companyName: string) {
    if (!confirm(`「${companyName}」を削除しますか？`)) return;

    this.rawDbDataStore = this.rawDbDataStore.filter(r => r.companyName !== companyName);
    this.refreshRowData();
    this.msg.success('削除しました');
  }

  /** “仮DB”から会社名で明細（1行=1役割）を取得 */
  private getRawDbRowsByCompany(companyName: string): RawDbRow[] {
    return this.rawDbDataStore.filter(r => r.companyName === companyName);
  }

  /**
   * モーダルから返ってきた明細（10列形式）を“仮DB”へ反映（上書き）
   * - 同じ会社の既存データを削除してから挿入
   * - role（文字列）を roleCode/日英名へ変換
   */
  private upsertDetailRows(rows: DetailRow[], fallbackCompanyName?: string) {
    // 会社名は rows の中の値を優先。空なら編集元の会社名を使う
    const companyName =
      rows.find(r => r.companyName)?.companyName ||
      fallbackCompanyName ||
      'XXX株式会社 / XYZ CO.,LTD';

    // 既存の会社データを削除
    this.rawDbDataStore = this.rawDbDataStore.filter(r => r.companyName !== companyName);

    // 明細（10列形式）-> “仮DB形式”へ変換して追加
    const mapped: RawDbRow[] = rows.map((r) => {
      const roleInfo = mapRoleTextToRoleInfo(r.role);

      return {
        companyName,
        roleCode: roleInfo.roleCode,
        roleNameJa: roleInfo.roleNameJa,
        roleNameEn: roleInfo.roleNameEn,
        department: r.department ?? '',
        location: r.location ?? '',
        title: r.title ?? '',
        name: r.name ?? '',
        employeeId: r.employeeId ?? '',
        email: r.email ?? '',
        emergencyContact: r.emergencyContact ?? '',
        language: r.language ?? '',
      };
    });

    this.rawDbDataStore = [...this.rawDbDataStore, ...mapped];
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

/** “仮DB形式（1行=1役割）” -> 一覧表示用（1行=1会社）へ集約 */
function convertToOrgRows(db: RawDbRow[]): OrgRow[] {
  const map = new Map<string, OrgRow>(); // key: companyName

  db.forEach((row) => {
    let org = map.get(row.companyName);
    if (!org) {
      org = {
        id: map.size + 1,
        companyName: row.companyName,
        chiefSecurityOfficer: '',
        securityOpsSupervisor: '',
        securityOpsStaff: '',
        csirtPrimary: '',
        csirtDeputy: '',
      };
      map.set(row.companyName, org);
    }

    // 表示ラベル（例）：氏名(社員番号)
    const personLabel = `${row.name} (${row.employeeId})`;

    // roleCode に応じて各列へ割り当て（複数は改行で連結）
    switch (row.roleCode) {
      case 1:
        org.chiefSecurityOfficer = appendLine(org.chiefSecurityOfficer, personLabel);
        break;
      case 2:
        org.securityOpsSupervisor = appendLine(org.securityOpsSupervisor, personLabel);
        break;
      case 3:
        org.securityOpsStaff = appendLine(org.securityOpsStaff, personLabel);
        break;
      case 4:
        org.csirtPrimary = appendLine(org.csirtPrimary, personLabel);
        break;
      case 5:
        org.csirtDeputy = appendLine(org.csirtDeputy, personLabel);
        break;
      default:
        console.warn('Unknown roleCode:', row.roleCode, row);
    }
  });

  return Array.from(map.values());
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
