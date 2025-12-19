/**
 * Recyclage List Component
 * Domain: DMS-RH
 *
 * Displays employees requiring retraining (recyclage)
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
        SkeletonModule
    ],
    template: `
        <div class="recyclage-list">
            <!-- Stats Cards -->
            <div class="stats-row mb-4">
                <p-card styleClass="stat-card overdue">
                    <div class="stat-content">
                        <i class="pi pi-exclamation-triangle"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ overdueCount }}</span>
                            <span class="stat-label">Overdue</span>
                        </div>
                    </div>
                </p-card>
                <p-card styleClass="stat-card due-soon">
                    <div class="stat-content">
                        <i class="pi pi-clock"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ dueSoonCount }}</span>
                            <span class="stat-label">Due Soon (30 days)</span>
                        </div>
                    </div>
                </p-card>
                <p-card styleClass="stat-card upcoming">
                    <div class="stat-content">
                        <i class="pi pi-calendar"></i>
                        <div class="stat-info">
                            <span class="stat-value">{{ upcomingCount }}</span>
                            <span class="stat-label">Upcoming (90 days)</span>
                        </div>
                    </div>
                </p-card>
            </div>

            <!-- Employees Table -->
            <p-card>
                <ng-template pTemplate="header">
                    <div class="flex justify-content-between align-items-center p-3">
                        <span class="text-xl font-semibold">Employees Requiring Recyclage</span>
                        <button pButton icon="pi pi-refresh" label="Refresh"
                                class="p-button-text" (click)="loadData()">
                        </button>
                    </div>
                </ng-template>

                <p-table [value]="employees"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="10"
                         [rowHover]="true"
                         styleClass="p-datatable-sm">

                    <ng-template pTemplate="header">
                        <tr>
                            <th>Employee</th>
                            <th pSortableColumn="DateEmbauche_Emp">Hire Date</th>
                            <th pSortableColumn="lastQualificationDate">Last Qualification</th>
                            <th pSortableColumn="daysUntilRecyclage">Days Until Due</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-emp>
                        <tr>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <p-avatar [label]="getInitials(emp.Employee)"
                                              shape="circle" size="normal">
                                    </p-avatar>
                                    <div>
                                        <div class="font-semibold">
                                            {{ emp.Employee.Nom_Emp }} {{ emp.Employee.Prenom_Emp }}
                                        </div>
                                        <div class="text-sm text-color-secondary">
                                            ID: {{ emp.Id_Emp }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>{{ emp.DateEmbauche_Emp | date:'dd/MM/yyyy' }}</td>
                            <td>{{ emp.lastQualificationDate | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <div class="days-indicator" [class]="getDaysClass(emp)">
                                    {{ emp.isOverdue ? 'Overdue by ' + Math.abs(emp.daysUntilRecyclage) : emp.daysUntilRecyclage }}
                                    <span *ngIf="!emp.isOverdue"> days</span>
                                </div>
                            </td>
                            <td>
                                <p-tag [value]="getStatusLabel(emp)"
                                       [severity]="getStatusSeverity(emp)">
                                </p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-calendar-plus"
                                        class="p-button-text p-button-sm"
                                        (click)="onScheduleRecyclage(emp)"
                                        pTooltip="Schedule Recyclage">
                                </button>
                                <button pButton icon="pi pi-eye"
                                        class="p-button-text p-button-sm"
                                        (click)="onViewEmployee(emp)"
                                        pTooltip="View Details">
                                </button>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6" class="text-center p-4">
                                <i class="pi pi-check-circle text-4xl text-green-500 mb-3"></i>
                                <p>No employees requiring recyclage</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .recyclage-list {
            padding: 1rem;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .stat-card {
            .stat-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.5rem;

                i {
                    font-size: 2rem;
                }

                .stat-info {
                    display: flex;
                    flex-direction: column;

                    .stat-value {
                        font-size: 1.5rem;
                        font-weight: 700;
                    }

                    .stat-label {
                        font-size: 0.875rem;
                        color: var(--text-color-secondary);
                    }
                }
            }

            &.overdue {
                i, .stat-value { color: var(--red-500); }
            }

            &.due-soon {
                i, .stat-value { color: var(--orange-500); }
            }

            &.upcoming {
                i, .stat-value { color: var(--blue-500); }
            }
        }

        .days-indicator {
            font-weight: 600;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;

            &.overdue {
                color: var(--red-500);
                background: var(--red-100);
            }

            &.due-soon {
                color: var(--orange-500);
                background: var(--orange-100);
            }

            &.upcoming {
                color: var(--blue-500);
                background: var(--blue-100);
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
                    this.employees = employees;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
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
        return 'upcoming';
    }

    getStatusLabel(emp: RecyclageEmployee): string {
        if (emp.isOverdue) return 'Overdue';
        if (emp.daysUntilRecyclage <= 30) return 'Due Soon';
        return 'Upcoming';
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
