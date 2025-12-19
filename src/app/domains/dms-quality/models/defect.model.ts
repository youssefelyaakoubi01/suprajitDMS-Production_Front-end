/**
 * DMS-Quality Models - Defect
 * Domain: Quality Control Management
 */

// ==================== DEFECT CATEGORY ====================
export interface DefectCategory {
    Id_DefectCategory: number;
    Name_DefectCategory: string;
    Description_DefectCategory?: string;
}

// ==================== DEFECT TYPE ====================
export interface DefectType {
    Id_DefectType: number;
    Code_DefectType: string;
    Description_DefectType: string;
    Id_DefectCategory: number;
    Severity_DefectType: 'minor' | 'major' | 'critical';
    category?: DefectCategory;
}

// ==================== QUALITY DEFECT ====================
export interface QualityDefect {
    Id_Defect: number;
    Qty_Defect: number;
    Id_DefectType: number;
    Id_HourlyProd: number;
    DateDefect: string;
    Comment_Defect?: string;
    defect_type?: DefectType;
}

// ==================== DEFECT CREATE ====================
export interface DefectCreatePayload {
    Qty_Defect: number;
    Id_DefectType: number;
    Id_HourlyProd: number;
    Comment_Defect?: string;
}

// ==================== DEFECT SEVERITY ====================
export type DefectSeverity = 'minor' | 'major' | 'critical';

export const DefectSeverityLabels: Record<DefectSeverity, string> = {
    minor: 'Mineur',
    major: 'Majeur',
    critical: 'Critique'
};

export const DefectSeverityColors: Record<DefectSeverity, string> = {
    minor: '#F59E0B',   // warning
    major: '#EF4444',   // danger
    critical: '#7C3AED' // purple
};

// ==================== LEGACY ALIAS ====================
// Alias for backward compatibility with old naming
export type Defect = QualityDefect;

// ==================== DEFECT SUMMARY ====================
export interface DefectSummary {
    code: string;
    description: string;
    workstation: string;
    quantity: number;
    percentage: number;
    severity: string;
}
