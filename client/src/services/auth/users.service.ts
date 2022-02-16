import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
const API = `${environment.apiUrl}`;

@Injectable({
    providedIn: 'root',
})
export class UsersService {
    constructor(private _httpClient: HttpClient) {}

    public getUsersAsync(): Observable<any> {
        const httpHeaders = new HttpHeaders({ Authorization: `${localStorage.getItem('accessToken')}` });
        let res = localStorage.getItem('accessToken')
        return this._httpClient.get<any>(`api/current-user`,{ headers: httpHeaders });
    }
}
