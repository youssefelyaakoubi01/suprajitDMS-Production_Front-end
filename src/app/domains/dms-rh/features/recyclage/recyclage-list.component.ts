/**
 * Recyclage List Component
 * Domain: DMS-RH
 *
 * Displays employees with expiring qualifications and remaining duration
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

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
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

// Domain imports
import { DmsQualificationService, RecyclageEmployee } from '@domains/dms-rh';
import { HRService } from '@core/services/hr.service';

// Interface for expiring qualification
export interface ExpiringQualification {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_badge?: string;
    formation_name: string;
    formation_id: number;
    start_date: Date;
    end_date: Date;
    days_remaining: number;
    is_expired: boolean;
    trainer_name?: string;
    test_result?: string;
}

@Component({
    selector: 'app-recyclage-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
        MessageModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        SelectModule
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
                        <h1>Recyclage - Qualifications Expirantes</h1>
                        <span class="subtitle">Suivi des qualifications arrivant à expiration</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            label="Actualiser"
                            class="p-button-outlined"
                            (click)="loadData()"
                            [loading]="loading">
                    </button>
                </div>
            </div>

            <!-- Alert Banner -->
            <div class="alert-banner" *ngIf="expiredCount() > 0">
                <div class="alert-content">
                    <div class="alert-icon">
                        <i class="pi pi-exclamation-triangle"></i>
                    </div>
                    <div class="alert-text">
                        <strong>{{ expiredCount() }} qualification{{ expiredCount() > 1 ? 's' : '' }}</strong>
                        {{ expiredCount() > 1 ? 'ont expiré' : 'a expiré' }}.
                        Veuillez planifier le recyclage dès que possible.
                    </div>
                    <button pButton pRipple
                            label="Voir Expirées"
                            class="p-button-danger p-button-sm"
                            (click)="filterExpired()">
                    </button>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="recyclage-stat-card overdue" (click)="filterExpired()" pRipple>
                    <div class="stat-visual">
                        <svg viewBox="0 0 100 100" class="stat-ring">
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="rgba(239, 68, 68, 0.2)" stroke-width="8"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                    stroke="#EF4444" stroke-width="8"
                                    [attr.stroke-dasharray]="getExpiredDashArray()"
                                    stroke-linecap="round"
                                    transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="stat-value-center">
                            <span class="value">{{ expiredCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Expirées</span>
                        <span class="stat-sublabel">Action immédiate requise</span>
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
                            <span class="value">{{ dueSoonCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Expire Bientôt</span>
                        <span class="stat-sublabel">Dans 30 jours</span>
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
                            <span class="value">{{ upcomingCount() }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">À Venir</span>
                        <span class="stat-sublabel">Dans 90 jours</span>
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
                            <span class="value">{{ qualifications().length }}</span>
                        </div>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Total</span>
                        <span class="stat-sublabel">Toutes les qualifications</span>
                    </div>
                </div>
            </div>

            <!-- Qualifications Table -->
            <div class="hr-section-card">
                <div class="section-header">
                    <span class="section-title">
                        <i class="pi pi-id-card"></i>
                        Qualifications Arrivant à Expiration
                        <p-badge *ngIf="activeFilter" [value]="activeFilter" severity="info" styleClass="ml-2"></p-badge>
                    </span>
                    <div class="section-actions">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input pInputText type="text"
                                   [(ngModel)]="searchTerm"
                                   (input)="onSearch()"
                                   placeholder="Rechercher..."
                                   class="search-input" />
                        </p-iconfield>
                        <button pButton pRipple
                                icon="pi pi-filter-slash"
                                label="Effacer"
                                class="p-button-text p-button-sm"
                                *ngIf="activeFilter"
                                (click)="clearFilter()">
                        </button>
                    </div>
                </div>
                <div class="section-body p-0">
                    <p-table [value]="filteredQualifications()"
                             [loading]="loading"
                             [paginator]="true"
                             [rows]="10"
                             [rowsPerPageOptions]="[10, 25, 50]"
                             [showCurrentPageReport]="true"
                             currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} qualifications"
                             [rowHover]="true"
                             [sortField]="'days_remaining'"
                             [sortOrder]="1"
                             styleClass="p-datatable-sm hr-table">

                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 60px"></th>
                                <th pSortableColumn="employee_name">
                                    Opérateur <p-sortIcon field="employee_name"></p-sortIcon>
                                </th>
                                <th pSortableColumn="formation_name">
                                    Formation <p-sortIcon field="formation_name"></p-sortIcon>
                                </th>
                                <th pSortableColumn="end_date" style="width: 140px">
                                    Date Fin <p-sortIcon field="end_date"></p-sortIcon>
                                </th>
                                <th pSortableColumn="days_remaining" style="width: 180px">
                                    Durée Restante <p-sortIcon field="days_remaining"></p-sortIcon>
                                </th>
                                <th style="width: 120px">Statut</th>
                                <th style="width: 100px; text-align: center">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-qual>
                            <tr>
                                <td>
                                    <div class="hr-avatar-badge">
                                        <p-avatar [label]="getInitials(qual.employee_name)"
                                                  shape="circle"
                                                  size="large"
                                                  [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                        </p-avatar>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-employee-info">
                                        <div class="employee-details">
                                            <span class="employee-name">{{ qual.employee_name }}</span>
                                            <span class="employee-meta" *ngIf="qual.employee_badge">
                                                Badge: {{ qual.employee_badge }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="formation-info">
                                        <i class="pi pi-book"></i>
                                        <span>{{ qual.formation_name }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="hr-info-row" [ngClass]="{'expired-date': qual.is_expired}">
                                        <i class="pi pi-calendar"></i>
                                        <span>{{ qual.end_date | date:'dd/MM/yyyy' }}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="days-indicator-wrapper">
                                        <div class="hr-days-indicator" [ngClass]="getDaysClass(qual)">
                                            <i [class]="getDaysIcon(qual)"></i>
                                            <span *ngIf="qual.is_expired" class="days-text">
                                                {{ formatDaysOverdue(qual.days_remaining) }}
                                            </span>
                                            <span *ngIf="!qual.is_expired" class="days-text">
                                                {{ formatDaysRemaining(qual.days_remaining) }}
                                            </span>
                                        </div>
                                        <div class="days-progress">
                                            <div class="progress-fill" [ngClass]="getDaysClass(qual)"
                                                 [style.width.%]="getDaysProgress(qual)"></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <p-tag [value]="getStatusLabel(qual)"
                                           [severity]="getStatusSeverity(qual)"
                                           [rounded]="true">
                                    </p-tag>
                                </td>
                                <td>
                                    <div class="hr-action-buttons">
                                        <button pButton pRipple
                                                icon="pi pi-calendar-plus"
                                                class="p-button-text p-button-rounded p-button-sm"
                                                (click)="onScheduleRecyclage(qual)"
                                                pTooltip="Planifier Recyclage">
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
                                        <h3>Tout est à jour!</h3>
                                        <p>Aucune qualification à recycler pour le moment</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="loadingbody">
                            <tr *ngFor="let i of [1,2,3,4,5]">
                                <td><p-skeleton shape="circle" size="48px"></p-skeleton></td>
                                <td><p-skeleton width="150px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="120px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="100px" height="20px"></p-skeleton></td>
                                <td><p-skeleton width="140px" height="28px" borderRadius="14px"></p-skeleton></td>
                                <td><p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton></td>
                                <td><p-skeleton width="40px" height="32px"></p-skeleton></td>
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

        /* Formation Info */
        .formation-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color);

            i {
                color: var(--primary-color);
                font-size: 0.875rem;
            }
        }

        /* Expired Date */
        .expired-date {
            color: var(--hr-danger) !important;

            i {
                color: var(--hr-danger) !important;
            }
        }

        /* Days Text */
        .days-text {
            font-weight: 500;
        }

        /* Section Actions */
        .section-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .search-input {
                min-width: 200px;
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

    @Output() scheduleRecyclage = new EventEmitter<ExpiringQualification>();

    private destroy$ = new Subject<void>();

    Math = Math;

    // Signals for reactive data
    qualifications = signal<ExpiringQualification[]>([]);
    searchTerm = '';
    activeFilter: string | null = null;

    // Computed counts
    expiredCount = computed(() => this.qualifications().filter(q => q.is_expired).length);
    dueSoonCount = computed(() => this.qualifications().filter(q => !q.is_expired && q.days_remaining <= 30).length);
    upcomingCount = computed(() => this.qualifications().filter(q => !q.is_expired && q.days_remaining > 30 && q.days_remaining <= 90).length);

    // Filtered qualifications
    filteredQualifications = computed(() => {
        let result = this.qualifications();

        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(q =>
                q.employee_name?.toLowerCase().includes(term) ||
                q.formation_name?.toLowerCase().includes(term) ||
                q.employee_badge?.toLowerCase().includes(term)
            );
        }

        // Apply status filter
        if (this.activeFilter === 'Expirées') {
            result = result.filter(q => q.is_expired);
        } else if (this.activeFilter === 'Expire Bientôt') {
            result = result.filter(q => !q.is_expired && q.days_remaining <= 30);
        } else if (this.activeFilter === 'À Venir') {
            result = result.filter(q => !q.is_expired && q.days_remaining > 30 && q.days_remaining <= 90);
        }

        return result;
    });

    constructor(
        private qualificationService: DmsQualificationService,
        private hrService: HRService
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
        // Load all qualifications and calculate expiring ones
        this.loadQualificationsWithExpiry();
    }

    private loadQualificationsWithExpiry(): void {
        // Load both qualifications and employees to join them for status filtering
        forkJoin({
            qualifications: this.hrService.getQualifications(),
            employees: this.hrService.getEmployees()
        }).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.loading = false)
        ).subscribe({
            next: ({ qualifications, employees }) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Create a map of employee ID to employee status for quick lookup
                const employeeStatusMap = new Map<number, string>();
                employees.forEach((emp: any) => {
                    const empId = emp.Id_Emp || emp.id;
                    const status = (emp.EmpStatus || emp.status || '').toString().toLowerCase().trim();
                    employeeStatusMap.set(empId, status);
                });

                console.log('Employees loaded:', employees.length);
                console.log('Qualifications loaded:', qualifications.length);

                const expiringQuals: ExpiringQualification[] = qualifications
                    .filter((q: any) => {
                        // Check for end_date field (API uses snake_case)
                        const endDate = q.end_date || q.end_qualif;
                        if (!endDate) return false;

                        // Exclude explicitly failed/cancelled qualifications
                        const testResult = (q.test_result || '').toString().toLowerCase().trim();
                        const isInvalidQualification = testResult === 'failed' ||
                                                       testResult === 'échoué' ||
                                                       testResult === 'echec' ||
                                                       testResult === 'cancelled' ||
                                                       testResult === 'annulé' ||
                                                       testResult === 'pending' ||
                                                       testResult === 'en attente' ||
                                                       testResult === 'no' ||
                                                       testResult === 'non' ||
                                                       testResult === '0' ||
                                                       testResult === 'false';

                        if (isInvalidQualification) return false;

                        // Get employee status from the map using employee ID
                        const employeeId = q.employee || q.Id_Emp;
                        const employeeStatus = employeeStatusMap.get(employeeId) || '';

                        const isInactiveEmployee = employeeStatus === 'inactive' ||
                                                   employeeStatus === 'inactif' ||
                                                   employeeStatus === 'terminated' ||
                                                   employeeStatus === 'terminé' ||
                                                   employeeStatus === 'resigned' ||
                                                   employeeStatus === 'démissionné' ||
                                                   employeeStatus === 'i' ||
                                                   employeeStatus === 'disabled' ||
                                                   employeeStatus === 'désactivé';

                        if (isInactiveEmployee) {
                            console.log('Filtered out inactive employee:', q.employee_name, 'Status:', employeeStatus);
                        }

                        return !isInactiveEmployee;
                    })
                    .map((q: any) => {
                        const endDateStr = q.end_date || q.end_qualif;
                        const endDate = new Date(endDateStr);
                        endDate.setHours(0, 0, 0, 0);

                        const diffTime = endDate.getTime() - today.getTime();
                        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        return {
                            id: q.id || q.id_qualif,
                            employee_id: q.employee || q.Id_Emp,
                            employee_name: q.employee_name ||
                                (q.Employee ? `${q.Employee.Prenom_Emp || ''} ${q.Employee.Nom_Emp || ''}`.trim() : '') ||
                                `Employé #${q.employee || q.Id_Emp}`,
                            employee_badge: q.employee_badge || q.Employee?.BadgeNumber || q.Employee?.badge,
                            formation_name: q.formation_name ||
                                q.Formation?.name_formation ||
                                q.Formation?.name ||
                                `Formation #${q.formation || q.id_formation}`,
                            formation_id: q.formation || q.id_formation,
                            start_date: new Date(q.start_date || q.start_qualif),
                            end_date: endDate,
                            days_remaining: daysRemaining,
                            is_expired: daysRemaining < 0,
                            trainer_name: q.trainer_name || q.TrainerName,
                            test_result: q.test_result
                        };
                    })
                    .filter((q: ExpiringQualification) => q.days_remaining <= 90) // Only show next 90 days or expired
                    .sort((a: ExpiringQualification, b: ExpiringQualification) => a.days_remaining - b.days_remaining);

                console.log('Expiring qualifications (active employees only):', expiringQuals.length);
                this.qualifications.set(expiringQuals);
            },
            error: (err) => {
                console.error('Error loading data:', err);
                this.qualifications.set([]);
            }
        });
    }

    private mapExpiringQualifications(data: any[]): ExpiringQualification[] {
        return data.map((item: any) => ({
            id: item.id || item.id_qualif,
            employee_id: item.employee_id || item.Id_Emp,
            employee_name: item.employee_name || item.full_name ||
                (item.Employee ? `${item.Employee.Prenom_Emp || ''} ${item.Employee.Nom_Emp || ''}`.trim() : ''),
            employee_badge: item.employee_badge || item.badge,
            formation_name: item.formation_name || item.Formation?.name_formation || '',
            formation_id: item.formation_id || item.id_formation,
            start_date: new Date(item.start_date || item.start_qualif),
            end_date: new Date(item.end_date || item.end_qualif),
            days_remaining: item.days_remaining ?? item.days_until_expiry ?? 0,
            is_expired: item.is_expired ?? (item.days_remaining < 0),
            trainer_name: item.trainer_name || item.TrainerName,
            test_result: item.test_result
        })).sort((a: ExpiringQualification, b: ExpiringQualification) => a.days_remaining - b.days_remaining);
    }

    onSearch(): void {
        // Trigger computed recalculation
        this.qualifications.update(q => [...q]);
    }

    filterExpired(): void {
        this.activeFilter = 'Expirées';
        this.qualifications.update(q => [...q]);
    }

    filterDueSoon(): void {
        this.activeFilter = 'Expire Bientôt';
        this.qualifications.update(q => [...q]);
    }

    filterUpcoming(): void {
        this.activeFilter = 'À Venir';
        this.qualifications.update(q => [...q]);
    }

    clearFilter(): void {
        this.activeFilter = null;
        this.searchTerm = '';
        this.qualifications.update(q => [...q]);
    }

    getExpiredDashArray(): string {
        const total = this.qualifications().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.expiredCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getDueSoonDashArray(): string {
        const total = this.qualifications().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.dueSoonCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getUpcomingDashArray(): string {
        const total = this.qualifications().length || 1;
        const circumference = 2 * Math.PI * 40;
        const progress = (this.upcomingCount() / total) * circumference;
        return `${progress}, ${circumference}`;
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    getDaysClass(qual: ExpiringQualification): string {
        if (qual.is_expired) return 'overdue';
        if (qual.days_remaining <= 30) return 'due-soon';
        if (qual.days_remaining <= 90) return 'upcoming';
        return 'ok';
    }

    getDaysIcon(qual: ExpiringQualification): string {
        if (qual.is_expired) return 'pi pi-exclamation-circle';
        if (qual.days_remaining <= 30) return 'pi pi-clock';
        return 'pi pi-calendar';
    }

    getDaysProgress(qual: ExpiringQualification): number {
        if (qual.is_expired) return 100;
        const maxDays = 90;
        return Math.max(0, Math.min(100, ((maxDays - qual.days_remaining) / maxDays) * 100));
    }

    formatDaysRemaining(days: number): string {
        if (days === 0) return "Expire aujourd'hui";
        if (days === 1) return '1 jour restant';
        if (days < 7) return `${days} jours restants`;
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return weeks === 1 ? '1 semaine restante' : `${weeks} semaines restantes`;
        }
        const months = Math.floor(days / 30);
        return months === 1 ? '1 mois restant' : `${months} mois restants`;
    }

    formatDaysOverdue(days: number): string {
        const absDays = Math.abs(days);
        if (absDays === 0) return "Expiré aujourd'hui";
        if (absDays === 1) return 'Expiré depuis 1 jour';
        if (absDays < 7) return `Expiré depuis ${absDays} jours`;
        if (absDays < 30) {
            const weeks = Math.floor(absDays / 7);
            return weeks === 1 ? 'Expiré depuis 1 semaine' : `Expiré depuis ${weeks} semaines`;
        }
        const months = Math.floor(absDays / 30);
        return months === 1 ? 'Expiré depuis 1 mois' : `Expiré depuis ${months} mois`;
    }

    getStatusLabel(qual: ExpiringQualification): string {
        if (qual.is_expired) return 'Expiré';
        if (qual.days_remaining <= 7) return 'Urgent';
        if (qual.days_remaining <= 30) return 'Bientôt';
        return 'À Venir';
    }

    getStatusSeverity(qual: ExpiringQualification): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        if (qual.is_expired) return 'danger';
        if (qual.days_remaining <= 7) return 'danger';
        if (qual.days_remaining <= 30) return 'warn';
        return 'info';
    }

    onScheduleRecyclage(qual: ExpiringQualification): void {
        this.scheduleRecyclage.emit(qual);
    }
}
