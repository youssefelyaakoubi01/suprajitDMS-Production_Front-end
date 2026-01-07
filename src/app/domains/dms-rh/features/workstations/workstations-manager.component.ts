/**
 * Workstations Manager Component
 * Domain: DMS-RH
 *
 * Manages HR workstations and processes
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

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
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { MessageService, ConfirmationService } from 'primeng/api';

// Domain imports
import { DmsQualificationService, HRWorkstation, HRProcess } from '@domains/dms-rh';
import { ApiService } from '@core/services/api.service';

interface ProductionLine {
    id: number;
    name: string;
    code: string;
}

@Component({
    selector: 'app-workstations-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        TooltipModule,
        ToolbarModule,
        SelectModule,
        TabsModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        RippleModule
    ],
    providers: [MessageService, ConfirmationService],
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
                                <p-select [options]="productionLines"
                                          [(ngModel)]="selectedProductionLine"
                                          (onChange)="onProductionLineFilterChange()"
                                          placeholder="Filter by Production Line"
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
                                    <th pSortableColumn="name">Nom</th>
                                    <th pSortableColumn="code">Code</th>
                                    <th>Ligne de Production</th>
                                    <th style="width: 120px; text-align: center">Actions</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-ws>
                                <tr>
                                    <td>
                                        <span class="font-semibold">{{ ws.name }}</span>
                                    </td>
                                    <td>
                                        <p-tag [value]="ws.code" severity="info" [rounded]="true"></p-tag>
                                    </td>
                                    <td>{{ ws.production_line_name || '-' }}</td>
                                    <td class="text-center">
                                        <button pButton icon="pi pi-pencil"
                                                class="p-button-text p-button-sm"
                                                (click)="onEditWorkstation(ws)" pTooltip="Modifier">
                                        </button>
                                        <button pButton icon="pi pi-trash"
                                                class="p-button-text p-button-sm p-button-danger"
                                                (click)="onDeleteWorkstation(ws)" pTooltip="Supprimer">
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

        <!-- Workstation Form Dialog -->
        <p-dialog [(visible)]="showWorkstationDialog"
                  [header]="editingWorkstation ? 'Modifier Workstation' : 'Nouvelle Workstation'"
                  [modal]="true"
                  [style]="{width: '500px'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="workstation-dialog">
            <form [formGroup]="workstationForm" class="workstation-form">
                <div class="form-field">
                    <label for="ws-name">
                        <i class="pi pi-desktop"></i> Nom <span class="required">*</span>
                    </label>
                    <input pInputText id="ws-name" formControlName="name"
                           placeholder="Nom de la workstation" class="w-full" />
                    <small class="p-error" *ngIf="workstationForm.get('name')?.invalid && workstationForm.get('name')?.touched">
                        Le nom est requis
                    </small>
                </div>

                <div class="form-field">
                    <label for="ws-code">
                        <i class="pi pi-tag"></i> Code <span class="required">*</span>
                    </label>
                    <input pInputText id="ws-code" formControlName="code"
                           placeholder="Code unique" class="w-full" />
                    <small class="p-error" *ngIf="workstationForm.get('code')?.invalid && workstationForm.get('code')?.touched">
                        Le code est requis
                    </small>
                </div>

                <div class="form-field">
                    <label for="ws-line">
                        <i class="pi pi-sitemap"></i> Ligne de Production <span class="required">*</span>
                    </label>
                    <p-select id="ws-line"
                              formControlName="production_line"
                              [options]="productionLines"
                              optionLabel="name"
                              optionValue="id"
                              [filter]="true"
                              [virtualScroll]="true"
                              [virtualScrollItemSize]="40"
                              filterPlaceholder="Rechercher..."
                              placeholder="Sélectionner une ligne"
                              appendTo="body"
                              [panelStyle]="{'max-height': '250px'}"
                              styleClass="w-full">
                        <ng-template let-line pTemplate="item">
                            <div class="line-option">
                                <i class="pi pi-sitemap"></i>
                                <span>{{ line.name }}</span>
                                <p-tag *ngIf="line.code" [value]="line.code" severity="secondary" [rounded]="true"></p-tag>
                            </div>
                        </ng-template>
                    </p-select>
                    <small class="p-error" *ngIf="workstationForm.get('production_line')?.invalid && workstationForm.get('production_line')?.touched">
                        La ligne de production est requise
                    </small>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple label="Annuler" icon="pi pi-times"
                            class="p-button-text"
                            (click)="showWorkstationDialog = false">
                    </button>
                    <button pButton pRipple
                            [label]="editingWorkstation ? 'Mettre à jour' : 'Créer'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveWorkstation()"
                            [disabled]="workstationForm.invalid"
                            [loading]="saving">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- Process Form Dialog -->
        <p-dialog [(visible)]="showProcessDialog"
                  [header]="editingProcess ? 'Modifier Process' : 'Nouveau Process'"
                  [modal]="true"
                  [style]="{width: '450px'}"
                  [draggable]="false"
                  styleClass="process-form-dialog">
            <form [formGroup]="processForm" class="workstation-form">
                <div class="form-field">
                    <label for="proc-name">
                        <i class="pi pi-cog"></i> Nom <span class="required">*</span>
                    </label>
                    <input pInputText id="proc-name" formControlName="name"
                           placeholder="Nom du process" class="w-full" />
                    <small class="p-error" *ngIf="processForm.get('name')?.invalid && processForm.get('name')?.touched">
                        Le nom est requis
                    </small>
                </div>
                <div class="form-field">
                    <label for="proc-code">
                        <i class="pi pi-tag"></i> Code <span class="required">*</span>
                    </label>
                    <input pInputText id="proc-code" formControlName="code"
                           placeholder="Code unique" class="w-full" />
                    <small class="p-error" *ngIf="processForm.get('code')?.invalid && processForm.get('code')?.touched">
                        Le code est requis
                    </small>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple label="Annuler" icon="pi pi-times"
                            class="p-button-text"
                            (click)="showProcessDialog = false">
                    </button>
                    <button pButton pRipple
                            [label]="editingProcess ? 'Mettre à jour' : 'Créer'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveProcess()"
                            [disabled]="processForm.invalid"
                            [loading]="savingProcess">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast position="top-right"></p-toast>
        <p-confirmDialog></p-confirmDialog>
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

        /* Form Styles */
        .workstation-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .form-row {
            display: flex;
            gap: 1rem;

            .form-field {
                flex: 1;
            }
        }

        .form-field {
            label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: var(--text-color);

                i {
                    color: var(--primary-color);
                    font-size: 0.875rem;
                }

                .required {
                    color: var(--red-500);
                }
            }

            &.checkbox-field {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding-top: 1.75rem;

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0;
                    cursor: pointer;
                }
            }
        }

        .line-option {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            i {
                color: var(--teal-500);
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        /* Dialog Overrides */
        :host ::ng-deep {
            .workstation-dialog,
            .process-form-dialog {
                .p-dialog-content {
                    padding: 1.5rem;
                }
            }

            .p-select-panel {
                .p-select-item {
                    padding: 0.5rem 0.75rem;
                }
            }
        }

        @media (max-width: 576px) {
            .form-row {
                flex-direction: column;
            }

            .form-field.checkbox-field {
                padding-top: 0;
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
    selectedProductionLine: number | null = null;
    filteredWorkstations: HRWorkstation[] = [];
    productionLines: ProductionLine[] = [];

    // Dialog state
    showWorkstationDialog = false;
    showProcessDialog = false;
    editingWorkstation: HRWorkstation | null = null;
    editingProcess: HRProcess | null = null;
    saving = false;
    savingProcess = false;

    // Forms
    workstationForm!: FormGroup;
    processForm!: FormGroup;

    constructor(
        private qualificationService: DmsQualificationService,
        private api: ApiService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForms();
    }

    private initForms(): void {
        this.workstationForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required],
            production_line: [null, Validators.required]
        });

        this.processForm = this.fb.group({
            name: ['', Validators.required],
            code: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        if (this.workstations.length === 0) {
            this.loadWorkstations();
        } else {
            this.filteredWorkstations = [...this.workstations];
        }

        if (this.processes.length === 0) {
            this.loadProcesses();
        }

        this.loadProductionLines();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadWorkstations(): void {
        this.loading = true;
        const params = this.selectedProductionLine ? { productionLineId: this.selectedProductionLine } : undefined;

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

    loadProductionLines(): void {
        this.api.get<ProductionLine[]>('production/lines')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data: any) => {
                    const lines = data.results || data;
                    this.productionLines = lines.map((l: any) => ({
                        id: l.id,
                        name: l.name,
                        code: l.code
                    }));
                },
                error: () => {
                    this.productionLines = [];
                }
            });
    }

    onProductionLineFilterChange(): void {
        if (this.selectedProductionLine) {
            this.filteredWorkstations = this.workstations.filter(
                ws => ws.production_line === this.selectedProductionLine
            );
        } else {
            this.filteredWorkstations = [...this.workstations];
        }
    }

    getWorkstationCount(process: HRProcess): number {
        // Note: Workstations are linked to ProductionLines, not Processes
        // This returns 0 as the relationship doesn't exist in the current data model
        return 0;
    }

    onAddWorkstation(): void {
        this.editingWorkstation = null;
        this.workstationForm.reset();
        this.showWorkstationDialog = true;
    }

    onEditWorkstation(ws: HRWorkstation): void {
        this.editingWorkstation = ws;
        this.workstationForm.patchValue({
            name: ws.name,
            code: ws.code,
            production_line: ws.production_line
        });
        this.showWorkstationDialog = true;
    }

    onDeleteWorkstation(ws: HRWorkstation): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer la workstation "${ws.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.qualificationService.deleteHRWorkstation(ws.id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Workstation supprimée avec succès'
                            });
                            this.loadWorkstations();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: err.error?.detail || 'Échec de la suppression'
                            });
                        }
                    });
            }
        });
    }

    saveWorkstation(): void {
        if (this.workstationForm.invalid) return;

        this.saving = true;
        const formValue = this.workstationForm.value;

        const request$ = this.editingWorkstation
            ? this.qualificationService.updateHRWorkstation(this.editingWorkstation.id, formValue)
            : this.qualificationService.createHRWorkstation(formValue);

        request$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.saving = false)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: this.editingWorkstation
                        ? 'Workstation mise à jour avec succès'
                        : 'Workstation créée avec succès'
                });
                this.showWorkstationDialog = false;
                this.loadWorkstations();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.detail || 'Échec de la sauvegarde'
                });
            }
        });
    }

    onAddProcess(): void {
        this.editingProcess = null;
        this.processForm.reset();
        this.showProcessDialog = true;
    }

    onEditProcess(process: HRProcess): void {
        this.editingProcess = process;
        this.processForm.patchValue({
            name: process.name,
            code: process.code
        });
        this.showProcessDialog = true;
    }

    onDeleteProcess(process: HRProcess): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le process "${process.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.qualificationService.deleteProcess(process.id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Process supprimé avec succès'
                            });
                            this.loadProcesses();
                        },
                        error: (err: any) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: err.error?.detail || 'Échec de la suppression'
                            });
                        }
                    });
            }
        });
    }

    saveProcess(): void {
        if (this.processForm.invalid) return;

        this.savingProcess = true;
        const formValue = this.processForm.value;

        const request$ = this.editingProcess
            ? this.qualificationService.updateProcess(this.editingProcess.id, formValue)
            : this.qualificationService.createProcess(formValue);

        request$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.savingProcess = false)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: this.editingProcess
                        ? 'Process mis à jour avec succès'
                        : 'Process créé avec succès'
                });
                this.showProcessDialog = false;
                this.loadProcesses();
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.detail || 'Échec de la sauvegarde'
                });
            }
        });
    }
}
