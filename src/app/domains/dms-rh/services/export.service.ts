/**
 * DMS-RH Export Service
 * Domain: Human Resources Management
 * Handles Excel export functionality for HR data
 */
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Employee } from '../models/employee.model';
import { Formation, FormationPlan } from '../models/formation.model';
import { Team, TeamStats } from '../models/team.model';
import { Qualification } from '../models/qualification.model';

export interface ExportColumn {
    header: string;
    field: string;
    width?: number;
    format?: (value: any) => any;
}

export interface ExportOptions {
    filename: string;
    sheetName?: string;
    columns?: ExportColumn[];
}

@Injectable({
    providedIn: 'root'
})
export class DmsExportService {

    /**
     * Export employees to Excel
     */
    exportEmployees(employees: Employee[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'Id_Emp', width: 8 },
                { header: 'Badge Number', field: 'BadgeNumber', width: 15 },
                { header: 'Last Name', field: 'Nom_Emp', width: 20 },
                { header: 'First Name', field: 'Prenom_Emp', width: 20 },
                { header: 'Gender', field: 'Genre_Emp', width: 10, format: this.formatGender },
                { header: 'Category', field: 'Categorie_Emp', width: 15 },
                { header: 'Department', field: 'Departement_Emp', width: 20 },
                { header: 'Team', field: 'team.name', width: 20 },
                { header: 'Status', field: 'EmpStatus', width: 12 },
                { header: 'Birth Date', field: 'DateNaissance_Emp', width: 12, format: this.formatDate },
                { header: 'Hire Date', field: 'DateEmbauche_Emp', width: 12, format: this.formatDate },
                { header: 'Transport Route', field: 'trajet.name', width: 20 },
                { header: 'Team Leader ID', field: 'TeamLeaderID', width: 15 },
                { header: 'Created By', field: 'CreatedBy', width: 15 },
                { header: 'Created Date', field: 'CreatedDate', width: 12, format: this.formatDate },
                { header: 'Changed By', field: 'ChangedBy', width: 15 },
                { header: 'Changed Date', field: 'ChangedDate', width: 12, format: this.formatDate }
            ];

