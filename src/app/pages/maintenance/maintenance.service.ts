import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, Company, CompanyPermission, CompanyRoleOps } from './maintenance.models';

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

  getAllCompanyPermissionsRecords(): Observable<ApiResponse<CompanyPermission[]>> {
    return this.http.get<ApiResponse<CompanyPermission[]>>(`${backendUrl}/company-permissions/all`);
  }

  uploadCompanyData = (data: Company[]): Observable<ApiResponse<Company[]>> => {
    return this.http.post<ApiResponse<Company[]>>(`${backendUrl}/company/list`, data);
  }

  uploadCompanyRoleOpsData = (data: CompanyRoleOps[]): Observable<ApiResponse<CompanyRoleOps[]>> => {
    return this.http.post<ApiResponse<CompanyRoleOps[]>>(`${backendUrl}/company-role-ops/list`, data);
  }

  uploadCompanyPermissionData = (data: CompanyPermission[]): Observable<ApiResponse<CompanyPermission[]>> => {
    return this.http.post<ApiResponse<CompanyPermission[]>>(`${backendUrl}/company-permissions/list`, data);
  }
}
