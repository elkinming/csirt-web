import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { ApiResponse, TableRow } from './org-list-v3.models';

const backendUrl = 'http://localhost:5000/api/v1';

@Injectable({
  providedIn: 'root'
})
export class OrgListV3Service {

  constructor(
    private http: HttpClient
  ) { }

  getAllInformationSecurityRecords(): Observable<ApiResponse<TableRow[]>> {
    return this.http.get<ApiResponse<TableRow[]>>(`${backendUrl}/information_security/all`);
  }
}
