import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { LogSearchService } from './log-search.service';
import { LogInfo } from './log-search.models';
import { transformLogInfoData } from './log-search.utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-log-search',
  imports: [NzCardModule, NzSpaceModule, NzSelectModule, CommonModule, FormsModule, NzButtonModule],
  templateUrl: './log-search.component.html',
  styleUrl: './log-search.component.less'
})
export class LogSearchComponent {

  searchYearSelected: string = '';
  searchMonthSelected: string = '';
  yearList: string[] = [];
  monthList: string[] = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
  ];

  constructor(
    private logSearchService: LogSearchService,
    private msg: NzMessageService,
  ){
    this.yearList = this.getYearList();
    this.searchYearSelected = this.yearList[0];
    this.searchMonthSelected = this.monthList[new Date().getMonth()];
  }

  getYearList(){
    const yearList: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 2010; i--) {
      yearList.push(i.toString());
    }
    return yearList;
  }

  exportlogRecords(){
    this.getLogDataFromDB((response: {requestSuccess: boolean, data: LogInfo[]}) => {
      if(response.requestSuccess){
        const transformedData = transformLogInfoData(response.data);
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        const workbook = {
          Sheets: { '操作ログ一覧': worksheet },
          SheetNames: ['操作ログ一覧']
        };

        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, '操作ログ一覧.xlsx');
      }
    })
  }

  private getLogDataFromDB(cb: Function){
    const response = {
      requestSuccess: true,
      data: <LogInfo[]>[]
    }

    this.logSearchService.getAllLogRecords(this.searchYearSelected, this.searchMonthSelected).subscribe({
      next: (value) => {
        console.log(value);
        this.msg.success('操作ログ一覧を取得しました');
        response.data = value.data;
        cb(response);
      },
      error: (err) => {
        console.log(err)
        this.msg.error('操作ログ一覧を取得できません');
        response.requestSuccess = false;
        cb(response);
      },
    })

  }



}
