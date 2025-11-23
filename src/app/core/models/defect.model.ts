export interface Defect {
    id_defect: number;
    qty_defect: number;
    id_workstation: number;
    Id_DefectList: number;
    Id_HourlyProd: number;
    datedefect: Date;
}

export interface DefectList {
    Id_DefectList: number;
    Code_Defect: string;
    Description_Defect: string;
    id_workstation: number;
    Category_Defect?: string;
}

export interface QualityMetrics {
    ppm: number;
    ftq: number;
    scrapRate: number;
    totalDefects: number;
    totalOutput: number;
}

export interface DefectAnalysis {
    defectType: string;
    count: number;
    percentage: number;
    trend: number;
}
