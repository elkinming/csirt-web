import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { ApiResponse, InformationSecuritySearchDto, TableRow } from './org-list-v3.models';

const backendUrl = 'http://localhost:5000/api/v1';

@Injectable({
  providedIn: 'root'
})
export class OrgListV3Service {

  constructor(
    private http: HttpClient
  ) { }

  getAllInformationSecurityRecordsByKeyword(searchKeyword: string): Observable<ApiResponse<TableRow[]>> {
    let params = new HttpParams();
    params = params.append('searchKeyword', searchKeyword);
    return this.http.get<ApiResponse<TableRow[]>>(`${backendUrl}/information_security/all`, {params: params});
  }

  /**
   * 検索条件に基づいて情報セキュリティのレコードを取得する
   * @param filterObject 検索条件
   * @returns 検索結果
   */
  getInformationSecurityRecordsByFilter(filterObject: InformationSecuritySearchDto): Observable<ApiResponse<TableRow[]>> {
    return this.http.post<ApiResponse<TableRow[]>>(`${backendUrl}/information_security/search`,filterObject);
  }
}
