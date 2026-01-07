/**
 * Import Dashboard Component
 * Domain: DMS-Admin
 *
 * Dashboard for managing Excel data imports
 * Shows status of all import mappings grouped by module
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { FileUpload, FileUploadHandlerEvent } from 'primeng/fileupload';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DataImportService } from '../../services/data-import.service';
import {
    ImportStatus,
    ImportMappingStatus,
    ImportModule,
    ImportResult,
    MODULE_CONFIG,
    HR_MAPPINGS,
    TECH_MAPPINGS,
    OPERATIONS_MAPPINGS,
    getMappingModule,
    UploadResult
} from '../../models';

interface MappingCard {
    mapping: ImportMappingStatus;
    module: ImportModule;
    moduleConfig: { label: string; icon: string; color: string };
}

@Component({
    selector: 'app-import-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        TableModule,
        TagModule,
        ButtonModule,
        TabsModule,
        TooltipModule,
        ProgressBarModule,
        SkeletonModule,
        ToastModule,
        ConfirmDialogModule,
        RippleModule,
        BadgeModule,
        FileUpload
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="flex flex-column gap-4">
            <!-- Header -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                            <i class="pi pi-upload text-white text-3xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold m-0 text-900">
                                Import de Données
                            </h1>
                            <p class="text-500 mt-1 mb-0 text-sm md:text-base">
                                Import Excel vers la base de données • {{ availableFiles }} fichiers disponibles
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <button pButton pRipple label="Rafraîchir" icon="pi pi-refresh"
                                class="p-button-outlined" (click)="loadStatus()" [loading]="loading"></button>
                        <button pButton pRipple label="Import Séquentiel" icon="pi pi-play"
                                class="p-button-success" (click)="confirmSequenceImport()"
                                [disabled]="!hasReadyMappings"></button>
                    </div>
                </div>
            </div>

            <!-- File Upload Section -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3 mb-4">
                    <div class="flex align-items-center gap-3">
                        <div class="flex align-items-center justify-content-center border-round-lg"
                             style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
                            <i class="pi pi-cloud-upload text-white text-xl"></i>
                        </div>
                        <div>
                            <div class="text-lg font-semibold text-900">Téléverser des Fichiers Excel</div>
                            <div class="text-500 text-sm">Glissez-déposez ou sélectionnez des fichiers .xlsx ou .xls (max 50 MB)</div>
                        </div>
                    </div>
                </div>
                <p-fileupload
                    #fileUploader
                    name="file"
                    [customUpload]="true"
                    (uploadHandler)="onUploadHandler($event)"
                    [multiple]="true"
                    accept=".xlsx,.xls"
                    [maxFileSize]="52428800"
                    chooseLabel="Choisir"
                    uploadLabel="Téléverser"
                    cancelLabel="Annuler"
                    chooseIcon="pi pi-folder-open"
                    uploadIcon="pi pi-cloud-upload"
                    cancelIcon="pi pi-times">
                    <ng-template #empty>
                        <div class="flex flex-column align-items-center justify-content-center py-5">
                            <i class="pi pi-file-excel text-5xl text-400 mb-3"></i>
                            <span class="text-500">Glissez vos fichiers Excel ici</span>
                        </div>
                    </ng-template>
                </p-fileupload>
            </div>

            <!-- Stats Cards -->
            <div class="grid">
                <div class="col-12 sm:col-6 lg:col-3">
                    <div class="surface-card shadow-2 border-round-xl p-4">
                        <div class="flex align-items-center gap-3">
                            <div class="flex align-items-center justify-content-center border-round-lg"
                                 style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);">
                                <i class="pi pi-file-excel text-white text-xl"></i>
                            </div>
                            <div>
                                <div class="text-500 text-sm">Fichiers Disponibles</div>
                                <div class="text-2xl font-bold text-900">{{ availableFiles }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 sm:col-6 lg:col-3">
                    <div class="surface-card shadow-2 border-round-xl p-4">
                        <div class="flex align-items-center gap-3">
                            <div class="flex align-items-center justify-content-center border-round-lg"
                                 style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                                <i class="pi pi-check-circle text-white text-xl"></i>
                            </div>
                            <div>
                                <div class="text-500 text-sm">Prêts à Importer</div>
                                <div class="text-2xl font-bold text-900">{{ readyMappings }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 sm:col-6 lg:col-3">
                    <div class="surface-card shadow-2 border-round-xl p-4">
                        <div class="flex align-items-center gap-3">
                            <div class="flex align-items-center justify-content-center border-round-lg"
                                 style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
                                <i class="pi pi-exclamation-triangle text-white text-xl"></i>
                            </div>
                            <div>
                                <div class="text-500 text-sm">Fichiers Manquants</div>
                                <div class="text-2xl font-bold text-900">{{ missingFiles }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 sm:col-6 lg:col-3">
                    <div class="surface-card shadow-2 border-round-xl p-4">
                        <div class="flex align-items-center gap-3">
                            <div class="flex align-items-center justify-content-center border-round-lg"
                                 style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);">
                                <i class="pi pi-list text-white text-xl"></i>
                            </div>
                            <div>
                                <div class="text-500 text-sm">Total Mappings</div>
                                <div class="text-2xl font-bold text-900">{{ totalMappings }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import executing progress -->
            <div *ngIf="importing" class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex align-items-center gap-3 mb-3">
                    <i class="pi pi-spin pi-spinner text-2xl text-primary"></i>
                    <span class="text-lg font-semibold">Import en cours...</span>
                </div>
                <p-progressBar [value]="importProgress" [showValue]="true"></p-progressBar>
                <div class="text-500 text-sm mt-2">{{ currentImportMapping }}</div>
            </div>

            <!-- Tab View by Module -->
            <div class="surface-card shadow-2 border-round-xl">
                <p-tabs [value]="activeTabIndex" (valueChange)="onTabChange($event)">
                    <p-tablist>
                        <p-tab [value]="0">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-database"></i>
                                <span>Tous</span>
                                <p-badge [value]="totalMappings.toString()" severity="secondary"></p-badge>
                            </div>
                        </p-tab>
                        <p-tab [value]="1">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-users" style="color: #8B5CF6"></i>
                                <span>RH</span>
                                <p-badge [value]="hrMappings.length.toString()" [style]="{'background': '#8B5CF6'}"></p-badge>
                            </div>
                        </p-tab>
                        <p-tab [value]="2">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-cog" style="color: #3B82F6"></i>
                                <span>Tech</span>
                                <p-badge [value]="techMappings.length.toString()" [style]="{'background': '#3B82F6'}"></p-badge>
                            </div>
                        </p-tab>
                        <p-tab [value]="3">
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-bolt" style="color: #10B981"></i>
                                <span>Operations</span>
                                <p-badge [value]="operationsMappings.length.toString()" [style]="{'background': '#10B981'}"></p-badge>
                            </div>
                        </p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <p-tabpanel [value]="0">
                            <ng-container *ngTemplateOutlet="mappingsTable; context: { $implicit: allMappings }"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel [value]="1">
                            <ng-container *ngTemplateOutlet="mappingsTable; context: { $implicit: hrMappings }"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel [value]="2">
                            <ng-container *ngTemplateOutlet="mappingsTable; context: { $implicit: techMappings }"></ng-container>
                        </p-tabpanel>
                        <p-tabpanel [value]="3">
                            <ng-container *ngTemplateOutlet="mappingsTable; context: { $implicit: operationsMappings }"></ng-container>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </div>

            <!-- Mappings Table Template -->
            <ng-template #mappingsTable let-mappings>
                <p-table [value]="mappings || []" [loading]="loading" [rowHover]="true"
                         styleClass="p-datatable-sm" [paginator]="(mappings?.length || 0) > 10" [rows]="10">
                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 3rem"></th>
                            <th>Mapping</th>
                            <th>Modèle</th>
                            <th>Pattern Fichier</th>
                            <th class="text-center">Statut</th>
                            <th class="text-center" style="width: 15rem">Actions</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-item>
                        <tr>
                            <td>
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     [style.background]="getModuleColor(item.name) + '20'"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i [class]="getModuleIcon(item.name)"
                                       [style.color]="getModuleColor(item.name)"></i>
                                </div>
                            </td>
                            <td>
                                <div class="font-semibold text-900">{{ formatMappingName(item.name) }}</div>
                                <div class="text-500 text-sm">{{ item.name }}</div>
                            </td>
                            <td>
                                <code class="text-sm bg-gray-100 px-2 py-1 border-round">{{ item.model }}</code>
                            </td>
                            <td>
                                <span class="text-600 text-sm">{{ item.file_pattern }}</span>
                            </td>
                            <td class="text-center">
                                <p-tag *ngIf="item.file_found" value="Prêt" severity="success" icon="pi pi-check"></p-tag>
                                <p-tag *ngIf="!item.file_found" value="Fichier manquant" severity="warn" icon="pi pi-exclamation-triangle"></p-tag>
                            </td>
                            <td class="text-center">
                                <div class="flex gap-2 justify-content-center">
                                    <button pButton pRipple icon="pi pi-eye" class="p-button-text p-button-sm"
                                            pTooltip="Prévisualiser" tooltipPosition="top"
                                            [disabled]="!item.file_found"
                                            (click)="previewMapping(item.name)"></button>
                                    <button pButton pRipple icon="pi pi-check-square" class="p-button-text p-button-sm p-button-info"
                                            pTooltip="Valider" tooltipPosition="top"
                                            [disabled]="!item.file_found"
                                            (click)="validateMapping(item.name)"></button>
                                    <button pButton pRipple icon="pi pi-upload" class="p-button-text p-button-sm p-button-success"
                                            pTooltip="Importer" tooltipPosition="top"
                                            [disabled]="!item.file_found"
                                            (click)="confirmImport(item.name)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="6" class="text-center py-5">
                                <div class="flex flex-column align-items-center text-500">
                                    <i class="pi pi-inbox text-4xl mb-3"></i>
                                    <span>Aucun mapping disponible</span>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </ng-template>

            <!-- Source Directory Info -->
            <div class="surface-card shadow-1 border-round-xl p-4">
                <div class="flex align-items-center gap-2 mb-2">
                    <i class="pi pi-folder text-500"></i>
                    <span class="font-semibold text-700">Répertoire Source</span>
                </div>
                <code class="text-sm text-600">/tmp/DMS DATA</code>
                <p class="text-500 text-sm mt-2 mb-0">
                    Les fichiers Excel doivent être placés dans ce répertoire pour être détectés.
                </p>
            </div>
        </div>
    `,
    styles: [`
        :host ::ng-deep {
            .p-tabs .p-tablist {
                border-bottom: 2px solid var(--surface-border);
            }

            .p-tabs .p-tab {
                border: none;
                border-bottom: 2px solid transparent;
                margin-bottom: -2px;
            }

            .p-tabs .p-tab.p-tab-active {
                border-bottom-color: var(--primary-color);
            }

            .p-tabs .p-tabpanels {
                padding: 1rem 0 0 0;
            }
        }

        code {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
    `]
})
export class ImportDashboardComponent implements OnInit, OnDestroy {
    @ViewChild('fileUploader') fileUploader!: FileUpload;

    private destroy$ = new Subject<void>();

    loading = true;
    importing = false;
    uploading = false;
    importProgress = 0;
    currentImportMapping = '';

    status: ImportStatus | null = null;
    activeTabIndex = 0;

    allMappings: ImportMappingStatus[] = [];
    hrMappings: ImportMappingStatus[] = [];
    techMappings: ImportMappingStatus[] = [];
    operationsMappings: ImportMappingStatus[] = [];

    constructor(
        private dataImportService: DataImportService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        this.loadStatus();
        this.handleQueryParams();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleQueryParams(): void {
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            const module = params['module'] as ImportModule;
            if (module) {
                switch (module) {
                    case 'hr': this.activeTabIndex = 1; break;
                    case 'tech': this.activeTabIndex = 2; break;
                    case 'operations': this.activeTabIndex = 3; break;
                    default: this.activeTabIndex = 0;
                }
            }
        });
    }

    loadStatus(): void {
        this.loading = true;
        this.dataImportService.getStatus()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (status) => {
                    this.status = status;
                    const mappings = status?.mappings || [];
                    this.allMappings = mappings;
                    this.hrMappings = mappings.filter(m => HR_MAPPINGS.includes(m.name));
                    this.techMappings = mappings.filter(m => TECH_MAPPINGS.includes(m.name));
                    this.operationsMappings = mappings.filter(m => OPERATIONS_MAPPINGS.includes(m.name));
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error loading import status:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger le statut des imports'
                    });
                    this.loading = false;
                }
            });
    }

    get availableFiles(): number {
        return this.status?.available_files?.length || 0;
    }

    get totalMappings(): number {
        return this.allMappings?.length || 0;
    }

    get readyMappings(): number {
        return this.allMappings?.filter(m => m.file_found)?.length || 0;
    }

    get missingFiles(): number {
        return this.allMappings?.filter(m => !m.file_found)?.length || 0;
    }

    get hasReadyMappings(): boolean {
        return this.readyMappings > 0;
    }

    onTabChange(index: string | number | undefined): void {
        if (index !== undefined && typeof index === 'number') {
            this.activeTabIndex = index;
        }
    }

    formatMappingName(name: string): string {
        return name
            .replace(/_MAPPING$/, '')
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    getModuleColor(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.color || '#6B7280';
    }

    getModuleIcon(mappingName: string): string {
        const module = getMappingModule(mappingName);
        return MODULE_CONFIG[module]?.icon || 'pi pi-database';
    }

    previewMapping(mappingName: string): void {
        this.router.navigate(['/dms-admin/data-import/preview'], {
            queryParams: { mapping: mappingName }
        });
    }

    validateMapping(mappingName: string): void {
        this.router.navigate(['/dms-admin/data-import/execute'], {
            queryParams: { mapping: mappingName, mode: 'validate' }
        });
    }

    confirmImport(mappingName: string): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir importer "${this.formatMappingName(mappingName)}" ?`,
            header: 'Confirmation',
            icon: 'pi pi-upload',
            acceptLabel: 'Importer',
            rejectLabel: 'Annuler',
            accept: () => {
                this.router.navigate(['/dms-admin/data-import/execute'], {
                    queryParams: { mapping: mappingName, mode: 'import' }
                });
            }
        });
    }

    confirmSequenceImport(): void {
        const readyCount = this.readyMappings;
        this.confirmationService.confirm({
            message: `Importer séquentiellement ${readyCount} mapping(s) prêts ? L'ordre respectera les dépendances FK.`,
            header: 'Import Séquentiel',
            icon: 'pi pi-play',
            acceptLabel: 'Démarrer',
            rejectLabel: 'Annuler',
            accept: () => {
                this.router.navigate(['/dms-admin/data-import/execute'], {
                    queryParams: { mode: 'sequence' }
                });
            }
        });
    }

    // ==================== FILE UPLOAD ====================

    onUploadHandler(event: FileUploadHandlerEvent): void {
        const files = event.files;
        if (!files || files.length === 0) return;

        this.uploading = true;
        let completedCount = 0;
        let successCount = 0;
        let errorCount = 0;

        files.forEach((file: File) => {
            this.dataImportService.uploadFile(file)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (result: UploadResult) => {
                        completedCount++;
                        if (result.success) {
                            successCount++;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Fichier téléversé',
                                detail: result.replaced
                                    ? `${result.file_name} a été remplacé`
                                    : `${result.file_name} a été ajouté`,
                                life: 4000
                            });
                        } else {
                            errorCount++;
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Erreur',
                                detail: result.error || `Échec du téléversement de ${file.name}`,
                                life: 5000
                            });
                        }
                        this.checkUploadComplete(completedCount, files.length, successCount);
                    },
                    error: (err) => {
                        completedCount++;
                        errorCount++;
                        console.error('Upload error:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: `Erreur lors du téléversement de ${file.name}`,
                            life: 5000
                        });
                        this.checkUploadComplete(completedCount, files.length, successCount);
                    }
                });
        });
    }

    private checkUploadComplete(completed: number, total: number, successCount: number): void {
        if (completed === total) {
            this.uploading = false;
            // Clear the file upload component
            if (this.fileUploader) {
                this.fileUploader.clear();
            }
            // Refresh the status to show newly uploaded files
            if (successCount > 0) {
                this.loadStatus();
            }
        }
    }
}
