import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { forkJoin } from 'rxjs';
import { ProductionService } from '../../../core/services/production.service';
import { ExportService } from '../../../core/services/export.service';

interface Machine {
    id?: number;
    name: string;
    workstation: number;
    workstation_name?: string;
    description?: string;
    manufacturer?: string;
    model_number?: string;
    serial_number?: string;
    status: 'operational' | 'maintenance' | 'breakdown' | 'idle';
    is_active: boolean;
}

@Component({
    selector: 'app-machines',
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
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-cog mr-2"></i>Machines Management
                    </h2>
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
                        label="New Machine"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadData()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                #dt
                [value]="machines"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                [globalFilterFields]="['name', 'workstation_name', 'status', 'manufacturer', 'model_number']"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} machines"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="caption">
                    <div class="flex justify-between items-center">
                        <span class="text-xl font-semibold">Machines List</span>
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search"></p-inputicon>
                            <input
                                pInputText
                                type="text"
                                (input)="onGlobalFilter(dt, $event)"
                                placeholder="Search machines..."
                                class="w-full sm:w-auto" />
                        </p-iconfield>
                    </div>
                </ng-template>

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Workstation</th>
                        <th style="width: 120px">Status</th>
                        <th style="width: 80px">Active</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-machine>
                    <tr>
                        <td>{{ machine.id }}</td>
                        <td>{{ machine.name }}</td>
                        <td>{{ machine.workstation_name || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="machine.status"
                                [severity]="getStatusSeverity(machine.status)">
                            </p-tag>
                        </td>
                        <td>
                            <i [class]="machine.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editMachine(machine)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(machine)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No machines found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="machineDialog"
            [style]="{width: '600px'}"
            [header]="editMode ? 'Edit Machine' : 'New Machine'"
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
                            [(ngModel)]="machine.name"
                            required
                            placeholder="Machine Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !machine.name}" />
                        <small class="error-message" *ngIf="submitted && !machine.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="workstation">Workstation <span class="required">*</span></label>
                        <p-select
                            id="workstation"
                            [(ngModel)]="machine.workstation"
                            [options]="workstations"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Workstation"
                            [filter]="true"
                            filterBy="name"
                            [showClear]="true"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !machine.workstation}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !machine.workstation">Workstation is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="status">Status <span class="required">*</span></label>
                        <p-select
                            id="status"
                            [(ngModel)]="machine.status"
                            [options]="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Status">
                        </p-select>
                    </div>

                    <div class="form-field">
                        <label for="manufacturer">Manufacturer</label>
                        <input
                            type="text"
                            pInputText
                            id="manufacturer"
                            [(ngModel)]="machine.manufacturer"
                            placeholder="Manufacturer name" />
                    </div>

                    <div class="form-field">
                        <label for="modelNumber">Model Number</label>
                        <input
                            type="text"
                            pInputText
                            id="modelNumber"
                            [(ngModel)]="machine.model_number"
                            placeholder="Model number" />
                    </div>

                    <div class="form-field">
                        <label for="serialNumber">Serial Number</label>
                        <input
                            type="text"
                            pInputText
                            id="serialNumber"
                            [(ngModel)]="machine.serial_number"
                            placeholder="Serial number" />
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="machine.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>

                <div class="form-field" style="margin-top: 1rem;">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="machine.description"
                        rows="2"
                        placeholder="Description (optional)">
                    </textarea>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveMachine()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }
    `]
})
export class MachinesComponent implements OnInit {
    machines: Machine[] = [];
    workstations: any[] = [];
    machine: Partial<Machine> = {};
    exportMenuItems: MenuItem[] = [];

    machineDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    statusOptions = [
        { label: 'Operational', value: 'operational' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Breakdown', value: 'breakdown' },
        { label: 'Idle', value: 'idle' }
    ];

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private cdr: ChangeDetectorRef,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
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
        const data = this.machines.map(m => ({
            ID: m.id,
            Name: m.name,
            Workstation: m.workstation_name || '',
            Manufacturer: m.manufacturer || '',
            Model: m.model_number || '',
            Status: m.status,
            Active: m.is_active ? 'Yes' : 'No'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(data, `machines-export-${timestamp}`, 'Machines');
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    exportToCsv(): void {
        const data = this.machines.map(m => ({
            ID: m.id,
            Name: m.name,
            Workstation: m.workstation_name || '',
            Manufacturer: m.manufacturer || '',
            Model: m.model_number || '',
            Status: m.status,
            Active: m.is_active ? 'Yes' : 'No'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(data, `machines-export-${timestamp}`);
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    loadData(): void {
        this.loading = true;
        this.cdr.markForCheck();

        forkJoin({
            workstations: this.productionService.getWorkstations(),
            machines: this.productionService.getMachines()
        }).subscribe({
            next: ({ workstations, machines }: any) => {
                this.workstations = (workstations.results || workstations).map((w: any) => ({
                    id: w.id,
                    name: w.name
                }));
                this.machines = machines.results || machines;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load machines' });
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    onGlobalFilter(table: any, event: Event): void {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        const map: any = {
            'operational': 'success',
            'idle': 'info',
            'maintenance': 'warn',
            'breakdown': 'danger'
        };
        return map[status] || 'info';
    }

    openNew(): void {
        this.machine = {
            name: '',
            workstation: undefined,
            status: 'operational',
            is_active: true
        };
        this.editMode = false;
        this.submitted = false;
        this.machineDialog = true;
    }

    editMachine(machine: Machine): void {
        this.machine = { ...machine };
        this.editMode = true;
        this.submitted = false;
        this.machineDialog = true;
    }

    hideDialog(): void {
        this.machineDialog = false;
        this.submitted = false;
    }

    saveMachine(): void {
        this.submitted = true;

        if (!this.machine.name || !this.machine.workstation) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        if (this.editMode && this.machine.id) {
            this.productionService.updateMachine(this.machine.id, this.machine).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Machine updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update' });
                    this.cdr.markForCheck();
                }
            });
        } else {
            this.productionService.createMachine(this.machine).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Machine created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to create' });
                    this.cdr.markForCheck();
                }
            });
        }
    }

    confirmDelete(machine: Machine): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${machine.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deleteMachine(machine)
        });
    }

    deleteMachine(machine: Machine): void {
        if (!machine.id) return;
        this.productionService.deleteMachine(machine.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Machine deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
                this.cdr.markForCheck();
            }
        });
    }
}
