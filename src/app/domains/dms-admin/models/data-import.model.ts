/**
 * Data Import Models
 * Domain: DMS-Admin
 *
 * Interfaces for Excel data import functionality
 * Endpoint: /api/data-import/
 */

// ==================== STATUS & DISCOVERY ====================

export interface ImportFile {
    file_path: string;
    file_name: string;
    estimated_rows: number;
}

export interface ImportMappingStatus {
    name: string;
    model: string;
    file_pattern: string;
    file_found: boolean;
    file_path?: string;
    estimated_rows?: number;
}

export interface ImportStatus {
    source_directory?: string;
    available_files: string[];
    mappings: ImportMappingStatus[];
}

// ==================== MAPPING DETAILS ====================

export interface MappingField {
    excel_column: string;
    target_field: string;
    type: string;
    required: boolean;
    unique: boolean;
    default?: string;
    fk_model?: string;
    fk_lookup?: string;
}

export interface ImportMapping {
    name: string;
    model: string;
    file_pattern: string;
    sheet_name: string | number;
    unique_fields: string[];
    update_on_duplicate: boolean;
    skip_duplicates?: boolean;
    field_count: number;
    fields: MappingField[] | string[];
    computed_fields?: string[];
}

// ==================== PREVIEW ====================

export interface PreviewData {
    mapping_name: string;
    file_path: string;
    sheet_name: string | number;
    total_rows: number;
    preview_limit: number;
    columns: string[];
    data: Record<string, unknown>[];
}

// ==================== VALIDATION ====================

export interface ValidationError {
    row_number: number;
    field: string;
    message: string;
    value?: string;
}

export interface ValidationResult {
    mapping_name: string;
    validation_status: 'success' | 'failed' | 'warnings';
    total_rows_validated: number;
    valid_rows: number;
    invalid_rows: number;
    errors: ValidationError[];
    warnings: ValidationError[];
}

// ==================== IMPORT RESULTS ====================

export interface ImportResult {
    mapping_name: string;
    model_name: string;
    file_path: string;
    total_rows: number;
    successful: number;
    failed: number;
    skipped: number;
    updated: number;
    created: number;
    errors: string[];
    warnings: string[];
    duration_seconds: number;
    error_count: number;
    warning_count: number;
}

export interface SequenceImportResult {
    dry_run: boolean;
    mappings_processed: number;
    total_created: number;
    total_updated: number;
    total_failed: number;
    results: ImportResult[];
}

// ==================== FILE UPLOAD ====================

export interface UploadResult {
    success: boolean;
    file_name: string;
    file_path: string;
    file_size?: number;
    replaced?: boolean;
    message?: string;
    error?: string;
}

export interface UploadedFile {
    name: string;
    size: number;
    modified: number;
    path: string;
}

export interface FileListResult {
    files: UploadedFile[];
    directory: string;
    count: number;
    message?: string;
}

export interface DeleteFileResult {
    success: boolean;
    file_name: string;
    message?: string;
    error?: string;
}

// ==================== MAPPING GROUPS ====================

export type ImportModule = 'hr' | 'tech' | 'operations' | 'all';

export const HR_MAPPINGS = [
    'DEPARTMENT_MAPPING',
    'FORMATEUR_MAPPING',
    'FORMATION_MAPPING',
    'PROCESS_MAPPING',
    'EMPLOYEE_MAPPING',
    'QUALIFICATION_MAPPING'
];

export const TECH_MAPPINGS = [
    'ZONE_MAPPING',
    'PROJECT_MAPPING',
    'PRODUCTION_LINE_MAPPING',
    'WORKSTATION_MAPPING',
    'MACHINE_MAPPING',
    'PART_MAPPING',
    'FINISHED_GOODS_MAPPING',
    'SHIFT_TARGET_MAPPING'
];

export const OPERATIONS_MAPPINGS = [
    'OUTPUT_SF_MAPPING',
    'MAINTENANCE_DOWNTIME_MAPPING'
];

export const ALL_MAPPINGS = [...HR_MAPPINGS, ...TECH_MAPPINGS, ...OPERATIONS_MAPPINGS];

// ==================== HELPERS ====================

export function getMappingModule(mappingName: string): ImportModule {
    if (HR_MAPPINGS.includes(mappingName)) return 'hr';
    if (TECH_MAPPINGS.includes(mappingName)) return 'tech';
    if (OPERATIONS_MAPPINGS.includes(mappingName)) return 'operations';
    return 'all';
}

export function getMappingsByModule(module: ImportModule): string[] {
    switch (module) {
        case 'hr': return HR_MAPPINGS;
        case 'tech': return TECH_MAPPINGS;
        case 'operations': return OPERATIONS_MAPPINGS;
        default: return ALL_MAPPINGS;
    }
}

export const MODULE_CONFIG: Record<ImportModule, { label: string; icon: string; color: string }> = {
    hr: { label: 'Ressources Humaines', icon: 'pi pi-users', color: '#8B5CF6' },
    tech: { label: 'Configuration Technique', icon: 'pi pi-cog', color: '#3B82F6' },
    operations: { label: 'Operations', icon: 'pi pi-bolt', color: '#10B981' },
    all: { label: 'Tous', icon: 'pi pi-database', color: '#6B7280' }
};
