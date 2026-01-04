/**
 * Recyclage List Component
 * Domain: DMS-RH
 *
 * Displays employees requiring retraining (recyclage) with modern alert styling
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';

// Domain imports
import { DmsQualificationService, RecyclageEmployee } from '@domains/dms-rh';

@Component({
    selector: 'app-recyclage-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        TooltipModule,
        ProgressBarModule,
        SkeletonModule,
        BadgeModule,
        RippleModule,
        MessageModule
    ],
    template: `
        <div class="recyclage-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
                        <i class="pi pi-refresh"></i>
                    </div>
                    <div class="title-text">
                        <h1>Recyclage Management</h1>
                        <span class="subtitle">Monitor and schedule employee retraining</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            label="Refresh"
                            class="p-button-outlined"
                            (click)="loadData()"
                            [loading]="loading">
                    </button>
                </div>
            </div>

            <!-- Alert Banner -->
            <div class="alert-banner" *ngIf="overdueCount > 0">
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="alert-text">
                        <strong>{{ overdueCount }} employee{{ overdueCount > 1 ? 's' : '' }}</strong>
                        {{ overdueCount > 1 ? 'have' : 'has' }} overdue recyclage requirements.
                        Please schedule their retraining as soon as possible.
                    </div>
                    <button pButton pRipple
                            label="View Overdue"
                            class="p-button-danger p-button-sm"
                            (click)="filterOverdue()">
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="recyclage-stat-card overdue" (click)="filterOverdue()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(239, 68, 68, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#EF4444" stroke-width="8"
                                    [attr.stroke-dasharray]="getOverdueDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ overdueCount }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Overdue</span>
                        <span class="stat-sublabel">Immediate action required</span>
                    </div>
                </div>

                <div class="recyclage-stat-card due-soon" (click)="filterDueSoon()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(245, 158, 11, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#F59E0B" stroke-width="8"
                                    [attr.stroke-dasharray]="getDueSoonDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ dueSoonCount }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Due Soon</span>
                        <span class="stat-sublabel">Within 30 days</span>
                    </div>
                </div>

                <div class="recyclage-stat-card upcoming" (click)="filterUpcoming()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(59, 130, 246, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#3B82F6" stroke-width="8"
                                    [attr.stroke-dasharray]="getUpcomingDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ upcomingCount }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Upcoming</span>
                        <span class="stat-sublabel">Within 90 days</span>
                    </div>
                </div>

                <div class="recyclage-stat-card total" (click)="clearFilter()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(139, 92, 246, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#8B5CF6" stroke-width="8"
                                    stroke-dasharray="251.2, 251.2"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ employees.length }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Total</span>
                        <span class="stat-sublabel">All requiring recyclage</span>
                    </div>
                </div>
            </div>

            <!-- Employees Table -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-users"></i>
                        Employees Requiring Recyclage
                        <p-badge *ngIf="activeFilter" [value]="activeFilter" severity="info" styleClass="ml-2"></p-badge>
                    </span>
                    <button pButton pRipple
                            icon="pi pi-filter-slash"
                            label="Clear Filter"
                            class="p-button-text p-button-sm"
                            *ngIf="activeFilter"
                            (click)="clearFilter()">
                    </button>
                </div>
                <div class="section-body p-0">
                    <p-table [value]="filteredEmployees"
                             [loading]="loading"
                             [paginator]="true"
                             [rows]="10"
                             [rowHover]="true"
                             styleClass="hr-table">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 60px"></th>
                                <th pSortableColumn="Employee.Nom_Emp">
                                    <div class="flex align-items-center gap-2">
                                        Employee
                                        <p-sortIcon field="Employee.Nom_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="DateEmbauche_Emp">
                                    <div class="flex align-items-center gap-2">
                                        Hire Date
                                        <p-sortIcon field="DateEmbauche_Emp"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="lastQualificationDate">
                                    <div class="flex align-items-center gap-2">
                                        Last Qualification
                                        <p-sortIcon field="lastQualificationDate"></p-sortIcon>
                                    </div>
                                </th>
                                <th pSortableColumn="daysUntilRecyclage" style="width: 160px">
                                    <div class="flex align-items-center gap-2">
                                        Days Until Due
                                        <p-sortIcon field="daysUntilRecyclage"></p-sortIcon>
                                    </div>
                                </th>
                                <th style="width: 120px">Status</th>
                                <th style="width: 140px; text-align: center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-emp>
                            <tr>
                                <td>
                                    <div class="hr-avatar-badge">
                                        <p-avatar [label]="getInitials(emp.Employee)"
                                                  shape="circle"
                                                  size="large"
                                                  [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                        </p-avatar>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-employee-info">
                                        <div class="employee-details">
                                            <span class="employee-name">
                                                {{ emp.Employee?.Nom_Emp }} {{ emp.Employee?.Prenom_Emp }}
                                            </span>
                                            <span class="employee-meta">
                                                ID: {{ emp.Id_Emp }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-info-row">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ emp.DateEmbauche_Emp | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-info-row" *ngIf="emp.lastQualificationDate">
                                        <i class="pi pi-verified"></i>
                                        <span>{{ emp.lastQualificationDate | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                    <span class="text-color-secondary" *ngIf="!emp.lastQualificationDate">-</span>
                                </td>
                                <td>
                                    <div class="days-indicator-wrapper">
                                        <div class="hr-days-indicator" [ngClass]="getDaysClass(emp)">
                                            <i [class]="getDaysIcon(emp)"></i>
                                            <span *ngIf="emp.isOverdue">
                                                {{ Math.abs(emp.daysUntilRecyclage) }} days overdue
                                            </span>
                                            <span *ngIf="!emp.isOverdue">
                                                {{ emp.daysUntilRecyclage }} days
                                            </span>
                                        </div>
                                        <div class="days-progress">
                                            <div class="progress-fill" [ngClass]="getDaysClass(emp)"
                                                 [style.width.%]="getDaysProgress(emp)"></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p-tag [value]="getStatusLabel(emp)"
                                           [severity]="getStatusSeverity(emp)"
                                           [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="hr-action-buttons">
                                        <button pButton pRipple
                                                icon="pi pi-calendar-plus"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="onScheduleRecyclage(emp)"
                                                pTooltip="Schedule Recyclage">
                                        </button>
                                        <button pButton pRipple
                                                icon="pi pi-eye"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="onViewEmployee(emp)"
                                                pTooltip="View Details">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7">
                                    <div class="hr-empty-state success-state">
                                        <i class="empty-icon pi pi-check-circle" style="color: var(--hr-success);"></i>
                                        <h3>All caught up!</h3>
                                        <p>No employees requiring recyclage at this time</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr *ngFor="let i of [1,2,3,4,5]">
                                <td><p-skeleton shape="circle" size="48px"></p-skeleton></td>
                                <td><p-skeleton width="180px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="120px" height="28px" borderRadius="14px"></p-skeleton></td>
                                <td><p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="32px"></p-skeleton></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .recyclage-list {
            padding: 1.5rem;
        }

        /* Alert Banner */
        .alert-banner {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            margin-bottom: 1.5rem;

            .alert-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .alert-icon {
                width: 40px;
                height: 40px;
                border-radius: 10px;
                background: rgba(239, 68, 68, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;

                i {
                    font-size: 1.25rem;
                    color: var(--hr-danger);
                }
            }

            .alert-text {
                flex: 1;
                font-size: 0.9375rem;
                color: var(--text-color);
            }
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .recyclage-stat-card {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid var(--surface-border);
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
            }

            &.overdue:hover {
                border-color: rgba(239, 68, 68, 0.5);
            }

            &.due-soon:hover {
                border-color: rgba(245, 158, 11, 0.5);
            }

            &.upcoming:hover {
                border-color: rgba(59, 130, 246, 0.5);
            }

            &.total:hover {
                border-color: rgba(139, 92, 246, 0.5);
            }

            .stat-visual {
                position: relative;
                width: 80px;
                height: 80px;
                flex-shrink: 0;
            }

            .stat-ring {
                width: 100%;
                height: 100%;
            }

            .stat-value-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;

                .value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-color);
                }
            }

            .stat-info {
                display: flex;
                flex-direction: column;

                .stat-label {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--text-color);
                }

                .stat-sublabel {
                    font-size: 0.8125rem;
                    color: var(--text-color-secondary);
                }
            }

            &.overdue .stat-value-center .value { color: #EF4444; }
            &.due-soon .stat-value-center .value { color: #F59E0B; }
            &.upcoming .stat-value-center .value { color: #3B82F6; }
            &.total .stat-value-center .value { color: #8B5CF6; }
        }

        /* Days Indicator */
        .days-indicator-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .days-progress {
            height: 4px;
            background: var(--surface-border);
            border-radius: 2px;
            overflow: hidden;

            .progress-fill {
                height: 100%;
                border-radius: 2px;
                transition: width 0.5s ease;

                &.overdue { background: var(--hr-danger); }
                &.due-soon { background: var(--hr-warning); }
                &.upcoming { background: var(--hr-info); }
                &.ok { background: var(--hr-success); }
            }
        }

        /* Success State */
        .success-state {
            i.empty-icon {
                color: var(--hr-success) !important;
                opacity: 1 !important;
            }
        }

        /* Table Customization */
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-50);
                padding: 1rem;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
            }
        }
    `]
})
export class RecyclageListComponent implements OnInit, OnDestroy {
    @Input() employees: RecyclageEmployee[] = [];
    @Input() loading = false;

    @Output() scheduleRecyclage = new EventEmitter<RecyclageEmployee>();
    @Output() viewEmployee = new EventEmitter<RecyclageEmployee>();

    private destroy$ = new Subject<void>();

    Math = Math;
    filteredEmployees: RecyclageEmployee[] = [];
    activeFilter: string | null = null;

    get overdueCount(): number {
        return this.employees.filter(e => e.isOverdue).length;
    }

    get dueSoonCount(): number {
        return this.employees.filter(e => !e.isOverdue && e.daysUntilRecyclage <= 30).length;
    }

    get upcomingCount(): number {
        return this.employees.filter(e => !e.isOverdue && e.daysUntilRecyclage > 30 && e.daysUntilRecyclage <= 90).length;
    }

    constructor(private qualificationService: DmsQualificationService) {}

    ngOnInit(): void {
        if (this.employees.length === 0) {
            this.loadData();
        } else {
            this.filteredEmployees = [...this.employees];
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadData(): void {
        this.loading = true;
        this.qualificationService.getRecyclageEmployees({ includeOverdue: true })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employees) => {
                    // Map API response to expected format
                    this.employees = employees.map((emp: any) => this.mapRecyclageEmployee(emp));
                    this.filteredEmployees = [...this.employees];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private mapRecyclageEmployee(data: any): RecyclageEmployee {
        // Parse full_name into first/last name
        const fullName = data.full_name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Handle both nested Employee object and flat structure from API
        const employee = data.Employee || {
            Id_Emp: data.id || data.employee_id,
            Nom_Emp: lastName || data.Nom_Emp || '',
            Prenom_Emp: firstName || data.Prenom_Emp || '',
            Picture: data.picture || data.Picture || null,
            Departement_Emp: data.department || data.Departement_Emp || '',
            Categorie_Emp: data.category || data.Categorie_Emp || ''
        };

        return {
            Id_Emp: data.id || data.employee_id || data.Id_Emp,
            Employee: employee,
            DateEmbauche_Emp: data.hire_date || data.DateEmbauche_Emp,
            daysUntilRecyclage: data.days_until_recyclage ?? data.daysUntilRecyclage ?? 0,
            isOverdue: data.is_overdue ?? data.isOverdue ?? false,
            lastQualificationDate: data.last_qualification_date || data.lastQualificationDate,
            requiresRecyclage: data.requires_recyclage ?? data.requiresRecyclage ?? true
        };
    }

    filterOverdue(): void {
        this.activeFilter = 'Overdue';
        this.filteredEmployees = this.employees.filter(e => e.isOverdue);
    }

    filterDueSoon(): void {
        this.activeFilter = 'Due Soon';
        this.filteredEmployees = this.employees.filter(e => !e.isOverdue && e.daysUntilRecyclage <= 30);
    }

    filterUpcoming(): void {
        this.activeFilter = 'Upcoming';
        this.filteredEmployees = this.employees.filter(e => !e.isOverdue && e.daysUntilRecyclage > 30 && e.daysUntilRecyclage <= 90);
    }

    clearFilter(): void {
        this.activeFilter = null;
        this.filteredEmployees = [...this.employees];
    }

    getOverdueDashArray(): string {
        const total = this.employees.length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.overdueCount / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getDueSoonDashArray(): string {
        const total = this.employees.length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.dueSoonCount / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getUpcomingDashArray(): string {
        const total = this.employees.length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.upcomingCount / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getInitials(employee: any): string {
        if (!employee) return '?';
        const first = employee.Prenom_Emp?.charAt(0) || '';
        const last = employee.Nom_Emp?.charAt(0) || '';
        return (first + last).toUpperCase();
    }

    getDaysClass(emp: RecyclageEmployee): string {
        if (emp.isOverdue) return 'overdue';
        if (emp.daysUntilRecyclage <= 30) return 'due-soon';
        if (emp.daysUntilRecyclage <= 90) return 'upcoming';
        return 'ok';
    }

    getDaysIcon(emp: RecyclageEmployee): string {
        if (emp.isOverdue) return 'pi pi-exclamation-circle';
        if (emp.daysUntilRecyclage <= 30) return 'pi pi-clock';
        return 'pi pi-calendar';
    }

    getDaysProgress(emp: RecyclageEmployee): number {
        if (emp.isOverdue) return 100;
        const maxDays = 365;
        return Math.max(0, Math.min(100, ((maxDays - emp.daysUntilRecyclage) / maxDays) * 100));
    }

    getStatusLabel(emp: RecyclageEmployee): string {
        if (emp.isOverdue) return 'Overdue';
        if (emp.daysUntilRecyclage <= 30) return 'Due Soon';
        if (emp.daysUntilRecyclage <= 90) return 'Upcoming';
        return 'Scheduled';
    }

    getStatusSeverity(emp: RecyclageEmployee): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (emp.isOverdue) return 'danger';
        if (emp.daysUntilRecyclage <= 30) return 'warn';
        return 'info';
    }

    onScheduleRecyclage(emp: RecyclageEmployee): void {
        this.scheduleRecyclage.emit(emp);
    }

    onViewEmployee(emp: RecyclageEmployee): void {
        this.viewEmployee.emit(emp);
    }
}
