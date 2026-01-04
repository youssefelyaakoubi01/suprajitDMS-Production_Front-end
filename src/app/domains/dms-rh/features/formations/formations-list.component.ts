/**
 * Formations List Component
 * Domain: DMS-RH
 *
 * Displays and manages formations/trainings
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
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, MenuItem } from 'primeng/api';

// Domain imports
import { DmsFormationService, DmsExportService, DmsQualificationService, Formation, FormationPlan, Formateur, HRProcess } from '@domains/dms-rh';
import { FormationFormDialogComponent } from './formation-form-dialog.component';

@Component({
    selector: 'app-formations-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        Accordion,
        AccordionPanel,
        AccordionHeader,
        AccordionContent,
        BadgeModule,
        TooltipModule,
        SkeletonModule,
        ToolbarModule,
        SelectModule,
        MenuModule,
        ToastModule,
        RippleModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        FormationFormDialogComponent
    ],
    providers: [MessageService],
    template: `
        <div class="hr-page formations-page">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-content">
                    <div class="header-title-section">
                        <div class="header-icon">
                            <i class="pi pi-book"></i>
                        </div>
                        <div class="header-text">
                            <h1>Formations</h1>
                            <p>Gérer les formations et programmes de développement</p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                        <button pButton pRipple icon="pi pi-download"
                                class="p-button-outlined"
                                (click)="exportMenu.toggle($event)"
                                pTooltip="Exporter">
                        </button>
                        <button pButton pRipple icon="pi pi-plus" label="Nouvelle Formation"
                                class="p-button-primary"
                                (click)="onAddFormation()">
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="hr-stats-row">
                <div class="hr-stat-card stat-primary">
                    <div class="stat-icon">
                        <i class="pi pi-book"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ formations.length }}</span>
                        <span class="stat-label">Total Formations</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-success">
                    <div class="stat-icon">
                        <i class="pi pi-play"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getTypeCount('initial') }}</span>
                        <span class="stat-label">Initiales</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-info">
                    <div class="stat-icon">
                        <i class="pi pi-sync"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getTypeCount('continuous') }}</span>
                        <span class="stat-label">Continues</span>
                    </div>
                </div>
                <div class="hr-stat-card stat-warning">
                    <div class="stat-icon">
                        <i class="pi pi-refresh"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">{{ getTypeCount('recyclage') }}</span>
                        <span class="stat-label">Recyclage</span>
                    </div>
                </div>
            </div>

            <!-- Filter Section -->
            <div class="hr-filter-section">
                <div class="filter-group">
                    <p-iconfield>
                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                        <input type="text" pInputText [(ngModel)]="searchTerm"
                               (ngModelChange)="onSearchChange()"
                               placeholder="Rechercher une formation..."
                               class="search-input" />
                    </p-iconfield>
                </div>
                <div class="filter-group">
                    <p-select [options]="typeOptions"
                              [(ngModel)]="selectedType"
                              (onChange)="onTypeFilterChange()"
                              placeholder="Type de formation"
                              [showClear]="true"
                              appendTo="body"
                              styleClass="filter-select">
                    </p-select>
                </div>
                <div class="filter-chips">
                    <button *ngFor="let type of typeOptions"
                            pButton pRipple
                            [class]="'filter-chip ' + (selectedType === type.value ? 'active' : '')"
                            [label]="type.label"
                            (click)="onQuickFilter(type.value)">
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="hr-loading-grid">
                <div class="loading-card" *ngFor="let i of [1,2,3,4,5,6]">
                    <p-skeleton height="180px" styleClass="mb-2 border-round-lg"></p-skeleton>
                </div>
            </div>

            <!-- Grouped Formations by Type -->
            <div *ngIf="!loading && filteredFormations.length > 0" class="formations-content">
                <p-accordion [value]="activeAccordionValues" [multiple]="true">
                    <p-accordion-panel *ngFor="let group of groupedFormations | keyvalue" [value]="group.key">
                        <p-accordion-header>
                            <div class="accordion-header-content">
                                <div class="header-left">
                                    <span class="type-icon" [ngClass]="'type-' + group.key.toLowerCase()">
                                        <i [class]="getTypeIcon(group.key)"></i>
                                    </span>
                                    <span class="type-name">{{ getTypeLabel(group.key) }}</span>
                                </div>
                                <span class="type-count">{{ group.value.length }}</span>
                            </div>
                        </p-accordion-header>
                        <p-accordion-content>
                            <div class="formations-grid">
                                <div class="formation-card" *ngFor="let formation of group.value" pRipple
                                     (click)="onViewFormation(formation)">
                                    <div class="card-header" [ngClass]="'type-' + (formation.type || 'default').toLowerCase()">
                                        <div class="card-type-badge">
                                            <i [class]="getTypeIcon(formation.type)"></i>
                                            {{ formation.type || 'Formation' }}
                                        </div>
                                        <div class="card-actions" (click)="$event.stopPropagation()">
                                            <button pButton pRipple icon="pi pi-pencil"
                                                    class="p-button-rounded p-button-text p-button-sm"
                                                    (click)="onEditFormation(formation)"
                                                    pTooltip="Modifier">
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <h3 class="formation-title">{{ formation.name }}</h3>
                                        <p class="formation-description" *ngIf="formation.description">
                                            {{ formation.description | slice:0:80 }}{{ (formation.description.length || 0) > 80 ? '...' : '' }}
                                        </p>
                                        <div class="formation-meta">
                                            <div class="meta-item" *ngIf="formation.duration_hours">
                                                <i class="pi pi-clock"></i>
                                                <span>{{ formation.duration_hours }}h</span>
                                            </div>
                                            <div class="meta-item" *ngIf="formation.process_name">
                                                <i class="pi pi-cog"></i>
                                                <span>{{ formation.process_name }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-footer">
                                        <button pButton pRipple label="Participants" icon="pi pi-users"
                                                class="p-button-text p-button-sm"
                                                (click)="$event.stopPropagation(); onViewParticipants(formation)">
                                        </button>
                                        <button pButton pRipple label="Détails" icon="pi pi-arrow-right"
                                                class="p-button-text p-button-sm"
                                                (click)="$event.stopPropagation(); onViewFormation(formation)">
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </p-accordion-content>
                    </p-accordion-panel>
                </p-accordion>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && filteredFormations.length === 0" class="hr-empty-state">
                <div class="empty-icon">
                    <i class="pi pi-book"></i>
                </div>
                <h3>Aucune formation trouvée</h3>
                <p>{{ searchTerm || selectedType ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter votre première formation' }}</p>
                <button pButton pRipple label="Nouvelle Formation" icon="pi pi-plus"
                        class="p-button-primary"
                        (click)="onAddFormation()">
                </button>
            </div>

            <!-- Formation Form Dialog -->
            <app-formation-form-dialog
                [(visible)]="showFormDialog"
                [formation]="selectedFormation"
                [processes]="processes"
                (save)="onSaveFormation($event)"
                (cancel)="onCancelFormation()">
            </app-formation-form-dialog>

            <p-toast position="bottom-right"></p-toast>
        </div>
    `,
    styles: [`
        .formations-page {
            padding: 1.5rem;
            background: var(--surface-ground);
            min-height: 100vh;
        }

        .hr-page-header {
            margin-bottom: 1.5rem;
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .header-title-section {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-icon {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: var(--hr-gradient, linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%));
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);

            i {
                font-size: 1.5rem;
                color: white;
            }
        }

        .header-text {
            h1 {
                margin: 0;
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--text-color);
            }

            p {
                margin: 0.25rem 0 0;
                color: var(--text-color-secondary);
                font-size: 0.875rem;
            }
        }

        .header-actions {
            display: flex;
            gap: 0.75rem;
        }

        /* Stats Row */
        .hr-stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .hr-stat-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            }

            .stat-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 1.25rem;
                    color: white;
                }
            }

            &.stat-primary .stat-icon {
                background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            }

            &.stat-success .stat-icon {
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            }

            &.stat-info .stat-icon {
                background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
            }

            &.stat-warning .stat-icon {
                background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
            }

            .stat-content {
                display: flex;
                flex-direction: column;
            }

            .stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--text-color);
            }

            .stat-label {
                font-size: 0.75rem;
                color: var(--text-color-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }

        /* Filter Section */
        .hr-filter-section {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--surface-border);
        }

        .filter-group {
            flex-shrink: 0;
        }

        .search-input {
            width: 280px;
        }

        .filter-select {
            min-width: 200px;
        }

        .filter-chips {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-left: auto;
        }

        .filter-chip {
            background: var(--surface-ground) !important;
            border: 1px solid var(--surface-border) !important;
            color: var(--text-color-secondary) !important;
            font-size: 0.75rem !important;
            padding: 0.375rem 0.75rem !important;
            border-radius: 20px !important;
            transition: all 0.2s ease !important;

            &:hover {
                background: var(--surface-hover) !important;
            }

            &.active {
                background: var(--hr-primary, #8B5CF6) !important;
                border-color: var(--hr-primary, #8B5CF6) !important;
                color: white !important;
            }
        }

        /* Loading Grid */
        .hr-loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }

        .loading-card {
            background: var(--surface-card);
            border-radius: 12px;
            overflow: hidden;
        }

        /* Formations Content */
        .formations-content {
            :host ::ng-deep .p-accordion-header-link {
                padding: 1rem 1.25rem;
                background: var(--surface-card);
                border: 1px solid var(--surface-border);
                border-radius: 12px !important;
                margin-bottom: 0.5rem;
            }

            :host ::ng-deep .p-accordion-content {
                padding: 1rem;
                background: transparent;
                border: none;
            }
        }

        .accordion-header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .type-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;

            i {
                font-size: 1rem;
                color: white;
            }

            &.type-initial {
                background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
            }

            &.type-continuous {
                background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
            }

            &.type-recyclage {
                background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
            }

            &.type-certification {
                background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
            }

            &.type-other {
                background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%);
            }
        }

        .type-name {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-color);
        }

        .type-count {
            background: var(--surface-100);
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-color-secondary);
        }

        /* Formations Grid */
        .formations-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }

        .formation-card {
            background: var(--surface-card);
            border-radius: 12px;
            border: 1px solid var(--surface-border);
            overflow: hidden;
            cursor: pointer;
            transition: all 0.25s ease;

            &:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
                border-color: var(--hr-primary, #8B5CF6);
            }
        }

        .card-header {
            padding: 1rem 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--surface-border);

            &.type-initial {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.04) 100%);
            }

            &.type-continuous {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(96, 165, 250, 0.04) 100%);
            }

            &.type-recyclage {
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.04) 100%);
            }

            &.type-certification {
                background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(167, 139, 250, 0.04) 100%);
            }
        }

        .card-type-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-color-secondary);

            i {
                font-size: 0.875rem;
            }
        }

        .card-body {
            padding: 1.25rem;
        }

        .formation-title {
            margin: 0 0 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-color);
            line-height: 1.4;
        }

        .formation-description {
            margin: 0 0 1rem;
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            line-height: 1.5;
        }

        .formation-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.8125rem;
            color: var(--text-color-secondary);

            i {
                font-size: 0.875rem;
                color: var(--hr-primary, #8B5CF6);
            }
        }

        .card-footer {
            padding: 0.75rem 1.25rem;
            border-top: 1px solid var(--surface-border);
            display: flex;
            justify-content: space-between;
            background: var(--surface-50);
        }

        /* Empty State */
        .hr-empty-state {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--surface-card);
            border-radius: 16px;
            border: 2px dashed var(--surface-border);

            .empty-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: var(--surface-100);
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1.5rem;

                i {
                    font-size: 2rem;
                    color: var(--text-color-secondary);
                }
            }

            h3 {
                margin: 0 0 0.5rem;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-color);
            }

            p {
                margin: 0 0 1.5rem;
                color: var(--text-color-secondary);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .formations-page {
                padding: 1rem;
            }

            .header-content {
                flex-direction: column;
            }

            .header-actions {
                width: 100%;
                justify-content: flex-end;
            }

            .hr-filter-section {
                flex-direction: column;
                align-items: stretch;
            }

            .search-input {
                width: 100%;
            }

            .filter-chips {
                margin-left: 0;
                justify-content: flex-start;
            }

            .formations-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class FormationsListComponent implements OnInit, OnDestroy {
    @Input() formations: Formation[] = [];
    @Input() loading = false;

    @Output() addFormation = new EventEmitter<void>();
    @Output() viewFormation = new EventEmitter<Formation>();
    @Output() editFormation = new EventEmitter<Formation>();
    @Output() viewParticipants = new EventEmitter<Formation>();

    private destroy$ = new Subject<void>();

    filteredFormations: Formation[] = [];
    groupedFormations: Map<string, Formation[]> = new Map();
    selectedType: string | null = null;
    searchTerm: string = '';
    activeAccordionValues: string[] = [];

    // Dialog state
    showFormDialog = false;
    selectedFormation: Formation | null = null;
    processes: HRProcess[] = [];

    typeOptions = [
        { label: 'Initiale', value: 'initial' },
        { label: 'Continue', value: 'continuous' },
        { label: 'Recyclage', value: 'recyclage' },
        { label: 'Certification', value: 'certification' }
    ];

    // Export menu items
    exportMenuItems: MenuItem[] = [
        {
            label: 'Exporter en Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportToExcel()
        },
        {
            label: 'Exporter en CSV',
            icon: 'pi pi-file',
            command: () => this.exportToCsv()
        }
    ];

    constructor(
        private formationService: DmsFormationService,
        private qualificationService: DmsQualificationService,
        private exportService: DmsExportService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadProcesses();
        if (this.formations.length === 0) {
            this.loadFormations();
        } else {
            this.filterAndGroupFormations();
        }
    }

    loadProcesses(): void {
        this.qualificationService.getProcesses()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (processes) => {
                    this.processes = processes;
                },
                error: (err) => {
                    console.error('Error loading processes:', err);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadFormations(): void {
        this.loading = true;
        const params = this.selectedType ? { type: this.selectedType } : undefined;

        this.formationService.getFormations(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (formations) => {
                    this.formations = formations;
                    this.filterAndGroupFormations();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private filterAndGroupFormations(): void {
        // Apply filters
        this.filteredFormations = this.formations.filter(formation => {
            const matchesSearch = !this.searchTerm ||
                formation.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                formation.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesType = !this.selectedType ||
                formation.type?.toLowerCase() === this.selectedType.toLowerCase();
            return matchesSearch && matchesType;
        });

        // Group formations
        this.groupedFormations = new Map();
        this.filteredFormations.forEach(formation => {
            const type = formation.type || 'Other';
            if (!this.groupedFormations.has(type)) {
                this.groupedFormations.set(type, []);
            }
            this.groupedFormations.get(type)!.push(formation);
        });

        // Expand all accordion panels by default
        this.activeAccordionValues = Array.from(this.groupedFormations.keys());
    }

    onSearchChange(): void {
        this.filterAndGroupFormations();
    }

    onTypeFilterChange(): void {
        this.filterAndGroupFormations();
    }

    onQuickFilter(type: string): void {
        if (this.selectedType === type) {
            this.selectedType = null;
        } else {
            this.selectedType = type;
        }
        this.filterAndGroupFormations();
    }

    getTypeCount(type: string): number {
        return this.formations.filter(f =>
            f.type?.toLowerCase() === type.toLowerCase()
        ).length;
    }

    getTypeIcon(type: string | undefined): string {
        const icons: Record<string, string> = {
            'initial': 'pi pi-play',
            'continuous': 'pi pi-sync',
            'recyclage': 'pi pi-refresh',
            'certification': 'pi pi-verified'
        };
        return icons[type?.toLowerCase() || ''] || 'pi pi-book';
    }

    getTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            'initial': 'Formations Initiales',
            'continuous': 'Formations Continues',
            'recyclage': 'Formations Recyclage',
            'certification': 'Certifications',
            'Other': 'Autres Formations'
        };
        return labels[type] || type;
    }

    getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            'initial': 'info',
            'continuous': 'success',
            'recyclage': 'warn',
            'certification': 'secondary'
        };
        return map[type?.toLowerCase()] || 'info';
    }

    onAddFormation(): void {
        this.selectedFormation = null;
        this.showFormDialog = true;
        this.addFormation.emit();
    }

    onViewFormation(formation: Formation): void {
        this.viewFormation.emit(formation);
    }

    onEditFormation(formation: Formation): void {
        this.selectedFormation = formation;
        this.showFormDialog = true;
        this.editFormation.emit(formation);
    }

    onSaveFormation(formData: Partial<Formation>): void {
        if (this.selectedFormation) {
            // Update existing formation
            this.formationService.updateFormation(this.selectedFormation.id!, formData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Formation mise à jour avec succès'
                        });
                        this.showFormDialog = false;
                        this.selectedFormation = null;
                        this.loadFormations();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Erreur lors de la mise à jour de la formation'
                        });
                    }
                });
        } else {
            // Create new formation
            this.formationService.createFormation(formData)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Formation créée avec succès'
                        });
                        this.showFormDialog = false;
                        this.loadFormations();
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Erreur',
                            detail: 'Erreur lors de la création de la formation'
                        });
                    }
                });
        }
    }

    onCancelFormation(): void {
        this.showFormDialog = false;
        this.selectedFormation = null;
    }

    onViewParticipants(formation: Formation): void {
        this.viewParticipants.emit(formation);
    }

    exportToExcel(): void {
        if (this.formations.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Aucune donnée',
                detail: 'Aucune formation à exporter'
            });
            return;
        }

        this.exportService.exportFormations(this.formations);
        this.messageService.add({
            severity: 'success',
            summary: 'Export terminé',
            detail: `${this.formations.length} formations exportées en Excel`
        });
    }

    exportToCsv(): void {
        if (this.formations.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Aucune donnée',
                detail: 'Aucune formation à exporter'
            });
            return;
        }

        this.exportService.exportFormationsToCsv(this.formations);
        this.messageService.add({
            severity: 'success',
            summary: 'Export terminé',
            detail: `${this.formations.length} formations exportées en CSV`
        });
    }
}
