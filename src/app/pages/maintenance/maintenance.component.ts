import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { MaintenanceService } from './maintenance.service';
import { Company, CompanyPermission, CompanyRoleOps } from './maintenance.models';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { transformCompanyBackToOriginal, transformCompanyData, transformCompanyPermission, transformCompanyRoleOps, transformCompanyRoleOpsBackToOriginal } from './maintenance.utils';
import { NzUploadFile, NzUploadModule } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-maintenance',
  imports: [NzCardModule, NzSpaceModule, NzUploadModule, NzIconModule, NzButtonModule],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.less'
})
export class MaintenanceComponent {

  fileListCompany: NzUploadFile[] = [];
  fileListCompanyRoleOps: NzUploadFile[] = [];
  fileListCompanyPermission: NzUploadFile[] = [];

  constructor(
    private maintenanceService: MaintenanceService,
    private msg: NzMessageService,
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
  
  downloadCompanyPermissionData() {
    this.getCompanyPermissionDataFromDB((companyRequest: {requestSuccess: boolean, data: CompanyPermission[]}) => {
      if(companyRequest.requestSuccess) {
        const transformedData = transformCompanyPermission(companyRequest.data);
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        const workbook = {
          Sheets: { '権限情報メンテ': worksheet },
          SheetNames: ['権限情報メンテ']
        };

        const excelBuffer = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array'
        });

        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, '権限情報メンテ.xlsx');
      }
    });
  }

  beforeUploadCompany = (file: NzUploadFile) => {
    this.fileListCompany = [file];
    return false;
  };

  beforeUploadCompanyRoleOps = (file: NzUploadFile) => {
    this.fileListCompanyRoleOps = [file];
    return false;
  };

  clearFileList(listName: string) {
    if(listName === 'company') {
      this.fileListCompany = [];
    } else if(listName === 'companyRoleOps') {
      this.fileListCompanyRoleOps = [];
    }
  }

  async uploadCompanyData() {
    this.uploadDataHelper(
      this.fileListCompany, 
      transformCompanyBackToOriginal, 
      this.maintenanceService.uploadCompanyData, 
      'company'
    )
  }

  async uploadCompanyRoleOpsData() {
    this.uploadDataHelper(
      this.fileListCompanyRoleOps, 
      transformCompanyRoleOpsBackToOriginal, 
      this.maintenanceService.uploadCompanyRoleOpsData, 
      'companyRoleOps'
    )
  }

  private uploadDataHelper = async (fileList: NzUploadFile[], transformFunction: (data: any[]) => any[], serviceMethod: (data: any[]) => Observable<any>, listName: string) => {
    if (fileList.length === 0) {
      this.msg.error('ファイルが選択されていません');
      return;
    }
    try {
      const file = fileList[0] as any;
      const data = await this.readExcelFile(file);
      const transformedData = transformFunction(data);      
      serviceMethod(transformedData).subscribe({
        next: (value) => {
          this.msg.success('アップロードしました');
          this.clearFileList(listName);
        },
        error: (err) => {
          this.msg.error('アップロードできません');
        }
      });
      
    } catch (error) {
      this.msg.error('アップロードできません');
    }
  }

  private readExcelFile(file: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Assuming the first sheet is the one we want
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      fileReader.onerror = (error) => {
        reject(error);
      };
      
      // Read the file as an array buffer
      fileReader.readAsArrayBuffer(file as any);
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

  private getCompanyPermissionDataFromDB(cb: Function) {
    const response = {
      requestSuccess: true,
      data: <CompanyPermission[]>[]
    };

    this.maintenanceService.getAllCompanyPermissionsRecords().subscribe({
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
