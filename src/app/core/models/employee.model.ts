export interface Employee {
    Id_Emp: number;
    Nom_Emp: string;
    Prenom_Emp: string;
    DateNaissance_Emp: Date;
    Genre_Emp: string;
    Categorie_Emp: string;
    DateEmbauche_Emp: Date;
    Departement_Emp: string;
    Picture: string;
    EmpStatus: string;
    TeamLeaderID?: number;
    BadgeNumber?: string;
}

export interface Qualification {
    id_qualif: number;
    start_qualif: Date;
    end_qualif: Date;
    id_formation: number;
    test_result: string;
    Id_Emp: number;
    Trainer: string;
    Id_Project: number;
}

export interface Formation {
    id_formation: number;
    name_formation: string;
    type_formation: string;
    id_process: number;
}

export interface Process {
    id_process: number;
    name_process: string;
    description_process: string;
}

export interface Attendance {
    Id_Attendance: number;
    Id_Emp: number;
    Date_Attendance: Date;
    Shift_Attendance: string;
    CheckIn: Date;
    CheckOut?: Date;
    Status: 'present' | 'absent' | 'late' | 'leave';
}

export interface EmployeeWithAssignment extends Employee {
    workstation?: string;
    qualification?: string;
    qualificationLevel?: number;
}
