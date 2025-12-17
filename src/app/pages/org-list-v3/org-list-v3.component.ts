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
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TableRow } from './org-list-v3.models';
import { generateMockData } from './org-list-v3.utils';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';


ModuleRegistry.registerModules([AllCommunityModule]);

// ag-Grid のテーマ（Quartz）
const myTheme = themeQuartz.withParams({
  spacing: 6,
  accentColor: 'blue',
});


/**
 * 画面（一覧）表示用：1行=1会社 の集約データ型
 * 各役割は「氏名(社員番号)」のように連結表示
 */

@Component({
  selector: 'app-org-list-v3',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzBadgeModule,
    NzDividerModule, 
    NzDropDownModule, 
    NzIconModule, 
    NzTableModule,
    NzCheckboxModule
  ],
  templateUrl: './org-list-v3.component.html',
  styleUrls: ['./org-list-v3.component.less'],
})
export class OrgListComponentV3 implements OnInit, OnDestroy {
  /** 一覧の列定義 */
  columnDefs: ColDef[] = [];
  listOfColumns1: any[] = [];
  listOfColumns2: any[] = [];
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<number>(); 
  enableCellSpan = true;
  searchValue = '';
  filterValue1 = '';
  filterValue2 = '';
  filterValue3 = '';
  isFilterVisible = false;

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
  private rawDbDataStore: TableRow[] = [];

  constructor(
    private msg: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    // 一覧の列定義（操作列・会社名は固定幅、残りは flex で均等）

    this.listOfColumns1 = [
      { name: '操作', width: '200px'},
      { name: '会社コード1', width: '120px'},
      { name: '会社コード2', width: '120px'},
      { name: '会社種別', width: '100px'},
      { name: '会社名', width: '100px'},
      { name: '会社名英語', width: '120px'},
      { name: '会社略称', width: '100px'},
      { name: 'グループコード', width: '140px'},
      { name: '地域', width: '100px'},
      { name: '国', width: '100px'},
      { name: '役割コード', width: '120px'},
      { name: 'メールオプション', width: '160px'},
      { name: 'URLオプション', width: '140px'},
      { name: 'メール・URLオプション', width: '180px'},
      { name: '脆弱性オプション', width: '160px'},
      { name: '情報オプション', width: '140px'},
      { name: '部署名', width: '100px'},
      { name: '勤務地', width: '100px'},
      { name: '役職', width: '100px'},
      { name: '氏名', width: '100px'},
      { name: '氏名コード', width: '100px'},
      { name: 'メールアドレス', width: '140px'},
      { name: '緊急連絡先', width: '120px'},
      { name: '言語', width: '100px'},
    ]

    // ✅ 初期データ（仮）
    this.rawDbDataStore = generateMockData(10);

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

  onAllChecked(event: any){

  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    // this.refreshCheckedStatus();
  }

  updateCheckedSet(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
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
    this.rowData = this.rawDbDataStore;
    // 反映後に列幅を再調整
    setTimeout(() => this.gridApi?.sizeColumnsToFit());
  }

}

/** 文字列連結用：既に値がある場合は改行でつなげる */
function appendLine(base: string, value: string): string {
  if (!base) return value;
  return base + '\n' + value;
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



