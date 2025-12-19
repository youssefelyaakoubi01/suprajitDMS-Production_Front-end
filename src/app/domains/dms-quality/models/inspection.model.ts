/**
 * DMS-Quality Models - Inspection
 * Domain: Quality Control Management
 */

// ==================== QUALITY INSPECTION ====================
export interface QualityInspection {
    Id_Inspection: number;
    Date_Inspection: string;
    Shift_Inspection: string;
    Id_Part: number;
    Id_ProdLine: number;
    SampleSize: number;
    DefectCount: number;
    InspectionResult: 'pass' | 'fail' | 'conditional';
    Inspector_Name: string;
    Comments?: string;
}

// ==================== INSPECTION RESULT ====================
export type InspectionResult = 'pass' | 'fail' | 'conditional';

export const InspectionResultLabels: Record<InspectionResult, string> = {
    pass: 'Conforme',
    fail: 'Non conforme',
    conditional: 'Conditionnel'
};

export const InspectionResultColors: Record<InspectionResult, string> = {
    pass: '#10B981',      // success
    fail: '#EF4444',      // danger
    conditional: '#F59E0B' // warning
};

// ==================== QUALITY STATS ====================
export interface QualityStats {
    totalInspections: number;
    passRate: number;
    defectRate: number;
    defectsByCategory: { category: string; count: number }[];
    defectsByType: { type: string; count: number }[];
    trendData: { date: string; defectRate: number }[];
}

// ==================== QUALITY ALERT ====================
export interface QualityAlert {
    id: number;
    type: 'defect_spike' | 'inspection_fail' | 'threshold_breach';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    partNumber?: string;
    productionLine?: string;
    createdAt: Date;
    isAcknowledged: boolean;
}