            this.exportToExcel(employees, columns, {
                filename: options?.filename || 'employees_export',
                sheetName: options?.sheetName || 'Employees'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export formations to Excel
     */
    exportFormations(formations: Formation[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'id', width: 10 },
                { header: 'Formation Name', field: 'name', width: 30 },
                { header: 'Type', field: 'type', width: 15 },
                { header: 'Process', field: 'process_name', width: 20 },
                { header: 'Duration (hours)', field: 'duration_hours', width: 15 },
                { header: 'Description', field: 'description', width: 40 },
                { header: 'Active', field: 'is_active', width: 10, format: (v) => v ? 'Yes' : 'No' }
            ];

            this.exportToExcel(formations, columns, {
                filename: options?.filename || 'formations_export',
                sheetName: options?.sheetName || 'Formations'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export formation plans to Excel
     */
    exportFormationPlans(plans: FormationPlan[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'Id_Plan', width: 10 },
                { header: 'Formation', field: 'Formation.name', width: 30 },
                { header: 'Employee First Name', field: 'Employee.Prenom_Emp', width: 20 },
                { header: 'Employee Last Name', field: 'Employee.Nom_Emp', width: 20 },
                { header: 'Planned Date', field: 'planned_date', width: 15, format: this.formatDate },
                { header: 'Status', field: 'status', width: 15, format: this.formatStatus },
                { header: 'Notes', field: 'notes', width: 30 }
            ];

            this.exportToExcel(plans, columns, {
                filename: options?.filename || 'formation_plans_export',
                sheetName: options?.sheetName || 'Formation Plans'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export teams to Excel
     */
    exportTeams(teams: Team[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'id', width: 10 },
                { header: 'Code', field: 'code', width: 15 },
                { header: 'Team Name', field: 'name', width: 25 },
                { header: 'Description', field: 'description', width: 40 }
            ];

            this.exportToExcel(teams, columns, {
                filename: options?.filename || 'teams_export',
                sheetName: options?.sheetName || 'Teams'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export team statistics to Excel
     */
    exportTeamStats(stats: TeamStats[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'Team ID', field: 'teamId', width: 10 },
                { header: 'Team Name', field: 'teamName', width: 25 },
                { header: 'Member Count', field: 'memberCount', width: 18 },
                { header: 'Avg Versatility', field: 'avgVersatility', width: 18, format: (v) => `${v}%` },
                { header: 'Qualification Rate', field: 'qualificationRate', width: 18, format: (v) => `${v}%` }
            ];

            this.exportToExcel(stats, columns, {
                filename: options?.filename || 'team_stats_export',
                sheetName: options?.sheetName || 'Team Stats'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export qualifications to Excel
     */
    exportQualifications(qualifications: Qualification[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'id_qualif', width: 10 },
                { header: 'Employee ID', field: 'Id_Emp', width: 12 },
                { header: 'Formation ID', field: 'id_formation', width: 12 },
                { header: 'Start Date', field: 'start_qualif', width: 15, format: this.formatDate },
                { header: 'End Date', field: 'end_qualif', width: 15, format: this.formatDate },
                { header: 'Test Result', field: 'test_result', width: 15 },
                { header: 'Trainer', field: 'Trainer', width: 20 },
                { header: 'Project ID', field: 'Id_Project', width: 12 }
            ];

            this.exportToExcel(qualifications, columns, {
                filename: options?.filename || 'qualifications_export',
                sheetName: options?.sheetName || 'Qualifications'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export attendance records to Excel
     */
    exportAttendance(attendance: any[], options?: Partial<ExportOptions>): void {
        try {
            const columns: ExportColumn[] = options?.columns || [
                { header: 'ID', field: 'Id_Attendance', width: 10 },
                { header: 'Employee ID', field: 'Id_Emp', width: 12 },
                { header: 'Employee Last Name', field: 'Employee.Nom_Emp', width: 20 },
                { header: 'Employee First Name', field: 'Employee.Prenom_Emp', width: 20 },
                { header: 'Date', field: 'Date_Attendance', width: 15, format: this.formatDate },
                { header: 'Shift', field: 'Shift_Attendance', width: 10 },
                { header: 'Check In', field: 'CheckIn', width: 18, format: this.formatDateTime },
                { header: 'Check Out', field: 'CheckOut', width: 18, format: this.formatDateTime },
                { header: 'Status', field: 'Status', width: 12 }
            ];

            this.exportToExcel(attendance, columns, {
                filename: options?.filename || 'attendance_export',
                sheetName: options?.sheetName || 'Attendance'
            });
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Generic export method for any data
     */
    exportGeneric<T>(data: T[], columns: ExportColumn[], options: ExportOptions): void {
        try {
            this.exportToExcel(data, columns, options);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }

    /**
     * Export data to Excel file
     */
    private exportToExcel<T>(data: T[], columns: ExportColumn[], options: { filename: string; sheetName?: string }): void {
        // Prepare headers
        const headers = columns.map(col => col.header);

        // Prepare rows
        const rows = data.map(item => {
            return columns.map(col => {
                let value = this.getNestedValue(item, col.field);
                if (col.format && value !== null && value !== undefined) {
                    value = col.format(value);
                }
                return value ?? '';
            });
        });

        // Create worksheet data with headers
        const wsData = [headers, ...rows];

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');

        // Generate filename with date
        const filename = `${options.filename}_${this.getDateSuffix()}.xlsx`;

        // Write to buffer and trigger download
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.saveAsExcelFile(excelBuffer, filename);
    }

    /**
     * Save buffer as Excel file (browser download)
     */
    private saveAsExcelFile(buffer: any, filename: string): void {
        const data: Blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Create download link
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(data);
        link.download = filename;

        // Trigger download
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(link.href);
    }

    /**
     * Get nested object value using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        if (!obj || !path) return null;
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : null;
        }, obj);
    }

    /**
     * Format date for Excel
     */
    private formatDate = (value: any): string => {
        if (!value) return '';
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return String(value);
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return String(value);
        }
    }

    /**
     * Format datetime for Excel
     */
    private formatDateTime = (value: any): string => {
        if (!value) return '';
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return String(value);
            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return String(value);
        }
    }

    /**
     * Format gender for display
     */
    private formatGender = (value: string): string => {
        if (!value) return '';
        const genderMap: Record<string, string> = {
            'M': 'Male',
            'F': 'Female',
            'Male': 'Male',
            'Female': 'Female'
        };
        return genderMap[value] || value;
    }

    /**
     * Format status for display
     */
    private formatStatus = (value: string): string => {
        if (!value) return '';
        const statusMap: Record<string, string> = {
            'planned': 'Planned',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'active': 'Active',
            'inactive': 'Inactive',
            'present': 'Present',
            'absent': 'Absent',
            'late': 'Late',
            'leave': 'On Leave'
        };
        return statusMap[value] || value;
    }

    /**
     * Get date suffix for filename
     */
    private getDateSuffix(): string {
        const now = new Date();
        return now.toISOString().slice(0, 10).replace(/-/g, '');
    }

    // ==========================================
    // CSV Export Methods
    // ==========================================

    /**
     * Export employees to CSV
     */
    exportEmployeesToCsv(employees: Employee[], filename?: string): void {
        const data = employees.map(emp => ({
            'ID': emp.Id_Emp,
            'Badge Number': emp.BadgeNumber || '',
            'Last Name': emp.Nom_Emp,
            'First Name': emp.Prenom_Emp,
            'Gender': this.formatGender(emp.Genre_Emp),
            'Category': emp.Categorie_Emp,
            'Department': emp.Departement_Emp,
            'Team': (emp as any).team?.name || '',
            'Status': emp.EmpStatus,
            'Birth Date': this.formatDate(emp.DateNaissance_Emp),
            'Hire Date': this.formatDate(emp.DateEmbauche_Emp),
            'Transport Route': (emp as any).trajet?.name || '',
            'Team Leader ID': (emp as any).TeamLeaderID || '',
            'Created By': (emp as any).CreatedBy || (emp as any).created_by || '',
            'Created Date': this.formatDate((emp as any).CreatedDate),
            'Changed By': (emp as any).ChangedBy || (emp as any).changed_by || '',
            'Changed Date': this.formatDate((emp as any).ChangedDate)
        }));
        this.exportToCsv(data, filename || `employees_export_${this.getDateSuffix()}`);
    }

    /**
     * Export formations to CSV
     */
    exportFormationsToCsv(formations: Formation[], filename?: string): void {
        const data = formations.map(f => ({
            'ID': f.id || '',
            'Name': f.name || '',
            'Type': f.type || '',
            'Process': f.process_name || '',
            'Duration (hours)': f.duration_hours || '',
            'Description': f.description || '',
            'Active': f.is_active ? 'Yes' : 'No'
        }));
        this.exportToCsv(data, filename || `formations_export_${this.getDateSuffix()}`);
    }

    /**
     * Export teams to CSV
     */
    exportTeamsToCsv(teams: Team[], filename?: string): void {
        const data = teams.map(t => ({
            'ID': t.id || '',
            'Code': t.code || '',
            'Name': t.name || '',
            'Description': t.description || ''
        }));
        this.exportToCsv(data, filename || `teams_export_${this.getDateSuffix()}`);
    }

    /**
     * Export qualifications to CSV
     */
    exportQualificationsToCsv(qualifications: Qualification[], filename?: string): void {
        const data = qualifications.map(q => ({
            'ID': q.id_qualif,
            'Employee ID': q.Id_Emp,
            'Formation ID': q.id_formation,
            'Start Date': this.formatDate(q.start_qualif),
            'End Date': this.formatDate(q.end_qualif),
            'Test Result': q.test_result,
            'Trainer': q.Trainer,
            'Project ID': q.Id_Project
        }));
        this.exportToCsv(data, filename || `qualifications_export_${this.getDateSuffix()}`);
    }

    /**
     * Generic CSV export method
     */
    exportGenericToCsv<T>(data: T[], columns: ExportColumn[], filename: string): void {
        const csvData = data.map(item => {
            const row: Record<string, any> = {};
            columns.forEach(col => {
                let value = this.getNestedValue(item, col.field);
                if (col.format && value !== null && value !== undefined) {
                    value = col.format(value);
                }
                row[col.header] = value ?? '';
            });
            return row;
        });
        this.exportToCsv(csvData, filename);
    }

    /**
     * Export data array to CSV file
     */
    exportToCsv(data: any[], filename: string): void {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            // Header row
            headers.join(';'),
            // Data rows
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header] ?? '';
                    const stringValue = String(value);
                    // Escape quotes and wrap in quotes if contains separator, quote, or newline
                    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(';')
            )
        ].join('\n');

        // Create and download file with BOM for Excel compatibility
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }
}
