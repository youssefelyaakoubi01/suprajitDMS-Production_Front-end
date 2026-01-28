/**
 * Production KPI Component
 * Domain: DMS-Maintenance
 *
 * Displays production hours data (Date, HP, temp Ouverture, Week Number)
 * Based on Image 5 - Simple production KPI table
 */
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// PrimeNG v19
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { DatePickerModule } from 'primeng/datepicker';

// Domain imports
import { DmsMaintenanceService } from '../../services/maintenance.service';
import { ProductionKPIData } from '../../models';

@Component({
    selector: 'app-production-kpi',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        ToolbarModule,
        IconFieldModule,
        InputIconModule,
        InputTextModule,
        ToastModule,
        PaginatorModule,
        DatePickerModule
    ],
    providers: [MessageService],
    template: `
        <div class="production-kpi">
            <p-toast></p-toast>

            <p-card styleClass="kpi-table-card">
                <!-- Pagination Header -->
                <ng-template pTemplate="header">
                    <div class="table-header">
                        <div class="pagination-info">
                            <button pButton icon="pi pi-angle-double-left"
                                    class="p-button-text p-button-sm"
                                    [disabled]="currentPage === 1"
                                    (click)="goToPage(1)">
                            </button>
                            <button pButton icon="pi pi-angle-left"
                                    class="p-button-text p-button-sm"
                                    [disabled]="currentPage === 1"
                                    (click)="goToPage(currentPage - 1)">
                            </button>
                            <span class="page-display">{{ currentPage }}</span>
                            <span class="page-text">of {{ totalPages }}</span>
                            <button pButton icon="pi pi-angle-right"
                                    class="p-button-text p-button-sm"
                                    [disabled]="currentPage === totalPages"
                                    (click)="goToPage(currentPage + 1)">
                            </button>
                            <button pButton icon="pi pi-angle-double-right"
                                    class="p-button-text p-button-sm"
                                    [disabled]="currentPage === totalPages"
                                    (click)="goToPage(totalPages)">
                            </button>
                            <button pButton icon="pi pi-plus" class="p-button-text p-button-sm ml-2"
                                    pTooltip="Add new record">
                            </button>
                            <button pButton icon="pi pi-times" class="p-button-text p-button-sm p-button-danger"
                                    pTooltip="Delete">
                            </button>
                            <button pButton icon="pi pi-save" class="p-button-text p-button-sm p-button-success"
                                    pTooltip="Save">
                            </button>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <p-iconfield iconPosition="left">
                                <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                <input pInputText type="text"
                                       [(ngModel)]="searchTerm"
                                       (ngModelChange)="onSearchChange($event)"
                                       placeholder="Search..."
                                       class="w-10rem" />
                            </p-iconfield>
                            <p-datepicker
                                [(ngModel)]="dateRange"
                                selectionMode="range"
                                [readonlyInput]="true"
                                [showIcon]="true"
                                placeholder="Date range"
                                dateFormat="dd/mm/yy"
                                (onSelect)="applyFilters()"
                                (onClear)="applyFilters()"
                                [showClear]="true"
                                styleClass="w-14rem">
                            </p-datepicker>
                            <p-button *ngIf="searchTerm || (dateRange && dateRange.length)"
                                icon="pi pi-times"
                                styleClass="p-button-text"
                                (onClick)="clearFilters()">
                            </p-button>
                        </div>
                    </div>
                </ng-template>

                <!-- Drag Info -->
                <div class="drag-info">
                    <i class="pi pi-info-circle mr-1"></i>
                    Drag a column header here to group by that column
                </div>

                <!-- Data Table -->
                <p-table [value]="filteredProductionData"
                         [loading]="loading"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         [globalFilterFields]="['date', 'hp', 'tempOuverture', 'weekNumber']"
                         styleClass="p-datatable-sm p-datatable-gridlines"
                         [scrollable]="true"
                         scrollHeight="calc(100vh - 280px)"
                         #dt>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="date" style="width: 200px">
                                Date <p-sortIcon field="date"></p-sortIcon>
                            </th>
                            <th pSortableColumn="hp" style="width: 200px">
                                HP <p-sortIcon field="hp"></p-sortIcon>
                            </th>
                            <th pSortableColumn="tempOuverture" style="width: 200px">
                                temp Ouverture <p-sortIcon field="tempOuverture"></p-sortIcon>
                            </th>
                            <th pSortableColumn="weekNumber" style="width: 200px">
                                Week Number <p-sortIcon field="weekNumber"></p-sortIcon>
                            </th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-item let-rowIndex="rowIndex">
                        <tr [class.selected-row]="selectedRowIndex === rowIndex"
                            (click)="selectRow(rowIndex)">
                            <td>
                                <span class="date-value">{{ item.date | date:'dd/MM/yyyy' }}</span>
                            </td>
                            <td class="text-right">
                                <span class="numeric-value">{{ item.hp }}</span>
                            </td>
                            <td class="text-right">
                                <span class="numeric-value">{{ item.tempOuverture }}</span>
                            </td>
                            <td class="text-right">
                                <span class="week-value">{{ item.weekNumber }}</span>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="4" class="text-center p-4">
                                <i class="pi pi-inbox text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold m-0">No production KPI data found</p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>
        </div>
    `,
    styles: [`
        .production-kpi {
            padding: 1rem;
            background: var(--surface-ground);
            min-height: calc(100vh - 120px);
        }

        :host ::ng-deep .kpi-table-card {
            .p-card-header {
                padding: 0;
            }
            .p-card-body {
                padding: 0;
            }
            .p-card-content {
                padding: 0;
            }
        }

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 1rem;
            background: var(--surface-card);
            border-bottom: 1px solid var(--surface-border);
        }

        .pagination-info {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .page-display {
            background: var(--surface-100);
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-weight: 500;
            min-width: 40px;
            text-align: center;
        }

        .page-text {
            color: var(--text-color-secondary);
            font-size: 0.9rem;
            margin: 0 0.25rem;
        }

        .drag-info {
            padding: 0.5rem 1rem;
            background: var(--surface-50);
            font-size: 0.8rem;
            color: var(--text-color-secondary);
            font-style: italic;
            border-bottom: 1px solid var(--surface-border);
        }

        :host ::ng-deep .p-datatable {
            .p-datatable-thead > tr > th {
                background: var(--surface-200);
                font-weight: 600;
                font-size: 0.85rem;
                padding: 0.75rem 1rem;
            }

            .p-datatable-tbody > tr > td {
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }

            .p-datatable-tbody > tr {
                cursor: pointer;
                transition: background-color 0.2s;

                &:hover {
                    background-color: var(--surface-hover);
                }

                &.selected-row {
                    background-color: var(--primary-50);
                }
            }
        }

        .date-value {
            font-weight: 500;
        }

        .numeric-value {
            font-family: monospace;
            font-weight: 500;
        }

        .week-value {
            font-family: monospace;
            font-weight: 600;
            color: var(--primary-color);
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductionKpiComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    productionData: ProductionKPIData[] = [];
    filteredProductionData: ProductionKPIData[] = [];
    loading = false;

    currentPage = 1;
    totalPages = 3;
    selectedRowIndex: number | null = null;

    // Filter properties
    searchTerm = '';
    dateRange: Date[] | null = null;
    private searchSubject = new Subject<string>();

    constructor(
        private maintenanceService: DmsMaintenanceService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    applyFilters(): void {
        let result = [...this.productionData];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.hp?.toString().includes(search) ||
                item.weekNumber?.toString().includes(search) ||
                item.tempOuverture?.toString().includes(search)
            );
        }

        if (this.dateRange && this.dateRange.length === 2 && this.dateRange[0] && this.dateRange[1]) {
            const startDate = new Date(this.dateRange[0]);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(this.dateRange[1]);
            endDate.setHours(23, 59, 59, 999);

            result = result.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        this.filteredProductionData = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.dateRange = null;
        this.applyFilters();
    }

    loadData(): void {
        this.loading = true;
        this.maintenanceService.getProductionKPIData()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.productionData = data;
                    this.applyFilters();
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this.cdr.markForCheck();
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load production KPI data'
                    });
                }
            });
    }

    goToPage(page: number): void {
        this.currentPage = Math.max(1, Math.min(page, this.totalPages));
        this.loadData();
    }

    selectRow(index: number): void {
        this.selectedRowIndex = index;
    }
}
