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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from './production.service';
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
        TooltipModule
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

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router
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
        // TODO: Implement export to Excel functionality
        this.messageService.add({
            severity: 'info',
            summary: 'Export',
            detail: 'Export functionality coming soon'
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

    formatTime(hour: number): string {
        const startHour = hour - 1;
        return `${startHour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:00`;
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
