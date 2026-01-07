/**
 * Import Preview Component
 * Domain: DMS-Admin
 *
 * Preview Excel file contents before importing
 * Shows data, mapping details, and validation status
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DataImportService } from '../../services/data-import.service';
import {
    PreviewData,
    ImportMapping,
    MappingField,
    getMappingModule,
    MODULE_CONFIG
} from '../../models';

@Component({
    selector: 'app-import-preview',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        SelectModule,
        InputNumberModule,
        TooltipModule,
        SkeletonModule,
        ToastModule,
        PanelModule,
        ChipModule,
        DividerModule,
        RippleModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="flex flex-column gap-4">
            <!-- Header with Back Button -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <button pButton pRipple icon="pi pi-arrow-left" class="p-button-text p-button-rounded"
                                routerLink="/dms-admin/data-import" pTooltip="Retour"></button>
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             [style.background]="moduleColor + '20'"
                             style="width: 3.5rem; height: 3.5rem;">
                            <i [class]="moduleIcon" [style.color]="moduleColor" style="font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <h1 class="text-xl md:text-2xl font-bold m-0 text-900">
                                Prévisualisation
                            </h1>
                            <p class="text-500 mt-1 mb-0 text-sm">
                                {{ mappingName ? formatMappingName(mappingName) : 'Sélectionnez un mapping' }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <button pButton pRipple label="Valider" icon="pi pi-check-square"
                                class="p-button-info" (click)="goToValidate()"
                                [disabled]="!previewData"></button>
                        <button pButton pRipple label="Importer" icon="pi pi-upload"
                                class="p-button-success" (click)="goToImport()"
                                [disabled]="!previewData"></button>
                    </div>
                </div>
            </div>

            <!-- Controls -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="grid align-items-end">
                    <div class="col-12 md:col-6 lg:col-4">
                        <label class="block text-sm font-medium text-700 mb-2">Mapping</label>
                        <p-select [options]="mappingOptions" [(ngModel)]="selectedMapping"
                                  (onChange)="onMappingChange()" placeholder="Sélectionner un mapping"
                                  styleClass="w-full" [filter]="true" filterBy="label">
                            <ng-template let-item pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <i [class]="getModuleIcon(item.value)" [style.color]="getModuleColor(item.value)"></i>
                                    <span>{{ item.label }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>
                    <div class="col-12 md:col-3 lg:col-2">
                        <label class="block text-sm font-medium text-700 mb-2">Lignes à afficher</label>
                        <p-inputNumber [(ngModel)]="previewLimit" [min]="1" [max]="100"
                                       styleClass="w-full" [showButtons]="true"></p-inputNumber>
                    </div>
                    <div class="col-12 md:col-3 lg:col-2">
                        <button pButton pRipple label="Charger" icon="pi pi-refresh"
                                class="w-full" (click)="loadPreview()"
                                [loading]="loading" [disabled]="!selectedMapping"></button>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex align-items-center gap-3 mb-4">
                    <p-skeleton shape="circle" size="3rem"></p-skeleton>
                    <div>
                        <p-skeleton width="200px" height="1.5rem" styleClass="mb-2"></p-skeleton>
                        <p-skeleton width="150px" height="1rem"></p-skeleton>
                    </div>
                </div>
                <p-skeleton width="100%" height="300px"></p-skeleton>
            </div>

            <!-- Preview Data -->
            <ng-container *ngIf="!loading && previewData">
                <!-- File Info -->
                <div class="surface-card shadow-2 border-round-xl p-4">
                    <div class="flex flex-wrap gap-4">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-file text-500"></i>
                            <span class="text-700 font-medium">Fichier:</span>
                            <code class="text-sm bg-gray-100 px-2 py-1 border-round">{{ previewData.file_path }}</code>
                        </div>
                        <p-divider layout="vertical" *ngIf="previewData.sheet_name"></p-divider>
                        <div class="flex align-items-center gap-2" *ngIf="previewData.sheet_name">
                            <i class="pi pi-table text-500"></i>
                            <span class="text-700 font-medium">Feuille:</span>
                            <span class="text-600">{{ previewData.sheet_name }}</span>
                        </div>
                        <p-divider layout="vertical"></p-divider>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-list text-500"></i>
                            <span class="text-700 font-medium">Total lignes:</span>
                            <p-tag [value]="previewData.total_rows.toString()" severity="info"></p-tag>
                        </div>
                        <p-divider layout="vertical"></p-divider>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-eye text-500"></i>
                            <span class="text-700 font-medium">Affichées:</span>
                            <p-tag [value]="previewData.data.length.toString()" severity="secondary"></p-tag>
                        </div>
                    </div>
                </div>

                <!-- Mapping Details Panel -->
                <p-panel *ngIf="mappingDetails" [toggleable]="true" [collapsed]="true">
                    <ng-template pTemplate="header">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-info-circle text-primary"></i>
                            <span class="font-semibold">Détails du Mapping</span>
                            <p-tag [value]="mappingDetails.field_count + ' champs'" severity="secondary" class="ml-2"></p-tag>
                        </div>
                    </ng-template>
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <div class="text-sm">
                                <div class="mb-2"><strong>Modèle:</strong> {{ mappingDetails.model }}</div>
                                <div class="mb-2"><strong>Champs uniques:</strong> {{ mappingDetails.unique_fields.join(', ') }}</div>
                                <div class="mb-2">
                                    <strong>Mise à jour doublon:</strong>
                                    <p-tag *ngIf="mappingDetails.update_on_duplicate" value="Oui" severity="success" class="ml-2"></p-tag>
                                    <p-tag *ngIf="!mappingDetails.update_on_duplicate" value="Non" severity="warn" class="ml-2"></p-tag>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-6">
                            <div class="text-sm">
                                <strong>Champs mappés:</strong>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <p-chip *ngFor="let field of getMappingFields()" [label]="field"
                                            styleClass="text-xs"></p-chip>
                                </div>
                            </div>
                        </div>
                    </div>
                </p-panel>

                <!-- Data Table -->
                <div class="surface-card shadow-2 border-round-xl overflow-hidden">
                    <div class="p-4 border-bottom-1 surface-border">
                        <h3 class="m-0 text-lg font-semibold flex align-items-center gap-2">
                            <i class="pi pi-table text-primary"></i>
                            Données Excel
                        </h3>
                    </div>
                    <p-table [value]="previewData.data" [scrollable]="true" scrollHeight="400px"
                             [rowHover]="true" styleClass="p-datatable-sm p-datatable-gridlines">
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 3rem; min-width: 3rem" class="bg-gray-100 text-center">#</th>
                                <th *ngFor="let col of previewData.columns"
                                    [style.min-width]="'150px'" class="bg-gray-100">
                                    {{ col }}
                                </th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-row let-rowIndex="rowIndex">
                            <tr>
                                <td class="text-center text-500 font-medium">{{ rowIndex + 1 }}</td>
                                <td *ngFor="let col of previewData.columns">
                                    <span class="text-sm">{{ formatCellValue(row[col]) }}</span>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td [attr.colspan]="previewData.columns.length + 1" class="text-center py-5">
                                    <div class="flex flex-column align-items-center text-500">
                                        <i class="pi pi-inbox text-4xl mb-3"></i>
                                        <span>Aucune donnée dans le fichier</span>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </ng-container>

            <!-- No Mapping Selected -->
            <div *ngIf="!loading && !previewData && !selectedMapping" class="surface-card shadow-2 border-round-xl p-5">
                <div class="flex flex-column align-items-center text-500">
                    <i class="pi pi-file-excel text-6xl mb-3"></i>
                    <h3 class="text-xl font-semibold text-700 mb-2">Sélectionnez un Mapping</h3>
                    <p class="text-center">Choisissez un mapping dans la liste ci-dessus pour prévisualiser les données du fichier Excel.</p>
                </div>
            </div>

            <!-- Error State -->
            <div *ngIf="!loading && !previewData && selectedMapping && errorMessage" class="surface-card shadow-2 border-round-xl p-5">
                <div class="flex flex-column align-items-center text-500">
                    <i class="pi pi-exclamation-triangle text-6xl mb-3 text-orange-500"></i>
                    <h3 class="text-xl font-semibold text-700 mb-2">Erreur de chargement</h3>
                    <p class="text-center">{{ errorMessage }}</p>
                    <button pButton pRipple label="Réessayer" icon="pi pi-refresh"
                            class="mt-3" (click)="loadPreview()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-100);
                font-weight: 600;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 300px;
            }
        }

        code {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
    `]
})
export class ImportPreviewComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    loading = false;
    mappingName: string | null = null;
    selectedMapping: string | null = null;
    previewLimit = 10;

    previewData: PreviewData | null = null;
    mappingDetails: ImportMapping | null = null;
    mappingOptions: { label: string; value: string }[] = [];
    errorMessage = '';

    constructor(
        private dataImportService: DataImportService,
        private messageService: MessageService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.loadMappingOptions();
        this.handleQueryParams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleQueryParams(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['mapping']) {
                this.mappingName = params['mapping'];
                this.selectedMapping = params['mapping'];
                this.loadPreview();
            }
        });
    }

    private loadMappingOptions(): void {
        this.dataImportService.getMappings()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (mappings) => {
                    this.mappingOptions = mappings.map(m => ({
                        label: this.formatMappingName(m.name),
                        value: m.name
                    }));
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger la liste des mappings'
                    });
                }
            });
    }

    onMappingChange(): void {
        this.mappingName = this.selectedMapping;
        if (this.selectedMapping) {
            this.loadPreview();
        }
    }

    loadPreview(): void {
        if (!this.selectedMapping) return;

        this.loading = true;
        this.errorMessage = '';
        this.previewData = null;

        // Load both preview data and mapping details in parallel
        this.dataImportService.preview(this.selectedMapping, this.previewLimit)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    this.previewData = data;
                    this.loadMappingDetails();
                },
                error: (err) => {
                    console.error('Error loading preview:', err);
                    this.errorMessage = err.error?.detail || 'Impossible de charger la prévisualisation. Le fichier est peut-être manquant.';
                    this.loading = false;
                }
            });
    }

    private loadMappingDetails(): void {
        if (!this.selectedMapping) {
            this.loading = false;
            return;
        }

        this.dataImportService.getMappingDetails(this.selectedMapping)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (details) => {
                    this.mappingDetails = details;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
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

    formatCellValue(value: unknown): string {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    getMappingFields(): string[] {
        if (!this.mappingDetails?.fields) return [];
        if (Array.isArray(this.mappingDetails.fields)) {
            if (typeof this.mappingDetails.fields[0] === 'string') {
                return this.mappingDetails.fields as string[];
            }
            return (this.mappingDetails.fields as MappingField[]).map(f => f.excel_column);
        }
        return [];
    }

    get moduleColor(): string {
        if (!this.mappingName) return '#6B7280';
        const module = getMappingModule(this.mappingName);
        return MODULE_CONFIG[module]?.color || '#6B7280';
    }

    get moduleIcon(): string {
        if (!this.mappingName) return 'pi pi-database';
        const module = getMappingModule(this.mappingName);
        return MODULE_CONFIG[module]?.icon || 'pi pi-database';
    }

    getModuleColor(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.color || '#6B7280';
    }

    getModuleIcon(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.icon || 'pi pi-database';
    }

    goToValidate(): void {
        if (this.selectedMapping) {
            this.router.navigate(['/dms-admin/data-import/execute'], {
                queryParams: { mapping: this.selectedMapping, mode: 'validate' }
            });
        }
    }

    goToImport(): void {
        if (this.selectedMapping) {
            this.router.navigate(['/dms-admin/data-import/execute'], {
                queryParams: { mapping: this.selectedMapping, mode: 'import' }
            });
        }
    }
}
