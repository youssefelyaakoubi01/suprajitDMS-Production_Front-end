import { Component, OnInit } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { forkJoin } from 'rxjs';

type ZoneType = 'production' | 'maintenance' | 'storage' | 'quality';

interface Zone {
    id?: number;
    name: string;
    code: string;
    description?: string;
    project?: number;
    project_name?: string;
    zone_type: ZoneType;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface Project {
    id: number;
    name: string;
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
        TooltipModule
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
                <ng-template pTemplate="right">
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
                [value]="zones"
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
                        <th pSortableColumn="code">Code <p-sortIcon field="code"></p-sortIcon></th>
                        <th pSortableColumn="name">Name <p-sortIcon field="name"></p-sortIcon></th>
                        <th>Project</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-zone>
                    <tr>
                        <td>{{ zone.id }}</td>
                        <td><strong class="text-primary">{{ zone.code }}</strong></td>
                        <td>{{ zone.name }}</td>
                        <td>
                            <p-tag *ngIf="zone.project_name" [value]="zone.project_name" severity="info"></p-tag>
                            <span *ngIf="!zone.project_name" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <p-tag
                                [value]="getZoneTypeLabel(zone.zone_type)"
                                [severity]="getZoneTypeSeverity(zone.zone_type)">
                            </p-tag>
                        </td>
                        <td>{{ zone.description || '-' }}</td>
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
                        <td colspan="8" class="text-center p-4">
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
                        <label for="code">Code <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="code"
                            [(ngModel)]="zone.code"
                            required
                            autofocus
                            placeholder="e.g., ZONE-A"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !zone.code}" />
                        <small class="error-message" *ngIf="submitted && !zone.code">Code is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="name">Name <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="name"
                            [(ngModel)]="zone.name"
                            required
                            placeholder="Zone Name"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !zone.name}" />
                        <small class="error-message" *ngIf="submitted && !zone.name">Name is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="project">Project (Optional)</label>
                        <p-select
                            id="project"
                            [(ngModel)]="zone.project"
                            [options]="projects"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Project"
                            [showClear]="true">
                        </p-select>
                        <small class="help-text">Associate this zone with a project</small>
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

                    <div class="form-field" style="grid-column: 1 / -1;">
                        <label for="description">Description</label>
                        <textarea
                            pInputTextarea
                            id="description"
                            [(ngModel)]="zone.description"
                            rows="2"
                            placeholder="Zone description (optional)">
                        </textarea>
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
    `]
})
export class ZonesComponent implements OnInit {
    zones: Zone[] = [];
    projects: Project[] = [];
    zone: Partial<Zone> = {};

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

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        forkJoin({
            zones: this.productionService.getZones(),
            projects: this.productionService.getProjects()
        }).subscribe({
            next: (data: any) => {
                this.zones = data.zones.results || data.zones;
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name
                }));
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
                this.loading = false;
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

    getZoneTypeSeverity(type: ZoneType): string {
        const map: { [key: string]: string } = {
            'production': 'success',
            'maintenance': 'warning',
            'storage': 'info',
            'quality': 'secondary'
        };
        return map[type] || 'info';
    }

    openNew(): void {
        this.zone = {
            code: '',
            name: '',
            description: '',
            project: undefined,
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

        if (!this.zone.code || !this.zone.name) {
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
