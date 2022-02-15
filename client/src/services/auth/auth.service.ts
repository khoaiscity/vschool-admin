import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
const API = `${environment.apiUrl}`;

@Injectable({
    providedIn: 'root',
})
export class AuthenServices {
    constructor(private _httpClient: HttpClient) {}

    public signIn(data): Observable<any> {
        return this._httpClient.post<any>(`${API}/admin/sign-in`,data);
    }
    
    public encryptPass(password): Promise<any> {
        let params = {
            text:password
        }
        return this._httpClient.post<any>(`${API}/dev/en_rsa`,params).toPromise();
    }

    public verifyAccessToken(): Observable<any> {
        const httpHeaders = new HttpHeaders({ Authorization: `${localStorage.getItem('accessToken')}` });
        return this._httpClient.get<any>(`${API}/admin/verify-access-tk`,{ headers: httpHeaders });
    }
}
