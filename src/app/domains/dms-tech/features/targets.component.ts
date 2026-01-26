import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { forkJoin } from 'rxjs';

interface PartTarget {
    id: number;
    part_number: string;
    name: string;
    project_name: string;
    shift_target: number;
    scrap_target: number;
    efficiency: number;
}

interface LineHeadcount {
    id: number;
    name: string;
    code: string;
    project_name: string;
    headcount_target: number;
    capacity: number;
}

@Component({
    selector: 'app-targets',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        TabsModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-chart-bar mr-2"></i>Targets & Headcount Configuration
                    </h2>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadData()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-tabs value="0">
                <!-- Part Targets Tab -->
                <p-tablist>
                    <p-tab value="0">Part Hourly Targets</p-tab>
                    <p-tab value="1">Line Headcount Targets</p-tab>
                </p-tablist>
                <p-tabpanels>
                <p-tabpanel value="0">
                    <div class="mb-3">
                        <p class="text-gray-600 m-0">
                            <i class="pi pi-info-circle mr-2"></i>
                            Configure hourly production targets for each part number
                        </p>
                    </div>

                    <p-table
                        [value]="partTargets"
                        [loading]="loading"
                        [rowHover]="true"
                        [paginator]="true"
                        [rows]="10"
                        styleClass="p-datatable-sm">

                        <ng-template pTemplate="header">
                            <tr>
                                <th>Part Number</th>
                                <th>Name</th>
                                <th>Project</th>
                                <th style="width: 150px">Hourly Target</th>
                                <th style="width: 120px">Scrap %</th>
                                <th style="width: 120px">Efficiency %</th>
                                <th style="width: 100px">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-part>
                            <tr>
                                <td><strong class="text-primary">{{ part.part_number }}</strong></td>
                                <td>{{ part.name }}</td>
                                <td><p-tag [value]="part.project_name" severity="info"></p-tag></td>
                                <td class="text-center font-bold text-xl">{{ part.shift_target }}</td>
                                <td class="text-center">{{ part.scrap_target || 0 }}%</td>
                                <td class="text-center">{{ part.efficiency || 85 }}%</td>
                                <td>
                                    <p-button
                                        icon="pi pi-pencil"
                                        styleClass="p-button-rounded p-button-warning p-button-text"
                                        pTooltip="Edit Target"
                                        (onClick)="editPartTarget(part)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center p-4">
                                    <span class="text-gray-500">No parts found. Add parts first in Parts Management.</span>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-tabpanel>

                <!-- Line Headcount Tab -->
                <p-tabpanel value="1">
                    <div class="mb-3">
                        <p class="text-gray-600 m-0">
                            <i class="pi pi-info-circle mr-2"></i>
                            Configure headcount (number of employees) target per production line
                        </p>
                    </div>

                    <p-table
                        [value]="lineHeadcounts"
                        [loading]="loading"
                        [rowHover]="true"
                        [paginator]="true"
                        [rows]="10"
                        styleClass="p-datatable-sm">

                        <ng-template pTemplate="header">
                            <tr>
                                <th>Code</th>
                                <th>Production Line</th>
                                <th>Project</th>
                                <th style="width: 150px">Capacity/Hour</th>
                                <th style="width: 180px">Headcount Target</th>
                                <th style="width: 100px">Actions</th>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="body" let-line>
                            <tr>
                                <td><strong class="text-primary">{{ line.code }}</strong></td>
                                <td>{{ line.name }}</td>
                                <td><p-tag [value]="line.project_name" severity="info"></p-tag></td>
                                <td class="text-center">{{ line.capacity || '-' }}</td>
                                <td class="text-center">
                                    <span class="font-bold text-xl">{{ line.headcount_target || 0 }}</span>
                                    <span class="text-gray-500 ml-1">employees</span>
                                </td>
                                <td>
                                    <p-button
                                        icon="pi pi-pencil"
                                        styleClass="p-button-rounded p-button-warning p-button-text"
                                        pTooltip="Edit Headcount"
                                        (onClick)="editLineHeadcount(line)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>

                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center p-4">
                                    <span class="text-gray-500">No production lines found.</span>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>

        <!-- Edit Part Target Dialog -->
        <p-dialog
            [(visible)]="partDialog"
            [style]="{width: '450px'}"
            header="Edit Part Target"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div *ngIf="selectedPart">
                    <div class="info-card">
                        <div class="info-card-title">{{ selectedPart.part_number }}</div>
                        <div class="info-card-subtitle">{{ selectedPart.name }}</div>
                    </div>

                    <div class="form-field">
                        <label for="shiftTarget">Hourly Target (units/hour)</label>
                        <p-inputNumber
                            id="shiftTarget"
                            [(ngModel)]="selectedPart.shift_target"
                            [min]="0"
                            [showButtons]="true"
                            buttonLayout="horizontal"
                            spinnerMode="horizontal"
                            decrementButtonClass="p-button-secondary"
                            incrementButtonClass="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus">
                        </p-inputNumber>
                        <small class="help-text">Target production quantity per hour</small>
                    </div>

                    <div class="form-field">
                        <label for="scrapTarget">Scrap Target (%)</label>
                        <p-inputNumber
                            id="scrapTarget"
                            [(ngModel)]="selectedPart.scrap_target"
                            [min]="0"
                            [max]="100"
                            suffix="%">
                        </p-inputNumber>
                        <small class="help-text">Maximum acceptable scrap percentage</small>
                    </div>

                    <div class="form-field">
                        <label for="efficiency">Efficiency Target (%)</label>
                        <p-inputNumber
                            id="efficiency"
                            [(ngModel)]="selectedPart.efficiency"
                            [min]="0"
                            [max]="100"
                            suffix="%">
                        </p-inputNumber>
                        <small class="help-text">Target efficiency percentage</small>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="partDialog = false"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="savePartTarget()"></p-button>
            </ng-template>
        </p-dialog>

        <!-- Edit Line Headcount Dialog -->
        <p-dialog
            [(visible)]="lineDialog"
            [style]="{width: '450px'}"
            header="Edit Line Headcount"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div *ngIf="selectedLine">
                    <div class="info-card">
                        <div class="info-card-title">{{ selectedLine.name }}</div>
                        <div class="info-card-subtitle">{{ selectedLine.code }}</div>
                    </div>

                    <div class="form-field">
                        <label for="headcount">Headcount Target</label>
                        <p-inputNumber
                            id="headcount"
                            [(ngModel)]="selectedLine.headcount_target"
                            [min]="0"
                            [showButtons]="true"
                            buttonLayout="horizontal"
                            spinnerMode="horizontal"
                            decrementButtonClass="p-button-secondary"
                            incrementButtonClass="p-button-secondary"
                            incrementButtonIcon="pi pi-plus"
                            decrementButtonIcon="pi pi-minus">
                        </p-inputNumber>
                        <small class="help-text">Target number of employees per shift for this line</small>
                    </div>

                    <div class="form-field">
                        <label for="capacity">Capacity (units/hour)</label>
                        <p-inputNumber
                            id="capacity"
                            [(ngModel)]="selectedLine.capacity"
                            [min]="0">
                        </p-inputNumber>
                        <small class="help-text">Maximum production capacity per hour</small>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="lineDialog = false"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveLineHeadcount()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }
        :host ::ng-deep .p-tabs .p-tabpanels {
            padding: 1rem 0;
        }

        /* Info Card in Dialog */
        .info-card {
            background-color: var(--surface-100);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
        }

        .info-card-title {
            font-weight: 700;
            font-size: 1.1rem;
            color: var(--text-color);
        }

        .info-card-subtitle {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }

        /* Help Text */
        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }
    `]
})
export class TargetsComponent implements OnInit {
    partTargets: PartTarget[] = [];
    lineHeadcounts: LineHeadcount[] = [];

    selectedPart: PartTarget | null = null;
    selectedLine: LineHeadcount | null = null;

    partDialog = false;
    lineDialog = false;
    loading = false;

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;

        forkJoin({
            parts: this.productionService.getParts(),
            lines: this.productionService.getProductionLines()
        }).subscribe({
            next: (data: any) => {
                const parts = data.parts.results || data.parts;
                const lines = data.lines.results || data.lines;

                this.partTargets = parts.map((p: any) => ({
                    id: p.id,
                    part_number: p.part_number,
                    name: p.name,
                    project_name: p.project_name || 'Unknown',
                    shift_target: p.shift_target || 0,
                    scrap_target: p.scrap_target || 0,
                    efficiency: p.efficiency || 85
                }));

                this.lineHeadcounts = lines.map((l: any) => ({
                    id: l.id,
                    name: l.name,
                    code: l.code,
                    project_name: l.project_name || 'Unknown',
                    headcount_target: l.headcount_target || 0,
                    capacity: l.capacity || 0
                }));

                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
                this.loading = false;
            }
        });
    }

    editPartTarget(part: PartTarget): void {
        this.selectedPart = { ...part };
        this.partDialog = true;
    }

    editLineHeadcount(line: LineHeadcount): void {
        this.selectedLine = { ...line };
        this.lineDialog = true;
    }

    savePartTarget(): void {
        if (!this.selectedPart) return;

        this.productionService.updatePart(this.selectedPart.id, {
            shift_target: this.selectedPart.shift_target,
            scrap_target: this.selectedPart.scrap_target,
            efficiency: this.selectedPart.efficiency
        } as any).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part target updated successfully' });
                this.loadData();
                this.partDialog = false;
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update' });
            }
        });
    }

    saveLineHeadcount(): void {
        if (!this.selectedLine) return;

        this.productionService.updateProductionLine(this.selectedLine.id, {
            headcount_target: this.selectedLine.headcount_target,
            capacity: this.selectedLine.capacity
        } as any).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Line headcount updated successfully' });
                this.loadData();
                this.lineDialog = false;
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update' });
            }
        });
    }
}
