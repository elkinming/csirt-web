import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  Theme,
  themeQuartz,
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

const myTheme = themeQuartz.withParams({
  spacing: 10,
  accentColor: 'blue',
});

export type Mode = 'create' | 'edit';

export interface RawDbRow {
  companyName: string;       // ①会社名
  role: string;              // ②役割（ドロップダウン）
  department: string;        // ③部署名
  location: string;          // ④勤務地情報
  title: string;             // ⑤役職
  name: string;              // ⑥氏名
  employeeId: string;        // ⑦従業員コード
  email: string;             // ⑧メールアドレス
  emergencyContact: string;  // ⑨緊急時連絡先
  language: string;          // ⑩言語
}

export interface OrgDetailModalData {
  mode: Mode;
  companyName: string;
  rawDbRows?: RawDbRow[];
}

@Component({
  selector: 'app-org-detail-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NzButtonModule, NzMessageModule, AgGridAngular],
  templateUrl: './org-detail-list.component.html',
  styleUrls: ['./org-detail-list.component.less'],
})
export class OrgDetailListComponent implements OnInit, OnDestroy {
  theme: Theme | 'legacy' = myTheme;

  columnDefs: ColDef[] = [];
  defaultColDef: ColDef = {
    editable: true,
    resizable: true,
    sortable: true,
    filter: true,
    wrapText: false,
    autoHeight: false,
  };

  rowData: RawDbRow[] = [];
  private gridApi?: GridApi;

  readonly roleOptions = [
    '1.情報セキュリティ最高責任者(社長/役員)',
    '2.情報セキュリティ運用管理責任者(部長/部門長格)',
    '3.情報セキュリティ運用管理担当者',
    '4.CSIRT担当者（正）',
    '5.CSIRT担当者（副）',
  ];

  readonly languageOptions = ['Japanese', 'English', 'Japanese/English'];

  constructor(
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: OrgDetailModalData,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    this.columnDefs = [
      {
        headerName: '削除',
        field: '__delete__',
        width: 100,
        pinned: 'left',
        suppressSizeToFit: true,
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: () =>
          `<button class="ag-action-btn ag-delete-btn" type="button" data-action="row-delete">削除</button>`,
        cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
      },

      { headerName: '①会社名 / Company name', field: 'companyName', minWidth: 240, pinned: 'left' },

      {
        headerName: '②役割 / Roles',
        field: 'role',
        minWidth: 360,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: this.roleOptions },
      },

      { headerName: '③部署名 / Department', field: 'department', minWidth: 240, tooltipField: 'department' },
      { headerName: '④勤務地情報 / Work location', field: 'location', minWidth: 260 },
      { headerName: '⑤役職 / Title', field: 'title', minWidth: 160 },
      { headerName: '⑥氏名 / Name', field: 'name', minWidth: 160 },
      { headerName: '⑦従業員コード / Employee ID', field: 'employeeId', minWidth: 180 },
      { headerName: '⑧メール / E-MAIL', field: 'email', minWidth: 240 },
      { headerName: '⑨緊急連絡先 / Emergency contact', field: 'emergencyContact', minWidth: 240 },

      {
        headerName: '⑩言語 / Language',
        field: 'language',
        minWidth: 180,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: this.languageOptions },
      },
    ];

    const mode = this.data?.mode ?? 'create';
    const companyName = this.data?.companyName ?? 'XXX株式会社 / XYZ CO.,LTD';

    if (mode === 'edit' && this.data.rawDbRows?.length) {
      this.rowData = this.data.rawDbRows.map((r) => ({
        companyName: r.companyName || companyName,
        role: r.role || '',
        department: r.department || '',
        location: r.location || '',
        title: r.title || '',
        name: r.name || '',
        employeeId: r.employeeId || '',
        email: r.email || '',
        emergencyContact: r.emergencyContact || '',
        language: r.language || '',
      }));
    } else {
      this.rowData = [];
    }
  }

  onGridReady(e: GridReadyEvent) {
    this.gridApi = e.api;
    this.gridApi.sizeColumnsToFit();
    window.addEventListener('resize', this.handleResize);
  }

  onFirstDataRendered(_e: FirstDataRenderedEvent) {
    this.gridApi?.sizeColumnsToFit();
  }

  private handleResize = () => {
    this.gridApi?.sizeColumnsToFit();
  };

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
  }

  //新規追加
  addRow(): void {
    const companyName = this.data?.companyName || '';

    const newRow: RawDbRow = {
      companyName,
      role: this.roleOptions[0],
      department: '',
      location: '',
      title: '',
      name: '',
      employeeId: '',
      email: '',
      emergencyContact: '',
      language: 'Japanese',
    };

    if (this.gridApi) {
      this.gridApi.applyTransaction({ add: [newRow] });
    } else {
      this.rowData = [...this.rowData, newRow];
    }
  }

  /** ✅ 行削除：削除列のボタン押下を拾う */
  onCellClicked(event: any): void {
    if (event?.colDef?.field !== '__delete__') return;

    const target = event?.event?.target as HTMLElement | null;
    if (!target) return;

    const action = target.getAttribute('data-action');
    if (action !== 'row-delete') return;

    const row = event.data as RawDbRow;
    if (!row) return;

    // 編集途中の値を確定してから削除
    this.gridApi?.stopEditing();

    if (!confirm('この行を削除しますか？')) return;

    if (this.gridApi) {
      this.gridApi.applyTransaction({ remove: [row] });
    } else {
      this.rowData = this.rowData.filter((r) => r !== row);
    }

    this.msg.success('削除しました');
  }

  /** ✅ 保存：grid の最新データを集める */
  save(): void {
    const rows: RawDbRow[] = [];

    if (this.gridApi) {
      this.gridApi.stopEditing(); // 編集途中の値を確定
      this.gridApi.forEachNode((node) => {
        if (node.data) rows.push(node.data as RawDbRow);
      });
    } else {
      rows.push(...this.rowData);
    }

    // 簡易必須チェック
    const invalid = rows.some((r) => !r.companyName || !r.role || !r.name || !r.employeeId);
    if (invalid) {
      this.msg.warning('会社名・役割・氏名・従業員コードは必須です');
      return;
    }

    console.log('SAVE rows:', rows);
    this.msg.success('保存しました');
    this.modalRef.close(rows); // 親へ返す
  }

  cancel(): void {
    this.modalRef.destroy();
  }
}
