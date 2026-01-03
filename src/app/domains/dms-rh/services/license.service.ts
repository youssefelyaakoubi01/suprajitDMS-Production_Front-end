/**
 * DMS-RH License Service
 * Domain: Human Resources Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { License, LicenseType, LicenseCreate, LicenseStats } from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsLicenseService {
    private readonly endpoint = 'employees';

    constructor(private api: ApiService) {}

    // ==================== LICENSES ====================
    getLicenses(params?: {
        employeeId?: number;
        licenseTypeId?: number;
        status?: string;
    }): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses`, params);
    }

    getLicense(id: number): Observable<License> {
        return this.api.get<License>(`${this.endpoint}/licenses/${id}`);
    }

    createLicense(license: LicenseCreate): Observable<License> {
        return this.api.post<License>(`${this.endpoint}/licenses`, license);
    }

    updateLicense(id: number, license: Partial<License>): Observable<License> {
        return this.api.put<License>(`${this.endpoint}/licenses/${id}`, license);
    }

    deleteLicense(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/licenses/${id}`);
    }

    // ==================== LICENSE TYPES ====================
    getLicenseTypes(): Observable<LicenseType[]> {
        return this.api.get<LicenseType[]>(`${this.endpoint}/license-types`);
    }

    getLicenseType(id: number): Observable<LicenseType> {
        return this.api.get<LicenseType>(`${this.endpoint}/license-types/${id}`);
    }

    createLicenseType(licenseType: Partial<LicenseType>): Observable<LicenseType> {
        return this.api.post<LicenseType>(`${this.endpoint}/license-types`, licenseType);
    }

    updateLicenseType(id: number, licenseType: Partial<LicenseType>): Observable<LicenseType> {
        return this.api.put<LicenseType>(`${this.endpoint}/license-types/${id}`, licenseType);
    }

    deleteLicenseType(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/license-types/${id}`);
    }

    // ==================== STATS & ALERTS ====================
    getLicenseStats(): Observable<LicenseStats> {
        return this.api.get<LicenseStats>(`${this.endpoint}/licenses/stats`);
    }

    getExpiringLicenses(daysThreshold: number = 30): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses/expiring`, { days: daysThreshold });
    }

    getExpiredLicenses(): Observable<License[]> {
        return this.api.get<License[]>(`${this.endpoint}/licenses/expired`);
    }
}
