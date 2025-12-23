import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { MaintenanceService } from './maintenance.service';
import { Company, CompanyRoleOps } from './maintenance.models';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { transformCompanyData, transformCompanyRoleOps } from './maintenance.utils';

@Component({
  selector: 'app-maintenance',
  imports: [NzCardModule, NzSpaceModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.less'
})
export class MaintenanceComponent {

  constructor(
    private maintenanceService: MaintenanceService
  ) {}

  downloadCompanyData(){
    this.getCompanyDataFromDB((companyRequest: {requestSuccess: boolean, data: Company[]}) => {

      if(companyRequest.requestSuccess){
        const transformedData = transformCompanyData(companyRequest.data);
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        const workbook = {
          Sheets: { '会社情報メンテ': worksheet },
          SheetNames: ['会社情報メンテ']
        };

        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, '会社情報メンテ.xlsx');
      }
    });
  }
  
  downloadCompanyRoleOpsData() {
    this.getCompanyRoleOpsDataFromDB((companyRequest: {requestSuccess: boolean, data: CompanyRoleOps[]}) => {
      if(companyRequest.requestSuccess) {
        const transformedData = transformCompanyRoleOps(companyRequest.data);
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        const workbook = {
          Sheets: { 'CSIRTフラグ情報メンテ': worksheet },
          SheetNames: ['CSIRTフラグ情報メンテ']
        };

        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, 'CSIRTフラグ情報メンテ.xlsx');
      }
    });
  }

  private getCompanyDataFromDB(cb: Function){
    const response = {
      requestSuccess: true,
      data: <Company[]>[]
    }

    this.maintenanceService.getAllCompanyRecords().subscribe({
      next(value) {
        console.log(value);
        response.data = value.data;
        cb(response);
      },
      error(err) {
        console.log(err)
        response.requestSuccess = false;
        cb(response);
      },
    })

  }

  private getCompanyRoleOpsDataFromDB(cb: Function) {
  const response = {
    requestSuccess: true,
    data: <CompanyRoleOps[]>[]
  };
  this.maintenanceService.getAllCompanyRoleOpsRecords().subscribe({
    next: (value) => {
      console.log(value);
      response.data = value.data;
      cb(response);
    },
    error: (err) => {
      console.log(err);
      response.requestSuccess = false;
      cb(response);
    },
  });
}

}
