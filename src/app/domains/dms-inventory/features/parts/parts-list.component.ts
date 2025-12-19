/**
 * Parts List Component
 * Domain: DMS-Inventory
 *
 * Displays and manages inventory parts
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
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';

// Domain imports
import { DmsInventoryService, InventoryItem, Location } from '@domains/dms-inventory';

@Component({
    selector: 'app-parts-list',
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
        InputTextModule,
        InputNumberModule,
        DialogModule
    ],
    template: `
        <div class="parts-list">
            <p-card>
                <ng-template pTemplate="header">
                    <p-toolbar styleClass="border-none bg-transparent">
                        <ng-template #start>
                            <span class="text-xl font-semibold">
                                <i class="pi pi-box mr-2"></i>Parts Inventory
                            </span>
                        </ng-template>
                        <ng-template #end>
                            <div class="flex gap-2 flex-wrap align-items-center">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input pInputText [(ngModel)]="searchText"
                                           (input)="applyFilters()"
                                           placeholder="Search parts...">
                                </span>
                                <p-select [options]="categoryOptions" [(ngModel)]="filterCategory"
                                          placeholder="Category" [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <p-select [options]="stockStatusOptions" [(ngModel)]="filterStockStatus"
                                          placeholder="Stock Status" [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <p-select [options]="locations" [(ngModel)]="filterLocation"
                                          optionLabel="name" optionValue="id"
                                          placeholder="Location" [showClear]="true"
                                          (onChange)="applyFilters()">
                                </p-select>
                                <button pButton icon="pi pi-plus" label="Add Part"
                                        (click)="openAddDialog()">
                                </button>
                            </div>
                        </ng-template>
                    </p-toolbar>
                </ng-template>

                <p-table [value]="filteredParts"
                         [loading]="loading"
                         [paginator]="true"
                         [rows]="15"
                         [rowsPerPageOptions]="[10, 15, 25, 50]"
                         [rowHover]="true"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
                         [globalFilterFields]="['PN', 'PNDESC']"
                         styleClass="p-datatable-sm p-datatable-gridlines">

                    <ng-template pTemplate="caption">
                        <div class="flex justify-content-between align-items-center">
                            <div class="summary-stats">
                                <span class="stat-item">
                                    <i class="pi pi-list"></i>
                                    Total: <strong>{{ filteredParts.length }}</strong>
                                </span>
                                <span class="stat-item">
                                    <i class="pi pi-euro"></i>
                                    Value: <strong>{{ getTotalValue() | currency:'EUR':'symbol':'1.0-0' }}</strong>
                                </span>
                                <span class="stat-item text-red-500">
                                    <i class="pi pi-exclamation-triangle"></i>
                                    Low Stock: <strong>{{ getLowStockCount() }}</strong>
                                </span>
                            </div>
                        </div>
                    </ng-template>

                    <ng-template pTemplate="header">
                        <tr>
                            <th pSortableColumn="PN" style="width: 140px">
                                Part Number <p-sortIcon field="PN"></p-sortIcon>
                            </th>
                            <th pSortableColumn="PNDESC">
                                Description <p-sortIcon field="PNDESC"></p-sortIcon>
                            </th>
                            <th style="width: 100px">Category</th>
                            <th style="width: 80px">Unit</th>
                            <th pSortableColumn="TOTALSTOCK" class="text-center" style="width: 100px">
                                Stock <p-sortIcon field="TOTALSTOCK"></p-sortIcon>
                            </th>
                            <th class="text-center" style="width: 80px">Min</th>
                            <th pSortableColumn="PRICE" class="text-right" style="width: 100px">
                                Price <p-sortIcon field="PRICE"></p-sortIcon>
                            </th>
                            <th class="text-right" style="width: 120px">Value</th>
                            <th class="text-center" style="width: 100px">Status</th>
                            <th style="width: 120px">Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-part>
                        <tr>
                            <td>
                                <span class="part-number">{{ part.PN }}</span>
                            </td>
                            <td>
                                <span [pTooltip]="part.PNDESC" tooltipPosition="top">
                                    {{ truncateText(part.PNDESC, 35) }}
                                </span>
                            </td>
                            <td>
                                <p-tag [value]="part.category || 'General'" severity="info"
                                       styleClass="text-xs">
                                </p-tag>
                            </td>
                            <td class="text-center">{{ part.UNIT }}</td>
                            <td class="text-center">
                                <span class="stock-value" [ngClass]="getStockClass(part)">
                                    {{ part.TOTALSTOCK }}
                                </span>
                            </td>
                            <td class="text-center text-color-secondary">
                                {{ part.minStock || 10 }}
                            </td>
                            <td class="text-right">
                                {{ part.PRICE | currency:'EUR':'symbol':'1.2-2' }}
                            </td>
                            <td class="text-right font-semibold">
                                {{ (part.TOTALSTOCK * part.PRICE) | currency:'EUR':'symbol':'1.0-0' }}
                            </td>
                            <td class="text-center">
                                <p-tag [value]="getStockStatus(part)"
                                       [severity]="getStockStatusSeverity(part)">
                                </p-tag>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button pButton icon="pi pi-eye"
                                            class="p-button-text p-button-sm"
                                            (click)="viewPart(part)" pTooltip="View">
                                    </button>
                                    <button pButton icon="pi pi-pencil"
                                            class="p-button-text p-button-sm"
                                            (click)="editPart(part)" pTooltip="Edit">
                                    </button>
                                    <button pButton icon="pi pi-plus"
                                            class="p-button-text p-button-sm p-button-success"
                                            (click)="addStock(part)" pTooltip="Add Stock">
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="10" class="text-center p-4">
                                <i class="pi pi-search text-4xl text-color-secondary mb-2"></i>
                                <p class="font-semibold">No Parts Found</p>
                                <p class="text-sm text-color-secondary">
                                    No parts match your search criteria.
                                </p>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </p-card>

            <!-- Add Stock Dialog -->
            <p-dialog [(visible)]="stockDialogVisible" [modal]="true"
                      header="Add Stock Entry" [style]="{ width: '500px' }">
                <div class="grid p-fluid" *ngIf="selectedPart">
                    <div class="col-12">
                        <div class="part-info mb-3">
                            <span class="part-number-large">{{ selectedPart.PN }}</span>
                            <p class="text-color-secondary mt-1">{{ selectedPart.PNDESC }}</p>
                            <p class="mt-2">
                                Current Stock: <strong>{{ selectedPart.TOTALSTOCK }} {{ selectedPart.UNIT }}</strong>
                            </p>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Quantity *</label>
                        <p-inputNumber [(ngModel)]="stockEntry.quantity" [min]="1"
                                       [showButtons]="true">
                        </p-inputNumber>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Batch Number</label>
                        <input pInputText [(ngModel)]="stockEntry.batchNo"
                               placeholder="Enter batch no.">
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Supplier</label>
                        <input pInputText [(ngModel)]="stockEntry.supplier"
                               placeholder="Supplier name">
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block mb-2 font-medium">Location</label>
                        <p-select [options]="locations" [(ngModel)]="stockEntry.location"
                                  optionLabel="name" optionValue="id"
                                  placeholder="Select Location">
                        </p-select>
                    </div>
                    <div class="col-12">
                        <label class="block mb-2 font-medium">Comment</label>
                        <input pInputText [(ngModel)]="stockEntry.comment"
                               placeholder="Optional comment">
                    </div>
                </div>
                <ng-template pTemplate="footer">
                    <button pButton label="Cancel" icon="pi pi-times"
                            class="p-button-text" (click)="stockDialogVisible = false">
                    </button>
                    <button pButton label="Add Stock" icon="pi pi-check"
                            (click)="saveStockEntry()" [disabled]="!stockEntry.quantity">
                    </button>
                </ng-template>
            </p-dialog>

            <!-- View Part Dialog -->
            <p-dialog [(visible)]="viewDialogVisible" [modal]="true"
                      header="Part Details" [style]="{ width: '600px' }">
                <div class="part-details" *ngIf="viewingPart">
                    <div class="detail-header">
                        <span class="part-number-large">{{ viewingPart.PN }}</span>
                        <p-tag [value]="getStockStatus(viewingPart)"
                               [severity]="getStockStatusSeverity(viewingPart)">
                        </p-tag>
                    </div>

                    <p class="text-lg mt-2">{{ viewingPart.PNDESC }}</p>

                    <div class="detail-grid mt-4">
                        <div class="detail-item">
                            <span class="detail-label">Current Stock</span>
                            <span class="detail-value text-2xl font-bold">
                                {{ viewingPart.TOTALSTOCK }} {{ viewingPart.UNIT }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Minimum Level</span>
                            <span class="detail-value">{{ viewingPart.MinStock || 10 }} {{ viewingPart.UNIT }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Unit Price</span>
                            <span class="detail-value">{{ viewingPart.PRICE | currency:'EUR' }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Total Value</span>
                            <span class="detail-value font-bold">
                                {{ (viewingPart.TOTALSTOCK * viewingPart.PRICE) | currency:'EUR' }}
                            </span>
                        </div>
                    </div>
                </div>
            </p-dialog>
        </div>
    `,
    styles: [`
        .parts-list {
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

        .part-number {
            font-family: monospace;
            font-weight: 600;
            color: var(--primary-color);
        }

        .part-number-large {
            font-family: monospace;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .stock-value {
            font-weight: 700;
            font-size: 1.1rem;

            &.critical { color: var(--red-500); }
            &.low { color: var(--orange-500); }
            &.normal { color: var(--green-600); }
        }

        .action-buttons {
            display: flex;
            gap: 0.25rem;
        }

        .part-info {
            padding: 1rem;
            background: var(--surface-ground);
            border-radius: 8px;
        }

        .part-details {
            .detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .detail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
            }

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .detail-label {
                font-size: 0.75rem;
                font-weight: 500;
                color: var(--text-color-secondary);
                text-transform: uppercase;
            }

            .detail-value {
                font-size: 1rem;
            }
        }
    `]
})
export class PartsListComponent implements OnInit, OnDestroy {
    @Input() parts: InventoryItem[] = [];
    @Input() locations: Location[] = [];
    @Input() loading = false;

    @Output() add = new EventEmitter<Partial<InventoryItem>>();
    @Output() edit = new EventEmitter<InventoryItem>();
    @Output() stockAdded = new EventEmitter<any>();

    private destroy$ = new Subject<void>();

    filteredParts: InventoryItem[] = [];
    searchText = '';
    filterCategory: string | null = null;
    filterStockStatus: string | null = null;
    filterLocation: number | null = null;

    categoryOptions = [
        { label: 'Mechanical', value: 'Mechanical' },
        { label: 'Electrical', value: 'Electrical' },
        { label: 'Electronics', value: 'Electronics' },
        { label: 'Consumables', value: 'Consumables' },
        { label: 'Safety', value: 'Safety' }
    ];

    stockStatusOptions = [
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Low Stock', value: 'low_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' }
    ];

    // Stock entry dialog
    stockDialogVisible = false;
    selectedPart: InventoryItem | null = null;
    stockEntry = {
        quantity: 1,
        batchNo: '',
        supplier: '',
        location: null,
        comment: ''
    };

    // View dialog
    viewDialogVisible = false;
    viewingPart: InventoryItem | null = null;

    constructor(private inventoryService: DmsInventoryService) {}

    ngOnInit(): void {
        if (this.parts.length === 0) {
            this.loadParts();
        } else {
            this.filteredParts = [...this.parts];
        }

        if (this.locations.length === 0) {
            this.loadLocations();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadParts(): void {
        this.loading = true;
        this.inventoryService.getItems()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data: InventoryItem[]) => {
                    this.parts = data;
                    this.filteredParts = [...data];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadLocations(): void {
        this.inventoryService.getLocations()
            .pipe(takeUntil(this.destroy$))
            .subscribe(locations => this.locations = locations);
    }

    applyFilters(): void {
        let filtered = [...this.parts];

        if (this.searchText) {
            const search = this.searchText.toLowerCase();
            filtered = filtered.filter(p =>
                p.PN.toLowerCase().includes(search) ||
                p.PNDESC.toLowerCase().includes(search)
            );
        }

        if (this.filterCategory) {
            filtered = filtered.filter(p => (p as any).category === this.filterCategory);
        }

        if (this.filterStockStatus) {
            filtered = filtered.filter(p => {
                const status = this.getStockStatusValue(p);
                return status === this.filterStockStatus;
            });
        }

        this.filteredParts = filtered;
    }

    private getStockStatusValue(part: InventoryItem): string {
        const minStock = (part as any).minStock || 10;
        if (part.TOTALSTOCK === 0) return 'out_of_stock';
        if (part.TOTALSTOCK < minStock) return 'low_stock';
        return 'in_stock';
    }

    getTotalValue(): number {
        return this.filteredParts.reduce((sum, p) => sum + (p.TOTALSTOCK * p.PRICE), 0);
    }

    getLowStockCount(): number {
        return this.filteredParts.filter(p => {
            const minStock = (p as any).minStock || 10;
            return p.TOTALSTOCK < minStock;
        }).length;
    }

    truncateText(text: string, length: number): string {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getStockClass(part: InventoryItem): string {
        const minStock = (part as any).minStock || 10;
        if (part.TOTALSTOCK === 0) return 'critical';
        if (part.TOTALSTOCK < minStock) return 'low';
        return 'normal';
    }

    getStockStatus(part: InventoryItem): string {
        const minStock = (part as any).minStock || 10;
        if (part.TOTALSTOCK === 0) return 'Out of Stock';
        if (part.TOTALSTOCK < minStock) return 'Low Stock';
        return 'In Stock';
    }

    getStockStatusSeverity(part: InventoryItem): 'success' | 'warn' | 'danger' {
        const minStock = (part as any).minStock || 10;
        if (part.TOTALSTOCK === 0) return 'danger';
        if (part.TOTALSTOCK < minStock) return 'warn';
        return 'success';
    }

    openAddDialog(): void {
        this.add.emit({});
    }

    viewPart(part: InventoryItem): void {
        this.viewingPart = part;
        this.viewDialogVisible = true;
    }

    editPart(part: InventoryItem): void {
        this.edit.emit(part);
    }

    addStock(part: InventoryItem): void {
        this.selectedPart = part;
        this.stockEntry = {
            quantity: 1,
            batchNo: '',
            supplier: '',
            location: null,
            comment: ''
        };
        this.stockDialogVisible = true;
    }

    saveStockEntry(): void {
        if (!this.selectedPart || !this.stockEntry.quantity) return;

        const entry = {
            PN: this.selectedPart.PN,
            QTY: this.stockEntry.quantity,
            BATCHNO: this.stockEntry.batchNo,
            SUNO: this.stockEntry.supplier,
            AREA: this.stockEntry.location,
            COMMENT: this.stockEntry.comment
        };

        this.stockAdded.emit(entry);
        this.stockDialogVisible = false;
        this.loadParts();
    }
}
