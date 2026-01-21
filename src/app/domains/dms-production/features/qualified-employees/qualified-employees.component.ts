/**
 * Qualified Employees Component
 * Domain: DMS-Production
 *
 * Read-only view of qualified employees for production.
 * Features:
 * - Badge scanner input for quick employee lookup
 * - Project filter dropdown
 * - Stats summary cards
 * - Read-only table (no create/edit/delete)
 */
import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { HRService } from '@core/services/hr.service';
import { ProductionService } from '@core/services/production.service';
import { Qualification } from '@core/models/employee.model';
import { Project, Workstation } from '@core/models/production.model';
import { environment } from '../../../../../environments/environment';

/**
 * Interface for qualified employee display
 */
interface QualifiedEmployee {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_badge: string;
    employee_picture?: string;
    project_id: number;
    project_name: string;
    workstation_id: number;
    workstation_name?: string;
    formation_name: string;
    qualification_level: number;
    qualification_start: Date;
    qualification_end: Date;
    is_valid: boolean;
}

@Component({
    selector: 'app-qualified-employees',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        SelectModule,
        ToastModule,
        ToolbarModule,
        CardModule,
        AvatarModule,
        IconFieldModule,
        InputIconModule,
        RippleModule,
        SkeletonModule
    ],
    providers: [MessageService],
    template: `
        <div class="qualified-employees-page">
            <!-- Page Header -->
            <div class="page-header">
                <div class="header-content">
                    <div class="header-title-section">
                        <div class="header-icon">
                            <i class="pi pi-verified"></i>
                        </div>
                        <div class="header-text">
                            <h1>Qualified Employees</h1>
                            <p>View employees qualified for production operations</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button pButton pRipple icon="pi pi-refresh"
                                class="p-button-outlined"
                                (click)="loadData()"
                                [loading]="loading"
                                pTooltip="Refresh">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-row">
                <div class="stat-card stat-primary">
                    <div class="stat-icon">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ totalQualified() }}</span>
                        <span class="stat-label">Total Qualified</span>
                    </div>
                </div>
                <div class="stat-card stat-success">
                    <div class="stat-icon">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ validCount() }}</span>
                        <span class="stat-label">Valid Qualifications</span>
                    </div>
                </div>
                <div class="stat-card stat-warning">
                    <div class="stat-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ expiringCount() }}</span>
                        <span class="stat-label">Expiring Soon</span>
                    </div>
                </div>
                <div class="stat-card stat-info">
                    <div class="stat-icon">
                        <i class="pi pi-briefcase"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ uniqueProjects() }}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="filter-section">
                <div class="filter-group badge-scan-group">
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-id-card"></p-inputicon>
                        <input type="text" pInputText
                               [(ngModel)]="badgeScan"
                               (keyup.enter)="onBadgeScan()"
                               placeholder="Scan employee badge..."
                               class="badge-scan-input" />
                    </p-iconfield>
                    <button pButton pRipple icon="pi pi-search"
                            class="p-button-outlined badge-scan-btn"
                            (click)="onBadgeScan()"
                            pTooltip="Search by badge"
                            [disabled]="!badgeScan">
                    </button>
                    <button *ngIf="badgeFilter()"
                            pButton pRipple icon="pi pi-times"
                            class="p-button-text p-button-danger badge-clear-btn"
                            (click)="clearBadgeFilter()"
                            pTooltip="Clear badge filter">
                    </button>
                </div>
                <div class="filter-group">
                    <p-select [options]="projects"
                              [ngModel]="selectedProject()"
                              (ngModelChange)="onFilterProjectChange($event)"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="All Projects"
                              [showClear]="true"
                              [filter]="true"
                              filterBy="name"
                              filterPlaceholder="Search project..."
                              appendTo="body"
                              styleClass="filter-select">
                    </p-select>
                </div>
                <div class="filter-group">
                    <p-select [options]="filteredWorkstationsForFilter()"
                              [ngModel]="selectedPoste()"
                              (ngModelChange)="selectedPoste.set($event)"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="All Workstations"
                              [showClear]="true"
                              [filter]="true"
                              filterBy="name"
                              filterPlaceholder="Search workstation..."
                              appendTo="body"
                              styleClass="filter-select">
                    </p-select>
                </div>
                <div class="filter-group">
                    <p-select [options]="statusOptions"
                              [ngModel]="selectedStatus()"
                              (ngModelChange)="selectedStatus.set($event)"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Filter by Status"
                              appendTo="body"
                              [style]="{ minWidth: '150px' }">
                    </p-select>
                </div>
                <div class="filter-group">
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                        <input type="text" pInputText [ngModel]="searchTerm()"
                               (ngModelChange)="searchTerm.set($event)"
                               placeholder="Search by name..."
                               class="search-input" />
                    </p-iconfield>
                </div>
            </div>

            <!-- Badge Filter Active Indicator -->
            <div *ngIf="badgeFilter()" class="badge-filter-indicator">
                <div class="badge-filter-content">
                    <i class="pi pi-id-card"></i>
                    <span>Badge Filter: <strong>{{ badgeFilter() }}</strong></span>
                    <span *ngIf="filteredEmployees().length > 0" class="badge-count">
                        ({{ filteredEmployees().length }} qualification(s) found)
                    </span>
                </div>
                <button pButton pRipple icon="pi pi-times" label="Clear"
                        class="p-button-text p-button-sm"
                        (click)="clearBadgeFilter()">
                </button>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="loading-section">
                <div class="loading-table">
                    <p-skeleton height="50px" styleClass="mb-2"></p-skeleton>
                    <p-skeleton height="60px" styleClass="mb-2" *ngFor="let i of [1,2,3,4,5]"></p-skeleton>
                </div>
            </div>

            <!-- Qualified Employees Table -->
            <div *ngIf="!loading" class="section-card">
                <div class="section-header">
                    <h2>
                        <i class="pi pi-list"></i>
                        Qualified Employees List
                    </h2>
                    <span class="section-count">{{ filteredEmployees().length }} results</span>
                </div>

                <p-table [value]="filteredEmployees()"
                         [paginator]="true" [rows]="10" [rowsPerPageOptions]="[10, 25, 50]"
                         [globalFilterFields]="['employee_name', 'formation_name', 'project_name']"
                         [rowHover]="true" dataKey="id"
                         styleClass="qualified-table"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} qualifications">

                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 250px">Employee</th>
                            <th>Badge</th>
                            <th pSortableColumn="project_name">
                                Project
                                <p-sortIcon field="project_name"></p-sortIcon>
                            </th>
                            <th>Workstation</th>
                            <th pSortableColumn="qualification_end" style="width: 130px">
                                Valid Until
                                <p-sortIcon field="qualification_end"></p-sortIcon>
                            </th>
                            <th style="width: 100px" class="text-center">Status</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-emp>
                        <tr class="qualified-row" [ngClass]="getRowClass(emp)">
                            <td>
                                <div class="employee-cell">
                                    <p-avatar [image]="getEmployeePicture(emp.employee_picture)"
                                              [label]="!emp.employee_picture ? getInitials(emp.employee_name) : undefined"
                                              shape="circle" size="normal"
                                              [style]="{'background': getAvatarColor(emp.employee_name), 'color': 'white'}">
                                    </p-avatar>
                                    <div class="employee-info">
                                        <span class="employee-name">{{ emp.employee_name }}</span>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="badge-number">
                                    <i class="pi pi-id-card"></i> {{ emp.employee_badge || '-' }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="emp.project_name || 'N/A'" severity="info"></p-tag>
                            </td>
                            <td>
                                <span class="workstation-cell">{{ emp.workstation_name || '-' }}</span>
                            </td>
                            <td>
                                <span class="date-cell">
                                    <i class="pi pi-calendar"></i>
                                    {{ emp.qualification_end | date:'dd/MM/yyyy' }}
                                </span>
                            </td>
                            <td class="text-center">
                                <p-tag [value]="emp.is_valid ? 'Valid' : 'Expired'"
                                       [severity]="getStatusSeverity(emp)">
                                </p-tag>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6">
                                <div class="empty-state">
                                    <div class="empty-icon">
                                        <i class="pi pi-verified"></i>
                                    </div>
                                    <h3>No qualified employees found</h3>
                                    <p>{{ searchTerm() || selectedProject() || selectedPoste() || badgeFilter() ? 'Try adjusting your filters' : 'No qualifications available' }}</p>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <p-toast position="bottom-right"></p-toast>
    `,
    styles: [`
        .qualified-employees-page {
            padding: 1.5rem;
            background: var(--surface-ground);
            min-height: 100vh;
        }

        .page-header {
            margin-bottom: 1.5rem;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-title-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);

            i {
                font-size: 1.5rem;
                color: white;
            }
        }

        .header-text {
            h1 {
                margin: 0;
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-color);
            }

            p {
                margin: 0.25rem 0 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        .header-actions {
            display: flex;
            gap: 0.75rem;
        }

        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .stat-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }

            .stat-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 1.25rem;
                    color: white;
                }
            }

            &.stat-primary .stat-icon {
                background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
            }

            &.stat-success .stat-icon {
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            }

            &.stat-warning .stat-icon {
                background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
            }

            &.stat-info .stat-icon {
                background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            }

            .stat-content {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .stat-label {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }

        /* Filter Section */
        .filter-section {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
        }

        .filter-group {
            flex-shrink: 0;
        }

        .search-input {
            width: 280px;
        }

        .filter-select {
            min-width: 200px;
        }

        /* Badge Scan Styles */
        .badge-scan-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .badge-scan-input {
            width: 220px;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.875rem;
            letter-spacing: 0.5px;
        }

        .badge-scan-btn {
            flex-shrink: 0;
        }

        .badge-clear-btn {
            flex-shrink: 0;
        }

        /* Badge Filter Indicator */
        .badge-filter-indicator {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1.25rem;
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 10px;
            margin-bottom: 1rem;
        }

        .badge-filter-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #059669;

            i {
                font-size: 1.25rem;
            }

            strong {
                font-family: 'JetBrains Mono', 'Fira Code', monospace;
                background: rgba(16, 185, 129, 0.15);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }

            .badge-count {
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        /* Loading Section */
        .loading-section {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
        }

        /* Section Card */
        .section-card {
            background: var(--surface-card);
            border-radius: 16px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
            overflow: hidden;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--surface-border);
            background: var(--surface-50);

            h2 {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-color);
                display: flex;
                align-items: center;
                gap: 0.75rem;

                i {
                    color: #10B981;
                }
            }

            .section-count {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                background: var(--surface-100);
                padding: 0.375rem 0.75rem;
                border-radius: 20px;
            }
        }

        /* Table Styles */
        :host ::ng-deep .qualified-table {
            .p-datatable-header {
                background: transparent;
                border: none;
                padding: 0;
            }

            .p-datatable-thead > tr > th {
                background: var(--surface-50);
                color: var(--text-color-secondary);
                font-weight: 600;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-color: var(--surface-border);
                padding: 1rem;
            }

            .p-datatable-tbody > tr {
                transition: all 0.2s ease;

                &:hover {
                    background: var(--surface-hover);
                }

                > td {
                    padding: 1rem;
                    border-color: var(--surface-border);
                }
            }
        }

        .qualified-row {
            &.row-valid {
                border-left: 3px solid #10B981;
            }

            &.row-expiring {
                border-left: 3px solid #F59E0B;
            }

            &.row-expired {
                border-left: 3px solid #EF4444;
            }
        }

        .employee-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .employee-info {
            display: flex;
            flex-direction: column;
        }

        .employee-name {
            font-weight: 600;
            color: var(--text-color);
        }

        .badge-number {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.875rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.75rem;
            }
        }

        .workstation-cell {
            color: var(--text-color);
            font-size: 0.875rem;
        }

        .date-cell {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.75rem;
            }
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;

            .empty-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: var(--surface-100);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;

                i {
                    font-size: 2rem;
                    color: var(--text-color-secondary);
                }
            }

            h3 {
                margin: 0 0 0.5rem;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-color);
            }

            p {
                margin: 0;
                color: var(--text-color-secondary);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .qualified-employees-page {
                padding: 1rem;
            }

            .header-content {
                flex-direction: column;
            }

            .header-actions {
                width: 100%;
                justify-content: flex-end;
            }

            .filter-section {
                flex-direction: column;
                align-items: stretch;
            }

            .search-input {
                width: 100%;
            }

            .badge-scan-group {
                width: 100%;
            }

            .badge-scan-input {
                flex: 1;
                width: auto;
            }

            .badge-filter-indicator {
                flex-direction: column;
                gap: 0.75rem;
                text-align: center;
            }

            .badge-filter-content {
                flex-wrap: wrap;
                justify-content: center;
            }
        }
    `]
})
export class QualifiedEmployeesComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Data
    qualifications = signal<Qualification[]>([]);
    projects: Project[] = [];
    workstations: Workstation[] = [];
    loading = false;

    // Filters
    badgeScan = '';
    badgeFilter = signal<string | null>(null);
    badgeEmployeeId = signal<number | null>(null);
    selectedProject = signal<number | null>(null);
    selectedPoste = signal<number | null>(null);
    searchTerm = signal('');
    selectedStatus = signal<'all' | 'valid' | 'expired'>('all');
    statusOptions = [
        { label: 'All', value: 'all' },
        { label: 'Valid', value: 'valid' },
        { label: 'Expired', value: 'expired' }
    ];

    // Computed: workstations filtrées pour le dropdown de filtre
    filteredWorkstationsForFilter = computed(() => {
        const projectId = this.selectedProject();
        if (projectId) {
            return this.workstations.filter(w => w.project === projectId);
        }
        return this.workstations;
    });

    // Computed: Transform qualifications to QualifiedEmployee display format
    private qualifiedEmployees = computed(() => {
        return this.qualifications()
            .filter(q => q.test_result?.toLowerCase() === 'passed')
            .map(q => this.mapToQualifiedEmployee(q));
    });

    // Computed: Filtered list based on all filters
    filteredEmployees = computed(() => {
        let result = this.qualifiedEmployees();
        const badge = this.badgeFilter();
        const badgeEmpId = this.badgeEmployeeId();
        const projectId = this.selectedProject();
        const term = this.searchTerm();

        // Filter by badge
        if (badge) {
            if (badgeEmpId) {
                result = result.filter(e => e.employee_id === badgeEmpId);
            } else {
                const badgeLower = badge.toLowerCase().trim();
                result = result.filter(e =>
                    e.employee_badge?.toLowerCase().includes(badgeLower)
                );
            }
        }

        // Filter by project
        if (projectId) {
            result = result.filter(e => e.project_id === projectId);
        }

        // Filter by workstation/poste
        const posteId = this.selectedPoste();
        if (posteId) {
            result = result.filter(e => e.workstation_id === posteId);
        }

        // Filter by search term
        if (term) {
            const termLower = term.toLowerCase().trim();
            result = result.filter(e =>
                e.employee_name?.toLowerCase().includes(termLower) ||
                e.formation_name?.toLowerCase().includes(termLower)
            );
        }

        // Filter by status
        const status = this.selectedStatus();
        if (status === 'valid') {
            result = result.filter(e => e.is_valid);
        } else if (status === 'expired') {
            result = result.filter(e => !e.is_valid);
        }

        return result;
    });

    // Computed: Stats
    totalQualified = computed(() => this.qualifiedEmployees().length);

    validCount = computed(() =>
        this.qualifiedEmployees().filter(e => e.is_valid).length
    );

    expiringCount = computed(() => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return this.qualifiedEmployees().filter(e => {
            if (!e.is_valid) return false;
            const endDate = new Date(e.qualification_end);
            return endDate <= thirtyDaysFromNow;
        }).length;
    });

    uniqueProjects = computed(() => {
        const projectIds = new Set(
            this.qualifiedEmployees()
                .filter(e => e.project_id)
                .map(e => e.project_id)
        );
        return projectIds.size;
    });

    constructor(
        private hrService: HRService,
        private productionService: ProductionService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        forkJoin({
            qualifications: this.hrService.getQualifications().pipe(catchError(() => of([]))),
            projects: this.productionService.getProjects().pipe(catchError(() => of([]))),
            workstations: this.productionService.getWorkstations().pipe(catchError(() => of([])))
        }).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.qualifications.set(data.qualifications);
                this.projects = data.projects;
                this.workstations = data.workstations;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load data'
                });
            }
        });
    }

    /**
     * Map Qualification to QualifiedEmployee display format
     */
    private mapToQualifiedEmployee(q: Qualification): QualifiedEmployee {
        const today = new Date();
        const endDate = q.end_date ? new Date(q.end_date as string) : null;
        const isValid = endDate ? endDate >= today : false;

        return {
            id: q.id,
            employee_id: q.employee,
            employee_name: q.employee_name || 'Unknown',
            employee_badge: q.employee_badge || '',
            employee_picture: q.employee_picture,
            project_id: q.project || 0,
            project_name: q.project_name || '',
            workstation_id: q.poste || 0,
            workstation_name: q.poste_name || '',
            formation_name: q.formation_name || 'Unknown Formation',
            qualification_level: q.score || 1,
            qualification_start: q.start_date ? new Date(q.start_date as string) : new Date(),
            qualification_end: endDate || new Date(),
            is_valid: isValid
        };
    }

    /**
     * Handle badge scan - triggered on Enter key or button click
     */
    onBadgeScan(): void {
        if (this.badgeScan && this.badgeScan.trim()) {
            const badge = this.badgeScan.trim();
            this.badgeFilter.set(badge);
            this.badgeEmployeeId.set(null);

            // Try to find employee by badge via API
            this.hrService.getEmployeeByBadge(badge).pipe(
                takeUntil(this.destroy$)
            ).subscribe({
                next: (employee: any) => {
                    const empId = employee.id || employee.Id_Emp;
                    this.badgeEmployeeId.set(empId);
                    const empName = employee.full_name ||
                                   `${employee.first_name || employee.Prenom_Emp} ${employee.last_name || employee.Nom_Emp}`;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Employee Found',
                        detail: `${empName} (Badge: ${badge})`,
                        life: 3000
                    });
                    this.badgeScan = '';
                },
                error: () => {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Badge Not Found',
                        detail: `No employee with badge "${badge}". Text search enabled.`,
                        life: 3000
                    });
                    this.badgeScan = '';
                }
            });
        }
    }

    /**
     * Clear the badge filter
     */
    clearBadgeFilter(): void {
        this.badgeScan = '';
        this.badgeFilter.set(null);
        this.badgeEmployeeId.set(null);
    }

    /**
     * Handle project filter change - resets poste when project changes
     */
    onFilterProjectChange(projectId: number | null): void {
        this.selectedProject.set(projectId);
        // Reset poste when project changes
        this.selectedPoste.set(null);
    }

    /**
     * Get row class based on qualification status
     */
    getRowClass(emp: QualifiedEmployee): string {
        if (!emp.is_valid) return 'row-expired';

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const endDate = new Date(emp.qualification_end);

        if (endDate <= thirtyDaysFromNow) return 'row-expiring';
        return 'row-valid';
    }

    /**
     * Get status severity for tag
     */
    getStatusSeverity(emp: QualifiedEmployee): 'success' | 'warn' | 'danger' {
        if (!emp.is_valid) return 'danger';

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const endDate = new Date(emp.qualification_end);

        if (endDate <= thirtyDaysFromNow) return 'warn';
        return 'success';
    }

    /**
     * Get avatar color based on name
     */
    getAvatarColor(name: string): string {
        if (!name) return '#10B981';
        const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

    /**
     * Get employee picture URL
     */
    getEmployeePicture(picture: string | null | undefined): string | undefined {
        if (!picture) return undefined;
        if (picture.startsWith('http') || picture.startsWith('assets/')) return picture;
        const picturePath = picture.startsWith('/') ? picture : `/${picture}`;
        return `${environment.mediaUrl}${picturePath}`;
    }

    /**
     * Get initials from name
     */
    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
}
