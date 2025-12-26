import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
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
import { ColumnFilterState, ColumnKey, FilterType, TableRow } from './org-list-v3.models';
import { createState, generateMockData, mapColumnFilterToSearchDto, roleCodeList } from './org-list-v3.utils';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { filter } from 'rxjs';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { OrgListV3Service } from './org-list-v3.service';
import { ResizableModule, ResizeEvent } from 'angular-resizable-element';
import { NzResizableModule, NzResizeEvent } from 'ng-zorro-antd/resizable';


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
    NzCheckboxModule,
    NzRadioModule,
    NzFlexModule, 
    NzSegmentedModule,
    ResizableModule
  ],
  templateUrl: './org-list-v3.component.html',
  styleUrls: ['./org-list-v3.component.less'],
})
export class OrgListComponentV3 implements OnInit, OnDestroy {
  /** 一覧の列定義 */
  columnDefs: ColDef[] = [];
  listOfColumns1: any[] = [];
  checked = false;
  indeterminate = false;
  setOfCheckedId = new Set<number>(); 
  enableCellSpan = true;
  searchValue = '';
  isLoading = false;

  currentKey: ColumnKey = 'companyCode1';

  filterState: any = {
    companyCode1: createState(),
    companyCode2: createState(),
    companyType: createState(),
    companyName: createState(),
    companyNameEn: createState(),
    companyShortName: createState(),
    groupCode: createState(),
    region: createState(),
    country: createState()
  };

  filterStateActive = createState();

  roleCodeList = roleCodeList;



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


  /**
   * ✅ “仮DB”として保持する明細データ
   * 実システムでは API の結果をここに入れて扱うイメージ
   */
  private rawDbDataStore: TableRow[] = [];

  constructor(
    private msg: NzMessageService,
    private componentService: OrgListV3Service
  ) {}

  ngOnInit(): void {
    // 一覧の列定義（操作列・会社名は固定幅、残りは flex で均等）

    this.listOfColumns1 = [
      // { key: '', name: '操作', width: '200px', widthMin: '200px'},
      { key: 'companyCode1', name: '会社コード1', width: '120px', widthMin: '120px'},
      { key: 'companyCode2', name: '会社コード2', width: '120px', widthMin: '120px'},
      { key: 'companyType', name: '会社種別', width: '100px', widthMin: '100px'},
      { key: 'companyName', name: '会社名', width: '100px', widthMin: '100px'},
      { key: 'companyNameEn', name: '会社名英語', width: '120px', widthMin: '120px'},
      { key: 'companyShortName', name: '会社略称', width: '100px', widthMin: '100px'},
      { key: 'groupCode', name: 'グループコード', width: '140px', widthMin: '140px'},
      { key: 'region', name: '地域', width: '100px', widthMin: '100px'},
      { key: 'country', name: '国', width: '100px', widthMin: '100px'},
      { key: '', name: '役割コード', width: '120px', widthMin: '120px'},
      { key: '', name: 'メールオプション', width: '160px', widthMin: '160px'},
      { key: '', name: 'URLオプション', width: '140px', widthMin: '140px'},
      { key: '', name: 'メール・URLオプション', width: '180px', widthMin: '180px'},
      { key: '', name: '脆弱性オプション', width: '160px', widthMin: '160px'},
      { key: '', name: '情報オプション', width: '140px', widthMin: '140px'},
      { key: '', name: '部署名', width: '140px', widthMin: '140px'},
      { key: '', name: '勤務地', width: '100px', widthMin: '100px'},
      { key: '', name: '役職', width: '100px', widthMin: '100px'},
      { key: '', name: '氏名', width: '100px', widthMin: '100px'},
      { key: '', name: '氏名コード', width: '100px', widthMin: '100px'},
      { key: '', name: 'メールアドレス', width: '140px', widthMin: '140px'},
      { key: '', name: '緊急連絡先', width: '120px', widthMin: '120px'},
      { key: '', name: '言語', width: '100px', widthMin: '100px'},
    ]

    // ✅ 初期データ（仮）
    // this.rawDbDataStore = generateMockData(10);
    this.isLoading = true;
    this.componentService.getAllInformationSecurityRecordsByKeyword("").subscribe({
      next: (value) => {
        console.log(value);
        value.data.forEach((element, index) => {
          element.id = index + 1;
        });
        this.rawDbDataStore = value.data;
        this.refreshRowData();
        this.hideLoadingTable();
      },
      error: (error) => {
        console.log(error);
        this.hideLoadingTable();
      },
    })

    // 一覧表示用 rowData を再計算
    
  }


