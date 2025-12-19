/**
 * DMS-RH Models - License
 * Domain: Human Resources Management
 */

// ==================== LICENSE TYPE ====================
export interface LicenseType {
    id: number;
    name: string;
    description?: string;
    validity_months: number;
    renewal_advance_days?: number;
    is_mandatory: boolean;
    created_at?: Date;
    updated_at?: Date;
}

// ==================== LICENSE ====================
export interface License {
    id: number;
    employee: number;
    employee_name?: string;
    employee_id_display?: string;
    license_type: number;
    license_type_name?: string;
    license_number: string;
    issue_date: Date;
    expiry_date: Date;
    issuing_authority: string;
    document_url?: string;
    notes?: string;
    status: 'active' | 'expired' | 'expiring_soon';
    days_until_expiry?: number;
    created_by?: string;
    changed_by?: string;
    created_at?: Date;
    updated_at?: Date;
}

// ==================== LICENSE CREATE ====================
export interface LicenseCreate {
    employee: number;
    license_type: number;
    license_number: string;
    issue_date: Date | string;
    expiry_date: Date | string;
    issuing_authority: string;
    document_url?: string;
    notes?: string;
    created_by?: string;
}

// ==================== LICENSE STATS ====================
export interface LicenseStats {
    total: number;
    active: number;
    expired: number;
    expiring_soon: number;
    by_type: { license_type__name: string; count: number }[];
}
