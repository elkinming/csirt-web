import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-log-search',
  imports: [NzCardModule, NzSpaceModule, NzSelectModule, CommonModule, FormsModule],
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

  constructor(){
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

}
