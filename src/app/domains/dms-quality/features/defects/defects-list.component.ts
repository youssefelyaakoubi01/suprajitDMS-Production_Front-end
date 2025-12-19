/**
 * Defects List Component
 * Domain: DMS-Quality
 *
 * Displays and manages quality defect records
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';

// Domain imports
import { DmsQualityService, QualityDefect, DefectType } from '@domains/dms-quality';

interface DefectWithDetails extends QualityDefect {
    defectCode?: string;
    defectDescription?: string;
    workstationName?: string;
    partNumber?: string;
}

@Component({
    selector: 'app-defects-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToolbarModule,
        SelectModule,
        DatePickerModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule
    ],
    template: `
        <div class="defects-list">
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none bg-transparent">
                        <ng-template #start>
                            <span class="text-xl font-semibold">
                                <i class="pi pi-exclamation-triangle mr-2 text-red-500"></i>
                                Defect Records
                            </span>
                        </ng-template>
                        <ng-template #end>
                            <div class="flex gap-2 align-items-center flex-wrap">
                                <p-datepicker [(ngModel)]="filterDate" [showIcon]="true"
                                              placeholder="Filter by Date"
                                              (onSelect)="applyFilters()" dateFormat="dd/mm/yy">
                                </p-datepicker>
                                <p-select [options]="defectTypes" [(ngModel)]="filterDefectType"
                                          optionLabel="Description_DefectType"
                                          optionValue="Id_DefectType"
                                          placeholder="Defect Type"
                                          [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <button pButton icon="pi pi-plus" label="Add Defect"
                                        (click)="openAddDialog()">
                                </button>
                            </div>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="filteredDefects"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="15"
                         [rowsPerPageOptions]="[10, 15, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} defects"
                         [globalFilterFields]="['defectCode', 'defectDescription', 'workstationName']"
                         styleClass="p-datatable-sm p-datatable-gridlines">

                    <ng-template pTemplate="caption">
                        <div class="flex justify-content-between align-items-center">
                            <div class="summary-stats">
                                <span class="stat-item">
                                    <i class="pi pi-list text-primary"></i>
                                    Total: <strong>{{ filteredDefects.length }}</strong>
                                </span>
                                <span class="stat-item">
                                    <i class="pi pi-box text-orange-500"></i>
                                    Qty: <strong>{{ getTotalQuantity() }}</strong>
                                </span>
                            </div>
                            <span class="p-input-icon-left">
                                <i class="pi pi-search"></i>
                                <input pInputText type="text" [(ngModel)]="searchText"
                                       (input)="applyFilters()" placeholder="Search defects...">
                            </span>
                        </div>
                    </ng-template>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="DateDefect">
                                Date <p-sortIcon field="DateDefect"></p-sortIcon>
                            </th>
                            <th pSortableColumn="defectCode">
                                Code <p-sortIcon field="defectCode"></p-sortIcon>
                            </th>
                            <th>Description</th>
                            <th>Part Number</th>
                            <th pSortableColumn="Qty_Defect" class="text-center">
                                Qty <p-sortIcon field="Qty_Defect"></p-sortIcon>
                            </th>
                            <th>Severity</th>
                            <th>Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-defect>
                        <tr>
                            <td>
                                <span class="font-medium">
                                    {{ defect.DateDefect | date:'dd/MM/yyyy HH:mm' }}
                                </span>
                            </td>
                            <td>
                                <span class="defect-code">{{ defect.defectCode || defect.defect_type?.Code_DefectType || '-' }}</span>
                            </td>
                            <td>
                                <span [pTooltip]="defect.defectDescription || defect.defect_type?.Description_DefectType" tooltipPosition="top">
                                    {{ truncateText(defect.defectDescription || defect.defect_type?.Description_DefectType, 40) }}
                                </span>
                            </td>
                            <td>
                                <span class="text-color-secondary">{{ defect.partNumber || '-' }}</span>
                            </td>
                            <td class="text-center">
                                <span class="qty-badge" [ngClass]="getQtyClass(defect.Qty_Defect)">
                                    {{ defect.Qty_Defect }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="getSeverity(defect)"
                                       [severity]="getSeverityColor(defect)">
                                </p-tag>
                            </td>
                            <td>
                                <button pButton icon="pi pi-eye"
                                        class="p-button-text p-button-sm"
                                        (click)="viewDefect(defect)" pTooltip="View">
                                </button>
                                <button pButton icon="pi pi-pencil"
                                        class="p-button-text p-button-sm"
                                        (click)="editDefect(defect)" pTooltip="Edit">
                                </button>
                                <button pButton icon="pi pi-trash"
                                        class="p-button-text p-button-sm p-button-danger"
                                        (click)="deleteDefect(defect)" pTooltip="Delete">
                                </button>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-4">
                                <i class="pi pi-search text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold">No Defects Found</p>
                                <p class="text-sm text-color-secondary">
                                    No defects match your search criteria.
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Add/Edit Dialog -->
            <p-dialog [(visible)]="dialogVisible" [modal]="true"
                      [header]="editMode ? 'Edit Defect' : 'Add Defect'"
                      [style]="{ width: '600px' }">
                <div class="grid p-fluid">
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Defect Type</label>
                        <p-select [options]="defectTypes" [(ngModel)]="selectedDefect.Id_DefectType"
                                  optionLabel="Description_DefectType" optionValue="Id_DefectType"
                                  placeholder="Select Type">
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Quantity</label>
                        <p-inputNumber [(ngModel)]="selectedDefect.Qty_Defect"
                                       [min]="1" [showButtons]="true">
                        </p-inputNumber>
                    </div>
                    <div class="col-12">
                        <label class="block mb-2 font-medium">Comment</label>
                        <textarea pTextarea [(ngModel)]="selectedDefect.Comment_Defect" rows="3"
                                  placeholder="Additional notes..."></textarea>
                    </div>
                </div>
                <ng-template pTemplate="footer">
                    <button pButton label="Cancel" icon="pi pi-times"
                            class="p-button-text" (click)="dialogVisible = false">
                    </button>
                    <button pButton [label]="editMode ? 'Update' : 'Save'" icon="pi pi-check"
                            (click)="saveDefect()"
                            [disabled]="!selectedDefect.Id_DefectType || !selectedDefect.Qty_Defect">
                    </button>
                </ng-template>
            </p-dialog>

            <!-- View Dialog -->
            <p-dialog [(visible)]="viewDialogVisible" [modal]="true"
                      header="Defect Details" [style]="{ width: '500px' }">
                <div class="defect-details" *ngIf="viewingDefect">
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">
                            {{ viewingDefect.DateDefect | date:'dd/MM/yyyy HH:mm' }}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Code:</span>
                        <span class="detail-value defect-code">{{ viewingDefect.defectCode || viewingDefect.defect_type?.Code_DefectType }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Description:</span>
                        <span class="detail-value">{{ viewingDefect.defectDescription || viewingDefect.defect_type?.Description_DefectType }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Part Number:</span>
                        <span class="detail-value">{{ viewingDefect.partNumber || '-' }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Quantity:</span>
                        <span class="detail-value text-xl font-bold">{{ viewingDefect.Qty_Defect }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Severity:</span>
                        <p-tag [value]="getSeverity(viewingDefect)"
                               [severity]="getSeverityColor(viewingDefect)">
                        </p-tag>
                    </div>
                    <div class="detail-row" *ngIf="viewingDefect.Comment_Defect">
                        <span class="detail-label">Comment:</span>
                        <span class="detail-value">{{ viewingDefect.Comment_Defect }}</span>
                    </div>
                </div>
            </p-dialog>
        </div>
    `,
    styles: [`
        .defects-list {
            padding: 1rem;
        }

        .summary-stats {
            display: flex;
            gap: 1.5rem;

            .stat-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
        }

        .defect-code {
            font-family: monospace;
            font-weight: 600;
            color: var(--red-600);
            background: var(--red-50);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }

        .qty-badge {
            display: inline-block;
            min-width: 40px;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-weight: 700;
            text-align: center;

            &.low {
                background: var(--green-100);
                color: var(--green-700);
            }
            &.medium {
                background: var(--orange-100);
                color: var(--orange-700);
            }
            &.high {
                background: var(--red-100);
                color: var(--red-700);
            }
        }

        .defect-details {
            .detail-row {
                display: flex;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--surface-border);

                &:last-child {
                    border-bottom: none;
                }
            }

            .detail-label {
                width: 120px;
                font-weight: 500;
                color: var(--text-color-secondary);
            }

            .detail-value {
                flex: 1;
                color: var(--text-color);
            }
        }
    `]
})
export class DefectsListComponent implements OnInit, OnDestroy {
    @Input() defects: DefectWithDetails[] = [];
    @Input() defectTypes: DefectType[] = [];
    @Input() loading = false;

    @Output() add = new EventEmitter<Partial<QualityDefect>>();
    @Output() edit = new EventEmitter<QualityDefect>();
    @Output() delete = new EventEmitter<QualityDefect>();

    private destroy$ = new Subject<void>();

    filteredDefects: DefectWithDetails[] = [];
    searchText = '';
    filterDate: Date | null = null;
    filterDefectType: number | null = null;

    // Dialog
    dialogVisible = false;
    editMode = false;
    selectedDefect: Partial<DefectWithDetails> = {};

    // View dialog
    viewDialogVisible = false;
    viewingDefect: DefectWithDetails | null = null;

    constructor(private qualityService: DmsQualityService) {}

    ngOnInit(): void {
        if (this.defects.length === 0) {
            this.loadDefects();
        } else {
            this.filteredDefects = [...this.defects];
        }

        if (this.defectTypes.length === 0) {
            this.loadDefectTypes();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadDefects(): void {
        this.loading = true;
        this.qualityService.getDefects()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.defects = data as DefectWithDetails[];
                    this.filteredDefects = [...this.defects];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadDefectTypes(): void {
        this.qualityService.getDefectTypes()
            .pipe(takeUntil(this.destroy$))
            .subscribe(types => this.defectTypes = types);
    }

    applyFilters(): void {
        let filtered = [...this.defects];

        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            filtered = filtered.filter(d =>
                d.defectCode?.toLowerCase().includes(search) ||
                d.defectDescription?.toLowerCase().includes(search) ||
                d.defect_type?.Description_DefectType?.toLowerCase().includes(search)
            );
        }

        if (this.filterDate) {
            const filterDateStr = this.filterDate.toDateString();
            filtered = filtered.filter(d =>
                new Date(d.DateDefect).toDateString() === filterDateStr
            );
        }

        if (this.filterDefectType) {
            filtered = filtered.filter(d => d.Id_DefectType === this.filterDefectType);
        }

        this.filteredDefects = filtered;
    }

    getTotalQuantity(): number {
        return this.filteredDefects.reduce((sum, d) => sum + d.Qty_Defect, 0);
    }

    truncateText(text: string | undefined, length: number): string {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getQtyClass(qty: number): string {
        if (qty <= 2) return 'low';
        if (qty <= 5) return 'medium';
        return 'high';
    }

    getSeverity(defect: DefectWithDetails): string {
        if (defect.Qty_Defect >= 10) return 'Critical';
        if (defect.Qty_Defect >= 5) return 'Major';
        return 'Minor';
    }

    getSeverityColor(defect: DefectWithDetails): 'success' | 'info' | 'warn' | 'danger' {
        if (defect.Qty_Defect >= 10) return 'danger';
        if (defect.Qty_Defect >= 5) return 'warn';
        return 'info';
    }

    openAddDialog(): void {
        this.editMode = false;
        this.selectedDefect = {
            Qty_Defect: 1
        };
        this.dialogVisible = true;
    }

    viewDefect(defect: DefectWithDetails): void {
        this.viewingDefect = defect;
        this.viewDialogVisible = true;
    }

    editDefect(defect: DefectWithDetails): void {
        this.editMode = true;
        this.selectedDefect = { ...defect };
        this.dialogVisible = true;
    }

    deleteDefect(defect: QualityDefect): void {
        this.delete.emit(defect);
    }

    saveDefect(): void {
        if (this.editMode) {
            this.edit.emit(this.selectedDefect as QualityDefect);
        } else {
            this.add.emit(this.selectedDefect);
        }
        this.dialogVisible = false;
        this.loadDefects();
    }
}
