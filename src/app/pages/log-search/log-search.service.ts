import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, LogInfo } from './log-search.models';

const backendUrl = 'http://localhost:5000/api/v1';

@Injectable({
  providedIn: 'root'
})
export class LogSearchService {

  constructor(
    private http: HttpClient
  ) { }

  getAllLogRecords(year: string, month: string): Observable<ApiResponse<LogInfo[]>> {
      let params = new HttpParams();
      params = params.append('year', year);
      params = params.append('month', month);
      return this.http.get<ApiResponse<LogInfo[]>>(`${backendUrl}/log-info`, {params: params});
    }
}
