/**
 * Workstations Manager Component
 * Domain: DMS-RH
 *
 * Manages HR workstations and processes
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
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';

// Domain imports
import { DmsQualificationService, HRWorkstation, HRProcess } from '@domains/dms-rh';

@Component({
    selector: 'app-workstations-manager',
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
        TabsModule,
        InputTextModule
    ],
    template: `
        <div class="workstations-manager">
            <p-tabs [value]="activeTab">
                <p-tablist>
                    <p-tab value="workstations"><i class="pi pi-desktop mr-2"></i>Workstations</p-tab>
                    <p-tab value="processes"><i class="pi pi-cog mr-2"></i>Processes</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Workstations Panel -->
                    <p-tabpanel value="workstations">
                        <p-toolbar styleClass="mb-3 surface-ground border-round">
                            <ng-template #start>
                                <p-select [options]="processes"
                                          [(ngModel)]="selectedProcess"
                                          (onChange)="onProcessFilterChange()"
                                          placeholder="Filter by Process"
                                          optionLabel="name"
                                          optionValue="id"
                                          [showClear]="true">
                                </p-select>
                            </ng-template>
                            <ng-template #end>
                                <button pButton icon="pi pi-plus" label="Add Workstation"
                                        (click)="onAddWorkstation()">
                                </button>
                            </ng-template>
                        </p-toolbar>

                        <p-table [value]="filteredWorkstations"
                                 [loading]="loading"
                                 [paginator]="true"
                                 [rows]="10"
                                 [rowHover]="true"
                                 styleClass="p-datatable-sm p-datatable-gridlines">

                            <ng-template pTemplate="header">
                                <tr>
                                    <th pSortableColumn="desc_workstation">Name</th>
                                    <th>Process</th>
                                    <th>Mode</th>
                                    <th>KPI Index</th>
                                    <th pSortableColumn="cycle_time_seconds">Cycle Time</th>
                                    <th>Critical</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-ws>
                                <tr>
                                    <td>
                                        <span class="font-semibold">{{ ws.desc_workstation }}</span>
                                    </td>
                                    <td>{{ ws.Process?.name || '-' }}</td>
                                    <td>
                                        <p-tag [value]="getModeLabel(ws.process_mode)"
                                               [severity]="getModeSeverity(ws.process_mode)">
                                        </p-tag>
                                    </td>
                                    <td>{{ ws.kpi_index || '-' }}</td>
                                    <td>{{ ws.cycle_time_seconds ? ws.cycle_time_seconds + 's' : '-' }}</td>
                                    <td>
                                        <i *ngIf="ws.is_critical" class="pi pi-exclamation-triangle text-orange-500"></i>
                                    </td>
                                    <td>
                                        <button pButton icon="pi pi-pencil"
                                                class="p-button-text p-button-sm"
                                                (click)="onEditWorkstation(ws)" pTooltip="Edit">
                                        </button>
                                        <button pButton icon="pi pi-trash"
                                                class="p-button-text p-button-sm p-button-danger"
                                                (click)="onDeleteWorkstation(ws)" pTooltip="Delete">
                                        </button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>

                    <!-- Processes Panel -->
                    <p-tabpanel value="processes">
                        <p-toolbar styleClass="mb-3 surface-ground border-round">
                            <ng-template #start>
                                <span class="text-xl font-semibold">Processes</span>
                            </ng-template>
                            <ng-template #end>
                                <button pButton icon="pi pi-plus" label="Add Process"
                                        (click)="onAddProcess()">
                                </button>
                            </ng-template>
                        </p-toolbar>

                        <div class="grid">
                            <div class="col-12 md:col-6 lg:col-4" *ngFor="let process of processes">
                                <p-card styleClass="process-card h-full">
                                    <div class="process-content">
                                        <div class="process-header">
                                            <span class="process-name">{{ process.name }}</span>
                                            <p-tag [value]="process.code" severity="info"></p-tag>
                                        </div>
                                        <p class="process-description" *ngIf="process.description">
                                            {{ process.description }}
                                        </p>
                                        <div class="process-stats">
                                            <span class="stat">
                                                <i class="pi pi-desktop"></i>
                                                {{ getWorkstationCount(process) }} workstations
                                            </span>
                                        </div>
                                    </div>
                                    <ng-template pTemplate="footer">
                                        <div class="flex gap-2">
                                            <button pButton icon="pi pi-pencil"
                                                    class="p-button-text p-button-sm"
                                                    (click)="onEditProcess(process)" pTooltip="Edit">
                                            </button>
                                            <button pButton icon="pi pi-trash"
                                                    class="p-button-text p-button-sm p-button-danger"
                                                    (click)="onDeleteProcess(process)" pTooltip="Delete">
                                            </button>
                                        </div>
                                    </ng-template>
                                </p-card>
                            </div>
                        </div>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
        </div>
    `,
    styles: [`
        .workstations-manager {
            padding: 1rem;
        }

        .process-card {
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }
        }

        .process-content {
            .process-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            .process-name {
                font-weight: 600;
                font-size: 1.1rem;
            }

            .process-description {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                margin: 0.5rem 0;
            }

            .process-stats {
                margin-top: 0.5rem;

                .stat {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.875rem;
                    color: var(--text-color-secondary);
                }
            }
        }
    `]
})
export class WorkstationsManagerComponent implements OnInit, OnDestroy {
    @Input() workstations: HRWorkstation[] = [];
    @Input() processes: HRProcess[] = [];
    @Input() loading = false;

    @Output() addWorkstation = new EventEmitter<void>();
    @Output() editWorkstation = new EventEmitter<HRWorkstation>();
    @Output() deleteWorkstation = new EventEmitter<HRWorkstation>();
    @Output() addProcess = new EventEmitter<void>();
    @Output() editProcess = new EventEmitter<HRProcess>();
    @Output() deleteProcess = new EventEmitter<HRProcess>();

    private destroy$ = new Subject<void>();

    activeTab = 'workstations';
    selectedProcess: number | null = null;
    filteredWorkstations: HRWorkstation[] = [];

    constructor(private qualificationService: DmsQualificationService) {}

    ngOnInit(): void {
        if (this.workstations.length === 0) {
            this.loadWorkstations();
        } else {
            this.filteredWorkstations = [...this.workstations];
        }

        if (this.processes.length === 0) {
            this.loadProcesses();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadWorkstations(): void {
        this.loading = true;
        const params = this.selectedProcess ? { processId: this.selectedProcess } : undefined;

        this.qualificationService.getHRWorkstations(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (workstations) => {
                    this.workstations = workstations;
                    this.filteredWorkstations = [...workstations];
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    loadProcesses(): void {
        this.qualificationService.getProcesses()
            .pipe(takeUntil(this.destroy$))
            .subscribe(processes => {
                this.processes = processes;
            });
    }

    onProcessFilterChange(): void {
        if (this.selectedProcess) {
            this.filteredWorkstations = this.workstations.filter(
                ws => ws.id_process === this.selectedProcess
            );
        } else {
            this.filteredWorkstations = [...this.workstations];
        }
    }

    getModeLabel(mode: string | undefined): string {
        const labels: Record<string, string> = {
            manual: 'Manual',
            semi_auto: 'Semi-Auto',
            full_auto: 'Full Auto'
        };
        return labels[mode || ''] || mode || '-';
    }

    getModeSeverity(mode: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn'> = {
            manual: 'warn',
            semi_auto: 'info',
            full_auto: 'success'
        };
        return map[mode || ''] || 'secondary';
    }

    getWorkstationCount(process: HRProcess): number {
        return this.workstations.filter(ws => ws.id_process === process.id).length;
    }

    onAddWorkstation(): void {
        this.addWorkstation.emit();
    }

    onEditWorkstation(ws: HRWorkstation): void {
        this.editWorkstation.emit(ws);
    }

    onDeleteWorkstation(ws: HRWorkstation): void {
        this.deleteWorkstation.emit(ws);
    }

    onAddProcess(): void {
        this.addProcess.emit();
    }

    onEditProcess(process: HRProcess): void {
        this.editProcess.emit(process);
    }

    onDeleteProcess(process: HRProcess): void {
        this.deleteProcess.emit(process);
    }
}
