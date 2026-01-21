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
import { DrawerModule } from 'primeng/drawer';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { AccordionModule } from 'primeng/accordion';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
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
    orderNo?: string;
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
        MenuModule,
        DrawerModule,
        SkeletonModule,
        DividerModule,
        AccordionModule,
        AvatarModule,
        ProgressBarModule,
        DialogModule,
        InputNumberModule
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
    allProductionLines: ProductionLine[] = []; // Store all lines for independent filtering
    parts: Part[] = [];
    allParts: Part[] = []; // Store all parts for independent filtering

    isLoading = false;

    // Detail Preview Drawer
    showDetailDrawer = false;
    selectedProduction: ProductionListItem | null = null;
    isLoadingDetails = false;

    // Detail data for drawer
    detailTeamMembers: { name: string; workstation: string; badge: string }[] = [];
    detailDowntimes: { duration: number; problem: string; comment: string }[] = [];
    detailHourlyData: { hour: number; output: number; target: number; efficiency: number }[] = [];

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

    // Edit Production Dialog
    showEditDialog = false;
    editingProduction: ProductionListItem | null = null;
    isAdvancedMode = false;
    editForm = {
        output: 0,
        target: 0,
        headcount: 0,
        scrap: 0,
        orderNo: ''
    };
    // Champs avancés éditables
    editAdvanced = {
        date: null as Date | null,
        shift: null as Shift | null,
        line: null as ProductionLine | null,
        part: null as Part | null
    };
    isSaving = false;

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

        // Load all production lines for independent filtering
        this.productionService.getProductionLines().subscribe(lines => {
            this.allProductionLines = lines;
            this.productionLines = lines; // Initially show all lines
        });

        // Load all parts for independent filtering
        this.productionService.getParts().subscribe(parts => {
            this.allParts = parts;
            this.parts = parts; // Initially show all parts
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
        if (this.filterProject) {
            params.projectId = this.filterProject.Id_Project;
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
            // Filter lines and parts by selected project
            this.productionLines = this.allProductionLines.filter(
                line => line.projectId === this.filterProject!.Id_Project
            );
            this.parts = this.allParts.filter(
                part => part.Id_Project === this.filterProject!.Id_Project
            );
            // Clear line/part selection if not in filtered list
            if (this.filterLine && !this.productionLines.find(l => l.id === this.filterLine!.id)) {
                this.filterLine = null;
            }
            if (this.filterPart && !this.parts.find(p => p.Id_Part === this.filterPart!.Id_Part)) {
                this.filterPart = null;
            }
        } else {
            // Show all lines and parts when no project selected
            this.productionLines = this.allProductionLines;
            this.parts = this.allParts;
        }

        this.loadProductions();
    }

    onLineFilterChange(): void {
        // When a line is selected, auto-select its project
        if (this.filterLine && !this.filterProject) {
            const project = this.projects.find(p => p.Id_Project === this.filterLine!.projectId);
            if (project) {
                this.filterProject = project;
                // Filter parts by project
                this.parts = this.allParts.filter(
                    part => part.Id_Project === project.Id_Project
                );
            }
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
        // Reset to show all lines and parts
        this.productionLines = this.allProductionLines;
        this.parts = this.allParts;
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
        // Pré-remplir le formulaire avec les données existantes - pas de navigation!
        this.editingProduction = { ...production };
        this.isAdvancedMode = false;
        this.editForm = {
            output: production.Result_HourlyProdPN || 0,
            target: production.Target_HourlyProdPN || 0,
            headcount: production.HC_HourlyProdPN || 0,
            scrap: production.Scrap_HourlyProdPN || 0,
            orderNo: production.orderNo || ''
        };
        // Pré-remplir les champs avancés
        this.editAdvanced = {
            date: production.Date_HourlyProd ? new Date(production.Date_HourlyProd) : null,
            shift: this.shifts.find(s => String(s.id) === String(production.Shift_HourlyProd)) || null,
            line: this.allProductionLines.find(l => l.id === production.Id_ProdLine) || null,
            part: this.allParts.find(p => p.Id_Part === production.Id_Part) || null
        };
        this.showEditDialog = true;
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

    // ==========================================
    // Edit Production Dialog Methods
    // ==========================================

    saveEditedProduction(): void {
        if (!this.editingProduction) return;

        this.isSaving = true;

        const updateData: any = {
            result: this.editForm.output,
            scrap: this.editForm.scrap,
            order_no: this.editForm.orderNo
        };

        // Si mode avancé, inclure les champs modifiés
        if (this.isAdvancedMode) {
            if (this.editAdvanced.date) {
                const d = this.editAdvanced.date;
                updateData.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            if (this.editAdvanced.shift) {
                updateData.shift = this.editAdvanced.shift.id;
            }
            if (this.editAdvanced.line) {
                updateData.production_line = this.editAdvanced.line.id;
            }
            if (this.editAdvanced.part) {
                updateData.part = this.editAdvanced.part.Id_Part;
            }
        } else {
            // Mode simple - garder les valeurs originales
            updateData.date = this.editingProduction.Date_HourlyProd;
            updateData.shift = this.editingProduction.Shift_HourlyProd;
            updateData.hour = this.editingProduction.Hour_HourlyProd;
            updateData.part = this.editingProduction.Id_Part;
            updateData.production_line = this.editingProduction.Id_ProdLine;
        }

        this.productionService.updateHourlyProduction(
            this.editingProduction.Id_HourlyProd,
            updateData
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: 'Enregistrement mis à jour avec succès'
                });
                this.hideEditDialog();
                this.loadProductions();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: error.error?.detail || 'Échec de la mise à jour'
                });
                this.isSaving = false;
            }
        });
    }

    hideEditDialog(): void {
        this.showEditDialog = false;
        this.editingProduction = null;
        this.isAdvancedMode = false;
        this.isSaving = false;
    }

    toggleAdvancedMode(): void {
        this.isAdvancedMode = !this.isAdvancedMode;
    }

    openFullEditor(): void {
        if (this.editingProduction) {
            const production = this.editingProduction;
            this.hideEditDialog();
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
    }

    getEditEfficiency(): number {
        return this.editForm.target > 0
            ? Math.round((this.editForm.output / this.editForm.target) * 100)
            : 0;
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
            shiftName,
            orderNo: (production as any).order_no || production.orderNo
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

    // ==========================================
    // Detail Preview Drawer Methods
    // ==========================================

    openDetailPreview(production: ProductionListItem): void {
        this.selectedProduction = production;
        this.showDetailDrawer = true;
        this.isLoadingDetails = true;
        this.loadProductionDetailData(production);
    }

    closeDetailPreview(): void {
        this.showDetailDrawer = false;
        this.selectedProduction = null;
        this.detailTeamMembers = [];
        this.detailDowntimes = [];
        this.detailHourlyData = [];
    }

    loadProductionDetailData(production: ProductionListItem): void {
        const hourlyProdId = production.Id_HourlyProd;

        // Load team assignments
        this.productionService.getTeamAssignments(hourlyProdId).subscribe({
            next: (assignments: any[]) => {
                this.detailTeamMembers = assignments.map(a => ({
                    name: a.employee_name || 'Unknown Employee',
                    workstation: a.workstation_name || '-',
                    badge: a.employee_id || '-'
                }));
                this.isLoadingDetails = false;
            },
            error: () => {
                this.detailTeamMembers = [];
                this.isLoadingDetails = false;
            }
        });

        // Load downtimes
        this.productionService.getDowntimes(hourlyProdId).subscribe({
            next: (downtimes: any[]) => {
                this.detailDowntimes = downtimes.map(d => ({
                    duration: d.Total_Downtime || d.duration || 0,
                    problem: d.problem_name || 'Unknown',
                    comment: d.Comment_Downtime || d.comment || ''
                }));
            },
            error: () => this.detailDowntimes = []
        });

        // Load shift hourly data
        this.loadShiftHourlyData(production);
    }

    loadShiftHourlyData(production: ProductionListItem): void {
        const dateStr = production.Date_HourlyProd instanceof Date
            ? production.Date_HourlyProd.toISOString().split('T')[0]
            : String(production.Date_HourlyProd).split('T')[0];

        this.productionService.getHourlyProductions({
            date: dateStr,
            shift: production.Shift_HourlyProd,
            lineId: production.Id_ProdLine,
            partId: production.Id_Part
        }).subscribe({
            next: (productions) => {
                this.detailHourlyData = productions
                    .sort((a, b) => a.Hour_HourlyProd - b.Hour_HourlyProd)
                    .map(p => ({
                        hour: p.Hour_HourlyProd,
                        output: p.Result_HourlyProdPN,
                        target: p.Target_HourlyProdPN,
                        efficiency: p.Target_HourlyProdPN > 0
                            ? Math.round((p.Result_HourlyProdPN / p.Target_HourlyProdPN) * 100)
                            : 0
                    }));
            },
            error: () => this.detailHourlyData = []
        });
    }

    goToFullPage(): void {
        if (this.selectedProduction) {
            this.viewDetails(this.selectedProduction);
            this.closeDetailPreview();
        }
    }

    get totalDowntime(): number {
        return this.detailDowntimes.reduce((sum, d) => sum + d.duration, 0);
    }

    get shiftTotals(): { output: number; target: number; efficiency: number } {
        const output = this.detailHourlyData.reduce((sum, h) => sum + h.output, 0);
        const target = this.detailHourlyData.reduce((sum, h) => sum + h.target, 0);
        return {
            output,
            target,
            efficiency: target > 0 ? Math.round((output / target) * 100) : 0
        };
    }
}