  ngOnDestroy() {
    // window.removeEventListener('resize', this.handleResize);
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

  onFilterOpen(columnKey: string){
    console.log(columnKey);
    this.currentKey = columnKey as ColumnKey;
  }

  onFilterSearchButton(){
    
    const searchDto = mapColumnFilterToSearchDto(this.filterState);
    this.isLoading = true;
    this.componentService.getInformationSecurityRecordsByFilter(searchDto).subscribe({
      next: (value) => {
        console.log(value);
        this.msg.success('検索できました');
        value.data.forEach((element, index) => {
          element.id = index + 1;
        });
        this.rawDbDataStore = value.data;
        this.refreshRowData();
        this.hideLoadingTable();
        this.filterState[this.currentKey].visible = false;
        
        if(
              this.filterState[this.currentKey].data.filterData1.trim() !== "" 
          ||  this.filterState[this.currentKey].data.filterData2.trim() !== "" 
          ||  this.filterState[this.currentKey].data.filterData3.trim() !== "" 
        ){
          this.filterState[this.currentKey].active = true;

        } else {
          this.filterState[this.currentKey].active = false;
        }

      },
      error: (error) => {
        console.log(error);
        this.hideLoadingTable();
        this.msg.error('検索できません');
      },
    })
      
  }

  onFilterClearButton(){
    this.filterState[this.currentKey].data.filterData1 = "";
    this.filterState[this.currentKey].data.filterData2 = "";
    this.filterState[this.currentKey].data.filterData3 = "";
    
    const searchDto = mapColumnFilterToSearchDto(this.filterState);
    this.isLoading = true;
    this.componentService.getInformationSecurityRecordsByFilter(searchDto).subscribe({
      next: (value) => {
        console.log(value);
        value.data.forEach((element, index) => {
          element.id = index + 1;
        });
        this.msg.success('クリアできました');
        this.rawDbDataStore = value.data;
        this.refreshRowData();
        this.hideLoadingTable();
        this.filterState[this.currentKey].visible = false;
        this.filterState[this.currentKey].active = false;
      },
      error: (error) => {
        console.log(error);
        this.hideLoadingTable();
        this.msg.error('クリアできません');
      },
    })
  }

  onAllChecked(checked: boolean): void {
    this.rowData.forEach(({ id }) => this.updateCheckedSet(id, checked));
    this.refreshCheckedStatus();
  }

  onItemChecked(id: number, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  refreshCheckedStatus(): void {
    const listOfMainRecords = this.rowData.filter(({ isMainRecord }) => isMainRecord);
    this.checked = listOfMainRecords.every(({ id }) => this.setOfCheckedId.has(id));
    this.indeterminate = listOfMainRecords.some(({ id }) => this.setOfCheckedId.has(id)) && !this.checked;
  }

  updateCheckedSet(id: number, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  searchByKeyword(){
    this.isLoading = true;
    this.componentService.getAllInformationSecurityRecordsByKeyword(this.searchValue).subscribe({
      next: (value) => {
        console.log(value);
        value.data.forEach((element, index) => {
          element.id = index + 1;
        });
        this.msg.success('検索できました');
        this.rawDbDataStore = value.data;
        this.refreshRowData();
        this.hideLoadingTable();
      },
      error: (error) => {
        console.log(error);
        this.hideLoadingTable();
        this.msg.error('検索できません');
      },
    })
  }

  onResizeEnd(event: ResizeEvent, columnIndex: number): void {
    console.log('Element was resized', event);
    console.log(columnIndex);
    const minWidth = Number(this.listOfColumns1[columnIndex].widthMin.split("px")[0]);
    const newWidth = event.rectangle.width! < minWidth ? minWidth : event.rectangle.width;
    this.listOfColumns1[columnIndex].width = `${newWidth}px`;
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
  }

  private hideLoadingTable(){
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
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



