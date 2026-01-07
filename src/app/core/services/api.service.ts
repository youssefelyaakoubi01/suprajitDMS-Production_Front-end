import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    private ensureTrailingSlash(endpoint: string): string {
        return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    }

    get<T>(endpoint: string, params?: Record<string, unknown>): Observable<T> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = params[key];
                // Only include non-null, non-undefined, non-empty values
                if (value !== undefined && value !== null && value !== '') {
                    httpParams = httpParams.set(key, String(value));
                }
            });
        }
        return this.http.get<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`, { params: httpParams });
    }

    post<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`, body);
    }

    postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`, formData);
    }

    put<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.put<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`, body);
    }

    patch<T>(endpoint: string, body: unknown): Observable<T> {
        return this.http.patch<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`, body);
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.apiUrl}/${this.ensureTrailingSlash(endpoint)}`);
    }
}
