import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProductionService } from './production.service';
import { ExportService } from '../../core/services/export.service';
import {
    HourlyProduction,
    Project,
    ProductionLine,
    Part,
    Shift
} from '../../core/models';

interface ProductionListItem extends HourlyProduction {
    projectName?: string;
    lineName?: string;
    partNumber?: string;
    shiftName?: string;
    efficiency?: number;
}

@Component({
    selector: 'app-production-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DatePickerModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        TooltipModule,
        MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './production-list.component.html',
    styleUrls: ['./production-list.component.scss']
})
export class ProductionListComponent implements OnInit {
    productions: ProductionListItem[] = [];
    filteredProductions: ProductionListItem[] = [];

    // Filters
    filterDate: Date | null = null;
    filterShift: Shift | null = null;
    filterProject: Project | null = null;
    filterLine: ProductionLine | null = null;
    filterPart: Part | null = null;
    globalFilterValue = '';

    // Filter options
    shifts: Shift[] = [];
    projects: Project[] = [];
    productionLines: ProductionLine[] = [];
    parts: Part[] = [];

    isLoading = false;

    // Export menu items
    exportMenuItems: MenuItem[] = [
        {
            label: 'Export to Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportData()
        },
        {
            label: 'Export to CSV',
            icon: 'pi pi-file',
            command: () => this.exportToCsv()
        }
    ];

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        this.loadAllReferenceData();
    }

    loadAllReferenceData(): void {
        // Load all reference data first, then load productions
        this.productionService.getShifts().subscribe(shifts => {
            this.shifts = shifts;
        });

        this.productionService.getProjects().subscribe(projects => {
            this.projects = projects;
            // Load productions after we have projects data
            this.loadProductions();
        });
    }

    loadFilterOptions(): void {
        this.productionService.getShifts().subscribe(shifts => this.shifts = shifts);
        this.productionService.getProjects().subscribe(projects => this.projects = projects);
    }

    loadProductions(): void {
        this.isLoading = true;

        const params: any = {};

        if (this.filterDate) {
            // Format date without timezone conversion
            const year = this.filterDate.getFullYear();
            const month = String(this.filterDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.filterDate.getDate()).padStart(2, '0');
            params.date = `${year}-${month}-${day}`;
        }
        if (this.filterShift) {
            params.shift = this.filterShift.id;
        }
        if (this.filterLine) {
            params.lineId = this.filterLine.id;
        }
        if (this.filterPart) {
            params.partId = this.filterPart.Id_Part;
        }

        console.log('Loading productions with params:', params);

        this.productionService.getHourlyProductions(params).subscribe({
            next: (productions) => {
                // Enrich productions with reference data
                this.productions = productions.map(p => this.enrichProduction(p));
                this.filteredProductions = [...this.productions];

                // Load details for each production
                this.productions.forEach(p => this.loadProductionDetails(p));

                this.isLoading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.detail || 'Failed to load production records'
                });
                this.isLoading = false;
            }
        });
    }

    onFilterChange(): void {
        if (this.filterProject) {
            this.productionService.getProductionLines(this.filterProject.Id_Project)
                .subscribe(lines => this.productionLines = lines);
            this.productionService.getParts(this.filterProject.Id_Project)
                .subscribe(parts => this.parts = parts);
        } else {
            this.productionLines = [];
            this.parts = [];
            this.filterLine = null;
            this.filterPart = null;
        }

        this.loadProductions();
    }

    applyGlobalFilter(event: Event): void {
        const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
        this.filteredProductions = this.productions.filter(p => {
            return (
                p.projectName?.toLowerCase().includes(filterValue) ||
                p.lineName?.toLowerCase().includes(filterValue) ||
                p.partNumber?.toLowerCase().includes(filterValue) ||
                p.shiftName?.toLowerCase().includes(filterValue)
            );
        });
    }

    clearFilters(): void {
        this.filterDate = null;
        this.filterShift = null;
        this.filterProject = null;
        this.filterLine = null;
        this.filterPart = null;
        this.globalFilterValue = '';
        this.productionLines = [];
        this.parts = [];
        this.loadProductions();
    }

    getEfficiencySeverity(efficiency: number): 'success' | 'info' | 'warn' | 'danger' {
        if (efficiency >= 100) return 'success';
        if (efficiency >= 90) return 'info';
        if (efficiency >= 80) return 'warn';
        return 'danger';
    }

    viewDetails(production: ProductionListItem): void {
        // Navigate to production entry with all data to pre-fill the form
        this.router.navigate(['/dms-production/production'], {
            queryParams: {
                id: production.Id_HourlyProd,
                date: production.Date_HourlyProd,
                shift: production.Shift_HourlyProd,
                line: production.Id_ProdLine,
                part: production.Id_Part,
                hour: production.Hour_HourlyProd,
                mode: 'view'
            }
        });
    }

    editProduction(production: ProductionListItem): void {
        // Navigate to production entry with all data to pre-fill the form
        this.router.navigate(['/dms-production/production'], {
            queryParams: {
                id: production.Id_HourlyProd,
                date: production.Date_HourlyProd,
                shift: production.Shift_HourlyProd,
                line: production.Id_ProdLine,
                part: production.Id_Part,
                hour: production.Hour_HourlyProd,
                mode: 'edit'
            }
        });
    }

    deleteProduction(production: ProductionListItem): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this production record (${production.Date_HourlyProd} - Hour ${production.Hour_HourlyProd})?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.productionService.deleteHourlyProduction(production.Id_HourlyProd).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Production record deleted successfully'
                        });
                        this.loadProductions();
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.detail || 'Failed to delete production record'
                        });
                    }
                });
            }
        });
    }

    newProduction(): void {
        this.router.navigate(['/dms-production/production']);
    }

    exportData(): void {
        if (this.filteredProductions.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No production records to export'
            });
            return;
        }

        // Prepare export data with readable column names
        const exportData = this.filteredProductions.map(p => ({
            'Date': this.formatDate(p.Date_HourlyProd),
            'Shift': p.shiftName || p.Shift_HourlyProd,
            'Hour': p.Hour_HourlyProd,
            'Time': this.formatTime(p.Hour_HourlyProd, p.Shift_HourlyProd),
            'Project': p.projectName || '',
            'Production Line': p.lineName || '',
            'Part Number': p.partNumber || '',
            'Output': p.Result_HourlyProdPN,
            'Target': p.Target_HourlyProdPN,
            'Efficiency (%)': p.efficiency || 0,
            'Headcount': p.HC_HourlyProdPN
        }));

        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(exportData, `production-export-${timestamp}`, 'Production Data');

        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${exportData.length} records exported to Excel`
        });
    }

    exportToCsv(): void {
        if (this.filteredProductions.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No production records to export'
            });
            return;
        }

        const exportData = this.filteredProductions.map(p => ({
            'Date': this.formatDate(p.Date_HourlyProd),
            'Shift': p.shiftName || p.Shift_HourlyProd,
            'Hour': p.Hour_HourlyProd,
            'Time': this.formatTime(p.Hour_HourlyProd, p.Shift_HourlyProd),
            'Project': p.projectName || '',
            'Production Line': p.lineName || '',
            'Part Number': p.partNumber || '',
            'Output': p.Result_HourlyProdPN,
            'Target': p.Target_HourlyProdPN,
            'Efficiency (%)': p.efficiency || 0,
            'Headcount': p.HC_HourlyProdPN
        }));

        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(exportData, `production-export-${timestamp}`);

        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${exportData.length} records exported to CSV`
        });
    }

    formatDate(date: Date): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(hour: number, shiftId?: number | string): string {
        // Get shift start hour based on shift ID
        const shiftStartHour = this.getShiftStartHour(shiftId);
        // Calculate actual start and end hours based on shift start + hour offset
        const startHour = (shiftStartHour + hour - 1) % 24;
        const endHour = (shiftStartHour + hour) % 24;
        return `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
    }

    getShiftStartHour(shiftId?: number | string): number {
        if (!shiftId) return 6; // Default to morning shift

        // Find shift from loaded shifts
        const shift = this.shifts.find(s => String(s.id) === String(shiftId));
        if (shift?.startHour !== undefined) {
            return shift.startHour;
        }

        // Fallback to default shift hours
        const shiftMap: Record<string, number> = {
            '1': 6,  // Morning: 06:00
            '2': 14, // Afternoon: 14:00
            '3': 22  // Night: 22:00
        };
        return shiftMap[String(shiftId)] || 6;
    }

    enrichProduction(production: ProductionListItem): ProductionListItem {
        // Calculate efficiency
        const efficiency = production.Target_HourlyProdPN > 0
            ? Math.round((production.Result_HourlyProdPN / production.Target_HourlyProdPN) * 100)
            : 0;

        // Find shift name (compare as strings since Shift_HourlyProd may be string or number)
        const shift = this.shifts.find(s => String(s.id) === String(production.Shift_HourlyProd));
        const shiftName = shift?.name || production.Shift_HourlyProd?.toString();

        // We need to load project, line and part names from the IDs
        // For now, return the production with calculated fields
        return {
            ...production,
            efficiency,
            shiftName
        };
    }

    loadProductionDetails(production: ProductionListItem): void {
        // Load project name
        if (production.Id_ProdLine) {
            this.productionService.getProductionLines().subscribe(lines => {
                const line = lines.find(l => l.id === production.Id_ProdLine);
                if (line) {
                    production.lineName = line.name;

                    // Load project name from the line's project ID
                    const project = this.projects.find(p => p.Id_Project === line.projectId);
                    if (project) {
                        production.projectName = project.Name_Project;
                    }
                }
            });
        }

        // Load part number
        if (production.Id_Part) {
            this.productionService.getParts().subscribe(parts => {
                const part = parts.find(p => p.Id_Part === production.Id_Part);
                if (part) {
                    production.partNumber = part.PN_Part;
                }
            });
        }
    }
}
