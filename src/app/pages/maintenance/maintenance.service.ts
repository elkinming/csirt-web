import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, Company, CompanyRoleOps } from './maintenance.models';

const backendUrl = 'http://localhost:5000/api/v1';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {

  constructor(
    private http: HttpClient
  ) { }

  getAllCompanyRecords(): Observable<ApiResponse<Company[]>> {
    return this.http.get<ApiResponse<Company[]>>(`${backendUrl}/company/all`);
  }

  getAllCompanyRoleOpsRecords(): Observable<ApiResponse<CompanyRoleOps[]>> {
    return this.http.get<ApiResponse<CompanyRoleOps[]>>(`${backendUrl}/company-role-ops/all`);
  }
}
