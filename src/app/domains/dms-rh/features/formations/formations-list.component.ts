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
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectModule } from 'primeng/select';

// Domain imports
import { DmsFormationService, Formation, FormationPlan, Formateur } from '@domains/dms-rh';

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
        AccordionModule,
        BadgeModule,
        TooltipModule,
        SkeletonModule,
        ToolbarModule,
        SelectModule
    ],
    template: `
        <div class="formations-list">
            <!-- Toolbar -->
            <p-toolbar styleClass="mb-3 surface-ground border-round">
                <ng-template #start>
                    <span class="text-xl font-semibold">Formations</span>
                    <p-tag [value]="formations.length + ' total'" severity="info" styleClass="ml-2"></p-tag>
                </ng-template>
                <ng-template #end>
                    <p-select [options]="typeOptions"
                              [(ngModel)]="selectedType"
                              (onChange)="onTypeFilterChange()"
                              placeholder="Filter by type"
                              [showClear]="true"
                              styleClass="mr-2">
                    </p-select>
                    <button pButton icon="pi pi-plus" label="Add Formation"
                            (click)="onAddFormation()">
                    </button>
                </ng-template>
            </p-toolbar>

            <!-- Loading State -->
            <div *ngIf="loading" class="grid">
                <div class="col-12 md:col-6 lg:col-4" *ngFor="let i of [1,2,3,4,5,6]">
                    <p-card>
                        <p-skeleton height="2rem" styleClass="mb-2"></p-skeleton>
                        <p-skeleton width="60%"></p-skeleton>
                        <p-skeleton width="40%" styleClass="mt-2"></p-skeleton>
                    </p-card>
                </div>
            </div>

            <!-- Grouped Formations by Type -->
            <div *ngIf="!loading" @.disabled>
            <p-accordion [multiple]="true">
                <p-accordionpanel *ngFor="let group of groupedFormations | keyvalue" [value]="group.key">
                    <ng-template pTemplate="header">
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-book"></i>
                            <span>{{ group.key }}</span>
                            <p-badge [value]="group.value.length" severity="info"></p-badge>
                        </div>
                    </ng-template>
                    <ng-template pTemplate="content">
                        <div class="grid">
                            <div class="col-12 md:col-6 lg:col-4" *ngFor="let formation of group.value">
                                <p-card styleClass="formation-card h-full">
                                    <ng-template pTemplate="header">
                                        <div class="formation-header p-3">
                                            <div class="flex justify-content-between align-items-start">
                                                <span class="formation-name">{{ formation.name }}</span>
                                                <p-tag [value]="formation.type"
                                                       [severity]="getTypeSeverity(formation.type)">
                                                </p-tag>
                                            </div>
                                        </div>
                                    </ng-template>

                                    <div class="formation-body">
                                        <div class="formation-info">
                                            <div class="info-item">
                                                <i class="pi pi-clock"></i>
                                                <span>{{ formation.duration_hours || 'N/A' }} hours</span>
                                            </div>
                                            <div class="info-item" *ngIf="formation.process_name">
                                                <i class="pi pi-cog"></i>
                                                <span>{{ formation.process_name }}</span>
                                            </div>
                                        </div>
                                        <p class="formation-description" *ngIf="formation.description">
                                            {{ formation.description | slice:0:100 }}{{ formation.description.length > 100 ? '...' : '' }}
                                        </p>
                                    </div>

                                    <ng-template pTemplate="footer">
                                        <div class="flex gap-2">
                                            <button pButton icon="pi pi-eye" class="p-button-text p-button-sm"
                                                    (click)="onViewFormation(formation)" pTooltip="View">
                                            </button>
                                            <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm"
                                                    (click)="onEditFormation(formation)" pTooltip="Edit">
                                            </button>
                                            <button pButton icon="pi pi-users" class="p-button-text p-button-sm"
                                                    (click)="onViewParticipants(formation)" pTooltip="Participants">
                                            </button>
                                        </div>
                                    </ng-template>
                                </p-card>
                            </div>
                        </div>
                    </ng-template>
                </p-accordionpanel>
            </p-accordion>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && formations.length === 0" class="empty-state">
                <i class="pi pi-book text-6xl text-color-secondary mb-3"></i>
                <h3>No formations found</h3>
                <p class="text-color-secondary">Start by adding your first formation</p>
                <button pButton label="Add Formation" icon="pi pi-plus" (click)="onAddFormation()"></button>
            </div>
        </div>
    `,
    styles: [`
        .formations-list {
            padding: 1rem;
        }

        .formation-card {
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }
        }

        .formation-header {
            background: var(--surface-ground);
            border-bottom: 1px solid var(--surface-border);
        }

        .formation-name {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-color);
        }

        .formation-body {
            padding: 0.5rem 0;
        }

        .formation-info {
            display: flex;
            gap: 1rem;
            margin-bottom: 0.5rem;

            .info-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                color: var(--text-color-secondary);

                i {
                    font-size: 0.75rem;
                }
            }
        }

        .formation-description {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0;
            line-height: 1.4;
        }

        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
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

    groupedFormations: Map<string, Formation[]> = new Map();
    selectedType: string | null = null;

    typeOptions = [
        { label: 'Initial', value: 'initial' },
        { label: 'Continuous', value: 'continuous' },
        { label: 'Recyclage', value: 'recyclage' },
        { label: 'Certification', value: 'certification' }
    ];

    constructor(private formationService: DmsFormationService) {}

    ngOnInit(): void {
        if (this.formations.length === 0) {
            this.loadFormations();
        } else {
            this.groupFormations();
        }
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
                    this.groupFormations();
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    private groupFormations(): void {
        this.groupedFormations = new Map();

        this.formations.forEach(formation => {
            const type = formation.type || 'Other';
            if (!this.groupedFormations.has(type)) {
                this.groupedFormations.set(type, []);
            }
            this.groupedFormations.get(type)!.push(formation);
        });
    }

    onTypeFilterChange(): void {
        this.loadFormations();
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
        this.addFormation.emit();
    }

    onViewFormation(formation: Formation): void {
        this.viewFormation.emit(formation);
    }

    onEditFormation(formation: Formation): void {
        this.editFormation.emit(formation);
    }

    onViewParticipants(formation: Formation): void {
        this.viewParticipants.emit(formation);
    }
}
