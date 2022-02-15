import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

const API = `${environment.apiUrl}`;

@Injectable({
    providedIn: 'root',
})
export class BaseService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);

    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    /**
     * Get data
     */
    getData(): Observable<any> {
        return this._httpClient.get('api/dashboards/project').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }
    
    async getRoleID(idUser, token: any): Promise<any> {
        const httpHeaders = new HttpHeaders({ Authorization: `${token}` });
        return this._httpClient
            .get(`${API}/user/${idUser}/`, { headers: httpHeaders, responseType: 'text' })
            .toPromise()
            .then((res) => {
                return res;
            })
            .catch((err) => {
                throw err;
            });
    }

   
}
