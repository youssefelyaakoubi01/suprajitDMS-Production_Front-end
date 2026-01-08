/**
 * DMS-RH Models - Presence & Working Hours
 * Domain: Human Resources Management - Attendance Tracking
 *
 * These models support the automatic attendance synchronization from
 * DMS-Production TeamAssignment records.
 */

// ==================== TYPES ====================

export type HourType = 'normal' | 'extra' | 'break' | 'extra_hour_break' | 'setup';
export type PresenceSource = 'auto' | 'manual';
export type PresenceStatus = 'pending' | 'confirmed' | 'approved' | 'rejected';

// ==================== INTERFACES ====================

/**
 * Individual working hour record.
 * Each record represents one hour of work with type and duration details.
 * Synced automatically from Production TeamAssignment.
 */
export interface EmployeeWorkingHour {
    id: number;
    employee: number;
    employee_name: string;
    employee_badge: string;
    employee_picture?: string;
    date: string;  // ISO date string (YYYY-MM-DD)
    shift: number | null;
    shift_name: string | null;
    shift_code: string | null;
    hour_number: number;  // 0-7 representing hours within shift
    hour_type: HourType;
    hour_type_display: string;
    duration_minutes: number;
    hourly_production?: number;
    team_assignment?: number;
    production_line_name?: string;
    source: PresenceSource;
    source_display: string;
    status: PresenceStatus;
    status_display: string;
    modified_by?: number;
    modified_by_name?: string;
    modified_at?: string;
    modification_reason?: string;
    created_at: string;
}

/**
 * Aggregated presence summary by employee/date.
 * Used for the main presence list view in HR module.
 */
export interface PresenceSummary {
    employee_id: number;
    employee_name: string;
    employee_badge: string;
    employee_picture?: string;
    date: string;
    shift: string;
    shift_name: string;
    shift_start_time?: string;
    shift_end_time?: string;
    production_line?: string;
    project?: string;
    first_hour?: number;
    last_hour?: number;
    total_hours: number;
    normal_hours: number;
    extra_hours: number;
    break_hours: number;
    setup_hours: number;
    total_duration_minutes: number;
    status: PresenceStatus;
    source: PresenceSource;
    has_manual_corrections: boolean;
}

/**
 * Filter parameters for presence queries.
 */
export interface PresenceFilter {
    employee?: number;
    date?: string;
    date_from?: string;
    date_to?: string;
    shift?: number;
    status?: PresenceStatus;
    source?: PresenceSource;
    search?: string;
}

/**
 * Data for updating a working hour (manual correction).
 */
export interface WorkingHourUpdate {
    hour_type?: HourType;
    duration_minutes?: number;
    status?: PresenceStatus;
    modification_reason: string;
}

/**
 * Request for bulk approval.
 */
export interface BulkApproveRequest {
    ids: number[];
}

/**
 * Response from bulk approval.
 */
export interface BulkApproveResponse {
    approved_count: number;
    message: string;
}

/**
 * Statistics for presence dashboard.
 */
export interface PresenceStats {
    date: string;
    total_employees: number;
    present_today: number;
    pending_approvals: number;
    manual_corrections: number;
    total_hours_today: number;
    normal_hours_today: number;
    extra_hours_today: number;
}

// ==================== CONSTANTS ====================

/**
 * Hour type options for dropdowns.
 */
export const HOUR_TYPE_OPTIONS: { label: string; value: HourType }[] = [
    { label: 'Normal', value: 'normal' },
    { label: 'Extra Hour', value: 'extra' },
    { label: 'Break', value: 'break' },
    { label: 'Extra Hour Break', value: 'extra_hour_break' },
    { label: 'Setup', value: 'setup' }
];

/**
 * Status options for dropdowns.
 */
export const STATUS_OPTIONS: { label: string; value: PresenceStatus; severity: string }[] = [
    { label: 'Pending', value: 'pending', severity: 'warning' },
    { label: 'Confirmed', value: 'confirmed', severity: 'info' },
    { label: 'Approved', value: 'approved', severity: 'success' },
    { label: 'Rejected', value: 'rejected', severity: 'danger' }
];

/**
 * Source options for dropdowns.
 */
export const SOURCE_OPTIONS: { label: string; value: PresenceSource; severity: string }[] = [
    { label: 'Auto (Production)', value: 'auto', severity: 'info' },
    { label: 'Manual', value: 'manual', severity: 'warning' }
];

/**
 * Get severity class for status tag.
 */
export function getStatusSeverity(status: PresenceStatus): string {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.severity || 'info';
}

/**
 * Get severity class for source tag.
 */
export function getSourceSeverity(source: PresenceSource): string {
    const option = SOURCE_OPTIONS.find(o => o.value === source);
    return option?.severity || 'info';
}
