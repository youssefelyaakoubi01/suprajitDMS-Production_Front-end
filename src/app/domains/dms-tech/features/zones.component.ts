import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { ExportService } from '../../../core/services/export.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

type ZoneType = 'production' | 'maintenance' | 'storage' | 'quality';

interface Zone {
    id?: number;
    name: string;
    zone_type: ZoneType;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

@Component({
    selector: 'app-zones',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        IconFieldModule,
        InputIconModule,
        MenuModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-map mr-2"></i>Zones Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-2">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input
                                pInputText
                                type="text"
                                [(ngModel)]="searchTerm"
                                (ngModelChange)="onSearchChange($event)"
                                placeholder="Search..."
                                class="w-12rem" />
                        </p-iconfield>
                        <p-select
                            [(ngModel)]="selectedTypeFilter"
                            [options]="zoneTypes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="All Types"
                            [showClear]="true"
                            (onChange)="onFilterChange()"
                            styleClass="w-10rem">
                        </p-select>
                        <p-button *ngIf="searchTerm || selectedTypeFilter"
                            icon="pi pi-times"
                            styleClass="p-button-text"
                            (onClick)="clearFilters()">
                        </p-button>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                    <p-button
                        icon="pi pi-download"
                        label="Export"
                        styleClass="p-button-outlined mr-2"
                        (onClick)="exportMenu.toggle($event)">
                    </p-button>
                    <p-button
                        label="New Zone"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadZones()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="filteredZones"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} zones"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Type</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-zone>
                    <tr>
                        <td>{{ zone.id }}</td>
                        <td><strong>{{ zone.name }}</strong></td>
                        <td>
                            <p-tag
                                [value]="getZoneTypeLabel(zone.zone_type)"
                                [severity]="getZoneTypeSeverity(zone.zone_type)">
                            </p-tag>
                        </td>
                        <td>
                            <p-tag
                                [value]="zone.is_active ? 'Active' : 'Inactive'"
                                [severity]="zone.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editZone(zone)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(zone)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No zones found. Click "New Zone" to create one.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="zoneDialog"
            [style]="{width: '500px'}"
            [header]="editMode ? 'Edit Zone' : 'New Zone'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="zone.name"
                            required
                            autofocus
                            placeholder="Zone Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !zone.name}" />
                        <small class="error-message" *ngIf="submitted && !zone.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="zoneType">Zone Type <span class="required">*</span></label>
                        <p-select
                            id="zoneType"
                            [(ngModel)]="zone.zone_type"
                            [options]="zoneTypes"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Type"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !zone.zone_type}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !zone.zone_type">Zone type is required.</small>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="zone.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveZone()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZonesComponent implements OnInit, OnDestroy {
    zones: Zone[] = [];
    filteredZones: Zone[] = [];
    zone: Partial<Zone> = {};
    exportMenuItems: MenuItem[] = [];

    zoneTypes = [
        { label: 'Production', value: 'production' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Storage', value: 'storage' },
        { label: 'Quality', value: 'quality' }
    ];

    zoneDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // Filter properties
    searchTerm = '';
    selectedTypeFilter: string | null = null;
    private searchSubject = new Subject<string>();
    private filterSubject = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        this.setupSearch();
        this.loadData();
        this.initExportMenu();
    }

    private initExportMenu(): void {
        this.exportMenuItems = [
            {
                label: 'Export Excel',
                icon: 'pi pi-file-excel',
                command: () => this.exportToExcel()
            },
            {
                label: 'Export CSV',
                icon: 'pi pi-file',
                command: () => this.exportToCsv()
            }
        ];
    }

    exportToExcel(): void {
        const data = this.filteredZones.map(z => ({
            ID: z.id,
            Name: z.name,
            Type: this.getZoneTypeLabel(z.zone_type),
            Status: z.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(data, `zones-export-${timestamp}`, 'Zones');
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    exportToCsv(): void {
        const data = this.filteredZones.map(z => ({
            ID: z.id,
            Name: z.name,
            Type: this.getZoneTypeLabel(z.zone_type),
            Status: z.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(data, `zones-export-${timestamp}`);
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
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

        // Debounced dropdown filter changes
        this.filterSubject.pipe(
            debounceTime(100),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.applyFilters();
        });
    }

    onSearchChange(value: string): void {
        this.searchSubject.next(value);
    }

    onFilterChange(): void {
        this.filterSubject.next();
    }

    applyFilters(): void {
        let result = [...this.zones];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(item =>
                item.name?.toLowerCase().includes(search)
            );
        }

        if (this.selectedTypeFilter) {
            result = result.filter(item => item.zone_type === this.selectedTypeFilter);
        }

        this.filteredZones = result;
        this.cdr.markForCheck();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedTypeFilter = null;
        this.applyFilters();
    }

    loadData(): void {
        this.loading = true;

        this.productionService.getZones().subscribe({
            next: (data: any) => {
                this.zones = data.results || data;
                this.applyFilters();
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load zones' });
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    loadZones(): void {
        this.loadData();
    }

    getZoneTypeLabel(type: ZoneType): string {
        const found = this.zoneTypes.find(t => t.value === type);
        return found ? found.label : type;
    }

    getZoneTypeSeverity(type: ZoneType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: { [key in ZoneType]: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' } = {
            'production': 'success',
            'maintenance': 'warn',
            'storage': 'info',
            'quality': 'secondary'
        };
        return map[type] || 'info';
    }

    openNew(): void {
        this.zone = {
            name: '',
            zone_type: 'production',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.zoneDialog = true;
    }

    editZone(zone: Zone): void {
        this.zone = { ...zone };
        this.editMode = true;
        this.submitted = false;
        this.zoneDialog = true;
    }

    hideDialog(): void {
        this.zoneDialog = false;
        this.submitted = false;
    }

    saveZone(): void {
        this.submitted = true;

        if (!this.zone.name) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.zone.id) {
            this.productionService.updateZone(this.zone.id, this.zone).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Zone updated successfully' });
                    this.loadZones();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update zone' });
                }
            });
        } else {
            this.productionService.createZone(this.zone).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Zone created successfully' });
                    this.loadZones();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to create zone' });
                }
            });
        }
    }

    confirmDelete(zone: Zone): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the zone "${zone.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteZone(zone)
        });
    }

    deleteZone(zone: Zone): void {
        if (!zone.id) return;
        this.productionService.deleteZone(zone.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Zone deleted successfully' });
                this.loadZones();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }
}
