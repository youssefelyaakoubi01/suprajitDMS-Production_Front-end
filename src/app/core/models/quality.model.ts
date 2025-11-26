export interface DefectCategory {
    Id_DefectCategory: number;
    Name_DefectCategory: string;
    Description_DefectCategory?: string;
}

export interface DefectType {
    Id_DefectType: number;
    Code_DefectType: string;
    Description_DefectType: string;
    Id_DefectCategory: number;
    Severity_DefectType: string;
    category?: DefectCategory;
}

export interface QualityDefect {
    Id_Defect: number;
    Qty_Defect: number;
    Id_DefectType: number;
    Id_HourlyProd: number;
    DateDefect: string;
    Comment_Defect?: string;
    defect_type?: DefectType;
}

export interface QualityInspection {
    Id_Inspection: number;
    Date_Inspection: string;
    Shift_Inspection: string;
    Id_Part: number;
    Id_ProdLine: number;
    SampleSize: number;
    DefectCount: number;
    InspectionResult: string;
    Inspector_Name: string;
    Comments?: string;
}
