/**
 * Import Execution Component
 * Domain: DMS-Admin
 *
 * Execute import operations: validate, dry-run, or actual import
 * Shows progress and detailed results
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { AccordionModule } from 'primeng/accordion';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { TimelineModule } from 'primeng/timeline';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DataImportService } from '../../services/data-import.service';
import {
    ImportResult,
    SequenceImportResult,
    ValidationResult,
    getMappingModule,
    MODULE_CONFIG
} from '../../models';

type ExecutionMode = 'validate' | 'import' | 'sequence';
type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

interface TimelineEvent {
    status: 'success' | 'error' | 'info' | 'warn';
    message: string;
    details?: string;
    time: Date;
}

@Component({
    selector: 'app-import-execution',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        ToggleSwitchModule,
        ProgressBarModule,
        SkeletonModule,
        ToastModule,
        AccordionModule,
        ChipModule,
        DividerModule,
        RippleModule,
        TimelineModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="flex flex-column gap-4">
            <!-- Header -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <button pButton pRipple icon="pi pi-arrow-left" class="p-button-text p-button-rounded"
                                routerLink="/dms-admin/data-import" pTooltip="Retour"></button>
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             [style.background]="getStatusGradient()"
                             style="width: 3.5rem; height: 3.5rem;">
                            <i [class]="getStatusIcon()" class="text-white" style="font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <h1 class="text-xl md:text-2xl font-bold m-0 text-900">
                                {{ getModeTitle() }}
                            </h1>
                            <p class="text-500 mt-1 mb-0 text-sm">
                                {{ mappingName ? formatMappingName(mappingName) : mode === 'sequence' ? 'Import Séquentiel' : '' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 flex-wrap align-items-center">
                        <div *ngIf="mode !== 'validate'" class="flex align-items-center gap-2">
                            <span class="text-sm text-600">Mode Test:</span>
                            <p-toggleSwitch [(ngModel)]="dryRun" [disabled]="status === 'running'"></p-toggleSwitch>
                        </div>
                        <button pButton pRipple [label]="getActionLabel()" [icon]="getActionIcon()"
                                [class]="getActionClass()" (click)="executeAction()"
                                [loading]="status === 'running'" [disabled]="status === 'running'"></button>
                    </div>
                </div>
            </div>

            <!-- Progress Section -->
            <div *ngIf="status === 'running'" class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
                    <span class="text-lg font-semibold">{{ currentOperation }}</span>
                </div>
                <p-progressBar [mode]="progressMode" [value]="progress"></p-progressBar>
            </div>

            <!-- Validation Result -->
            <ng-container *ngIf="validationResult && status === 'completed'">
                <div class="surface-card shadow-2 border-round-xl p-4">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h3 class="m-0 text-lg font-semibold flex align-items-center gap-2">
                            <i class="pi pi-check-square text-primary"></i>
                            Résultat de Validation
                        </h3>
                        <p-tag [value]="validationResult.validation_status"
                               [severity]="getValidationSeverity(validationResult.validation_status)"></p-tag>
                    </div>

                    <div class="grid mb-4">
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-primary">{{ validationResult.total_rows_validated }}</div>
                                <div class="text-500 text-sm">Lignes validées</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-green-600">{{ validationResult.valid_rows }}</div>
                                <div class="text-500 text-sm">Valides</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-red-600">{{ validationResult.invalid_rows }}</div>
                                <div class="text-500 text-sm">Invalides</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-orange-600">{{ validationResult.warnings.length }}</div>
                                <div class="text-500 text-sm">Avertissements</div>
                            </div>
                        </div>
                    </div>

                    <!-- Errors -->
                    <p-accordion *ngIf="validationResult.errors.length > 0" value="0">
                        <p-accordion-panel value="0">
                            <p-accordion-header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-times-circle text-red-500"></i>
                                    <span>Erreurs ({{ validationResult.errors.length }})</span>
                                </div>
                            </p-accordion-header>
                            <p-accordion-content>
                                <p-table [value]="validationResult.errors" [paginator]="true" [rows]="10"
                                         styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 5rem">Ligne</th>
                                            <th>Champ</th>
                                            <th>Message</th>
                                            <th>Valeur</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-error>
                                        <tr>
                                            <td><p-tag [value]="error.row_number.toString()" severity="danger"></p-tag></td>
                                            <td><code class="text-sm">{{ error.field }}</code></td>
                                            <td>{{ error.message }}</td>
                                            <td><span class="text-500 text-sm">{{ error.value || '-' }}</span></td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-accordion-content>
                        </p-accordion-panel>
                    </p-accordion>

                    <!-- Warnings -->
                    <p-accordion *ngIf="validationResult.warnings.length > 0" class="mt-3" value="0">
                        <p-accordion-panel value="0">
                            <p-accordion-header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-exclamation-triangle text-orange-500"></i>
                                    <span>Avertissements ({{ validationResult.warnings.length }})</span>
                                </div>
                            </p-accordion-header>
                            <p-accordion-content>
                                <p-table [value]="validationResult.warnings" [paginator]="true" [rows]="10"
                                         styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 5rem">Ligne</th>
                                            <th>Champ</th>
                                            <th>Message</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-warn>
                                        <tr>
                                            <td><p-tag [value]="warn.row_number.toString()" severity="warn"></p-tag></td>
                                            <td><code class="text-sm">{{ warn.field }}</code></td>
                                            <td>{{ warn.message }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-accordion-content>
                        </p-accordion-panel>
                    </p-accordion>
                </div>
            </ng-container>

            <!-- Single Import Result -->
            <ng-container *ngIf="importResult && status === 'completed'">
                <div class="surface-card shadow-2 border-round-xl p-4">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h3 class="m-0 text-lg font-semibold flex align-items-center gap-2">
                            <i class="pi pi-upload text-primary"></i>
                            Résultat d'Import
                            <p-tag *ngIf="dryRun" value="MODE TEST" severity="warn" class="ml-2"></p-tag>
                        </h3>
                        <p-tag [value]="importResult.failed === 0 ? 'Succès' : 'Avec erreurs'"
                               [severity]="importResult.failed === 0 ? 'success' : 'warn'"></p-tag>
                    </div>

                    <div class="grid mb-4">
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-primary">{{ importResult.total_rows }}</div>
                                <div class="text-500 text-xs">Total</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-green-600">{{ importResult.created }}</div>
                                <div class="text-500 text-xs">Créés</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-blue-600">{{ importResult.updated }}</div>
                                <div class="text-500 text-xs">Mis à jour</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-gray-500">{{ importResult.skipped }}</div>
                                <div class="text-500 text-xs">Ignorés</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-red-600">{{ importResult.failed }}</div>
                                <div class="text-500 text-xs">Échoués</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-2">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-2xl font-bold text-purple-600">{{ importResult.duration_seconds.toFixed(1) }}s</div>
                                <div class="text-500 text-xs">Durée</div>
                            </div>
                        </div>
                    </div>

                    <!-- Errors -->
                    <p-accordion *ngIf="importResult.errors.length > 0" value="0">
                        <p-accordion-panel value="0">
                            <p-accordion-header>
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-times-circle text-red-500"></i>
                                    <span>Erreurs ({{ importResult.error_count }})</span>
                                </div>
                            </p-accordion-header>
                            <p-accordion-content>
                                <div class="flex flex-column gap-2">
                                    <div *ngFor="let error of importResult.errors" class="p-2 surface-100 border-round text-sm text-red-700">
                                        {{ error }}
                                    </div>
                                </div>
                            </p-accordion-content>
                        </p-accordion-panel>
                    </p-accordion>
                </div>
            </ng-container>

            <!-- Sequence Import Result -->
            <ng-container *ngIf="sequenceResult && status === 'completed'">
                <div class="surface-card shadow-2 border-round-xl p-4">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <h3 class="m-0 text-lg font-semibold flex align-items-center gap-2">
                            <i class="pi pi-list text-primary"></i>
                            Résultat Import Séquentiel
                            <p-tag *ngIf="sequenceResult.dry_run" value="MODE TEST" severity="warn" class="ml-2"></p-tag>
                        </h3>
                    </div>

                    <div class="grid mb-4">
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-primary">{{ sequenceResult.mappings_processed }}</div>
                                <div class="text-500 text-sm">Mappings traités</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-green-600">{{ sequenceResult.total_created }}</div>
                                <div class="text-500 text-sm">Créés</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-blue-600">{{ sequenceResult.total_updated }}</div>
                                <div class="text-500 text-sm">Mis à jour</div>
                            </div>
                        </div>
                        <div class="col-6 md:col-3">
                            <div class="surface-100 border-round-lg p-3 text-center">
                                <div class="text-3xl font-bold text-red-600">{{ sequenceResult.total_failed }}</div>
                                <div class="text-500 text-sm">Échoués</div>
                            </div>
                        </div>
                    </div>

                    <!-- Individual Results -->
                    <p-accordion [multiple]="true" [value]="getSequenceAccordionValues()">
                        <p-accordion-panel *ngFor="let result of sequenceResult.results; let i = index" [value]="i">
                            <p-accordion-header>
                                <div class="flex align-items-center justify-content-between w-full pr-3">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="getModuleIcon(result.mapping_name)"
                                           [style.color]="getModuleColor(result.mapping_name)"></i>
                                        <span>{{ formatMappingName(result.mapping_name) }}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <p-chip [label]="'+' + result.created" styleClass="bg-green-100 text-green-700"></p-chip>
                                        <p-chip [label]="'~' + result.updated" styleClass="bg-blue-100 text-blue-700"></p-chip>
                                        <p-chip *ngIf="result.failed > 0" [label]="'!' + result.failed" styleClass="bg-red-100 text-red-700"></p-chip>
                                    </div>
                                </div>
                            </p-accordion-header>
                            <p-accordion-content>
                                <div class="grid">
                                    <div class="col-12 md:col-6">
                                        <div class="text-sm">
                                            <div class="mb-1"><strong>Fichier:</strong> <code class="text-xs">{{ result.file_path }}</code></div>
                                            <div class="mb-1"><strong>Modèle:</strong> {{ result.model_name }}</div>
                                            <div><strong>Durée:</strong> {{ result.duration_seconds.toFixed(2) }}s</div>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <div class="grid text-center">
                                            <div class="col-4">
                                                <div class="text-xl font-bold text-green-600">{{ result.created }}</div>
                                                <div class="text-xs text-500">Créés</div>
                                            </div>
                                            <div class="col-4">
                                                <div class="text-xl font-bold text-blue-600">{{ result.updated }}</div>
                                                <div class="text-xs text-500">Mis à jour</div>
                                            </div>
                                            <div class="col-4">
                                                <div class="text-xl font-bold text-red-600">{{ result.failed }}</div>
                                                <div class="text-xs text-500">Échoués</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div *ngIf="result.errors.length > 0" class="mt-3 surface-100 border-round p-2">
                                    <div class="text-sm font-semibold text-red-600 mb-2">Erreurs:</div>
                                    <div *ngFor="let error of result.errors.slice(0, 5)" class="text-xs text-red-700 mb-1">
                                        {{ error }}
                                    </div>
                                    <div *ngIf="result.errors.length > 5" class="text-xs text-500 mt-2">
                                        ... et {{ result.errors.length - 5 }} autres erreurs
                                    </div>
                                </div>
                            </p-accordion-content>
                        </p-accordion-panel>
                    </p-accordion>
                </div>
            </ng-container>

            <!-- Error State -->
            <div *ngIf="status === 'error'" class="surface-card shadow-2 border-round-xl p-5">
                <div class="flex flex-column align-items-center text-500">
                    <i class="pi pi-times-circle text-6xl mb-3 text-red-500"></i>
                    <h3 class="text-xl font-semibold text-700 mb-2">Erreur d'exécution</h3>
                    <p class="text-center">{{ errorMessage }}</p>
                    <button pButton pRipple label="Réessayer" icon="pi pi-refresh"
                            class="mt-3" (click)="executeAction()"></button>
                </div>
            </div>

            <!-- Idle State -->
            <div *ngIf="status === 'idle'" class="surface-card shadow-2 border-round-xl p-5">
                <div class="flex flex-column align-items-center text-500">
                    <i [class]="getModeIcon() + ' text-6xl mb-3'" [style.color]="getModeColor()"></i>
                    <h3 class="text-xl font-semibold text-700 mb-2">{{ getModeDescription() }}</h3>
                    <p class="text-center mb-4">
                        {{ mode === 'sequence' ? 'Import séquentiel de tous les mappings avec fichiers disponibles.' :
                           mode === 'validate' ? 'Validez les données avant de les importer.' :
                           'Importez les données du fichier Excel vers la base de données.' }}
                    </p>
                    <div *ngIf="mode !== 'validate'" class="flex align-items-center gap-2 mb-4">
                        <p-toggleSwitch [(ngModel)]="dryRun"></p-toggleSwitch>
                        <span class="text-sm">Mode Test (aucune modification en base)</span>
                    </div>
                    <button pButton pRipple [label]="getActionLabel()" [icon]="getActionIcon()"
                            [class]="getActionClass()" (click)="executeAction()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-accordion .p-accordion-content {
                padding: 1rem;
            }
        }

        code {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            background: var(--surface-100);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
        }
    `]
})
export class ImportExecutionComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    mode: ExecutionMode = 'import';
    mappingName: string | null = null;
    dryRun = true;

    status: ExecutionStatus = 'idle';
    progress = 0;
    progressMode: 'determinate' | 'indeterminate' = 'indeterminate';
    currentOperation = '';
    errorMessage = '';

    validationResult: ValidationResult | null = null;
    importResult: ImportResult | null = null;
    sequenceResult: SequenceImportResult | null = null;

    timelineEvents: TimelineEvent[] = [];

    constructor(
        private dataImportService: DataImportService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.handleQueryParams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleQueryParams(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.mappingName = params['mapping'] || null;
            this.mode = (params['mode'] as ExecutionMode) || 'import';

            if (this.mode === 'validate') {
                this.dryRun = true;
            }
        });
    }

    executeAction(): void {
        this.status = 'running';
        this.errorMessage = '';
        this.validationResult = null;
        this.importResult = null;
        this.sequenceResult = null;

        switch (this.mode) {
            case 'validate':
                this.runValidation();
                break;
            case 'import':
                this.runImport();
                break;
            case 'sequence':
                this.runSequenceImport();
                break;
        }
    }

    private runValidation(): void {
        this.currentOperation = `Validation de ${this.mappingName ? this.formatMappingName(this.mappingName) : 'tous les mappings'}...`;

        this.dataImportService.validate(this.mappingName || undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.validationResult = result;
                    this.status = 'completed';
                    this.messageService.add({
                        severity: result.validation_status === 'success' ? 'success' : result.validation_status === 'warnings' ? 'warn' : 'error',
                        summary: 'Validation terminée',
                        detail: `${result.valid_rows}/${result.total_rows_validated} lignes valides`
                    });
                },
                error: (err) => {
                    this.status = 'error';
                    this.errorMessage = err.error?.detail || 'Erreur lors de la validation';
                }
            });
    }

    private runImport(): void {
        this.currentOperation = `Import de ${this.mappingName ? this.formatMappingName(this.mappingName) : 'tous les mappings'}...`;

        this.dataImportService.runImport(this.mappingName || undefined, this.dryRun)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.importResult = result;
                    this.status = 'completed';
                    this.messageService.add({
                        severity: result.failed === 0 ? 'success' : 'warn',
                        summary: this.dryRun ? 'Test terminé' : 'Import terminé',
                        detail: `${result.created} créés, ${result.updated} mis à jour, ${result.failed} échoués`
                    });
                },
                error: (err) => {
                    this.status = 'error';
                    this.errorMessage = err.error?.detail || 'Erreur lors de l\'import';
                }
            });
    }

    private runSequenceImport(): void {
        this.currentOperation = 'Import séquentiel en cours...';

        this.dataImportService.runSequenceImport(undefined, false, this.dryRun)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.sequenceResult = result;
                    this.status = 'completed';
                    this.messageService.add({
                        severity: result.total_failed === 0 ? 'success' : 'warn',
                        summary: this.dryRun ? 'Test terminé' : 'Import séquentiel terminé',
                        detail: `${result.mappings_processed} mappings traités, ${result.total_created} créés, ${result.total_updated} mis à jour`
                    });
                },
                error: (err) => {
                    this.status = 'error';
                    this.errorMessage = err.error?.detail || 'Erreur lors de l\'import séquentiel';
                }
            });
    }

    formatMappingName(name: string): string {
        return name
            .replace(/_MAPPING$/, '')
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    getModeTitle(): string {
        switch (this.mode) {
            case 'validate': return 'Validation';
            case 'import': return 'Import';
            case 'sequence': return 'Import Séquentiel';
            default: return 'Exécution';
        }
    }

    getModeDescription(): string {
        switch (this.mode) {
            case 'validate': return 'Prêt à valider';
            case 'import': return 'Prêt à importer';
            case 'sequence': return 'Prêt pour l\'import séquentiel';
            default: return '';
        }
    }

    getModeIcon(): string {
        switch (this.mode) {
            case 'validate': return 'pi pi-check-square';
            case 'import': return 'pi pi-upload';
            case 'sequence': return 'pi pi-list';
            default: return 'pi pi-cog';
        }
    }

    getModeColor(): string {
        switch (this.mode) {
            case 'validate': return '#3B82F6';
            case 'import': return '#10B981';
            case 'sequence': return '#8B5CF6';
            default: return '#6B7280';
        }
    }

    getActionLabel(): string {
        switch (this.mode) {
            case 'validate': return 'Lancer la Validation';
            case 'import': return this.dryRun ? 'Test d\'Import' : 'Lancer l\'Import';
            case 'sequence': return this.dryRun ? 'Test Séquentiel' : 'Lancer l\'Import Séquentiel';
            default: return 'Exécuter';
        }
    }

    getActionIcon(): string {
        switch (this.mode) {
            case 'validate': return 'pi pi-check-square';
            case 'import': return 'pi pi-upload';
            case 'sequence': return 'pi pi-play';
            default: return 'pi pi-cog';
        }
    }

    getActionClass(): string {
        switch (this.mode) {
            case 'validate': return 'p-button-info';
            case 'import': return this.dryRun ? 'p-button-warning' : 'p-button-success';
            case 'sequence': return this.dryRun ? 'p-button-warning' : 'p-button-success';
            default: return 'p-button-primary';
        }
    }

    getStatusGradient(): string {
        switch (this.status) {
            case 'running': return 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
            case 'completed': return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
            case 'error': return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
            default: return `linear-gradient(135deg, ${this.getModeColor()} 0%, ${this.getModeColor()}dd 100%)`;
        }
    }

    getStatusIcon(): string {
        switch (this.status) {
            case 'running': return 'pi pi-spin pi-spinner';
            case 'completed': return 'pi pi-check';
            case 'error': return 'pi pi-times';
            default: return this.getModeIcon();
        }
    }

    getValidationSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'success': return 'success';
            case 'warnings': return 'warn';
            case 'failed': return 'danger';
            default: return 'secondary';
        }
    }

    getSequenceAccordionValues(): number[] {
        if (!this.sequenceResult) return [];
        return this.sequenceResult.results.map((_, i) => i);
    }

    getModuleColor(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.color || '#6B7280';
    }

    getModuleIcon(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.icon || 'pi pi-database';
    }
}
