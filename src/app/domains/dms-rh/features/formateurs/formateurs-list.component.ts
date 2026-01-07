/**
 * Formateurs List Component
 * Domain: DMS-RH
 *
 * Manages trainers/formateurs with full CRUD operations
 */
import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { MessageService, ConfirmationService } from 'primeng/api';

// Domain imports
import { DmsFormationService } from '../../services/formation.service';
import { Formateur, TrainerSpecialization } from '../../models';

@Component({
    selector: 'app-formateurs-list',
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
        DialogModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        SkeletonModule,
        RippleModule,
        AvatarModule,
        IconFieldModule,
        InputIconModule,
        TabsModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <div class="formateurs-container">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-user-edit"></i>
                    </div>
                    <div class="title-text">
                        <h1>Formateurs</h1>
                        <span class="subtitle">Gestion des formateurs et leurs spécialisations</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button pButton pRipple
                            icon="pi pi-refresh"
                            class="p-button-outlined p-button-secondary"
                            (click)="loadFormateurs()"
                            [loading]="loading"
                            pTooltip="Rafraîchir">
                    </button>
                    <button pButton pRipple
                            icon="pi pi-plus"
                            label="Nouveau Formateur"
                            class="p-button-primary"
                            (click)="openNewDialog()">
                    </button>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ formateurs().length }}</div>
                        <div class="stat-label">Total Formateurs</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ activeCount() }}</div>
                        <div class="stat-label">Actifs</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: var(--hr-danger);">
                        <i class="pi pi-times-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-danger">{{ inactiveCount() }}</div>
                        <div class="stat-label">Inactifs</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--hr-info);">
                        <i class="pi pi-bookmark"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-info">{{ specializations.length }}</div>
                        <div class="stat-label">Spécialisations</div>
                    </div>
                </div>
            </div>

            <!-- Main Content with Tabs -->
            <div class="hr-section-card">
                <p-tabs [value]="activeTabIndex">
                    <p-tablist>
                        <p-tab [value]="0" class="flex items-center gap-2">
                            <i class="pi pi-users"></i>
                            <span>Formateurs</span>
                            <p-tag [value]="formateurs().length.toString()" severity="info" [rounded]="true"></p-tag>
                        </p-tab>
                        <p-tab [value]="1" class="flex items-center gap-2">
                            <i class="pi pi-bookmark"></i>
                            <span>Spécialisations</span>
                            <p-tag [value]="specializations.length.toString()" severity="secondary" [rounded]="true"></p-tag>
                        </p-tab>
                    </p-tablist>
                    <p-tabpanels>
                        <!-- Formateurs Tab Panel -->
                        <p-tabpanel [value]="0">
                            <div class="tab-content">
                            <div class="section-header">
                                <span class="section-title">
                                    <i class="pi pi-list"></i>
                                    Liste des Formateurs
                                </span>
                                <div class="section-actions">
                                    <p-iconfield>
                                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                        <input pInputText type="text"
                                               [(ngModel)]="searchTerm"
                                               (input)="onSearch()"
                                               placeholder="Rechercher..."
                                               class="search-input" />
                                    </p-iconfield>
                                    <p-select [options]="statusOptions"
                                              [(ngModel)]="selectedStatus"
                                              (onChange)="onFilterChange()"
                                              optionLabel="label"
                                              optionValue="value"
                                              placeholder="Statut"
                                              [showClear]="true"
                                              styleClass="filter-select">
                                    </p-select>
                                    <button pButton pRipple
                                            icon="pi pi-plus"
                                            label="Nouveau"
                                            class="p-button-primary"
                                            (click)="openNewDialog()">
                                    </button>
                                </div>
                            </div>

                            <div class="section-body">
                                <!-- Loading State -->
                                <div *ngIf="loading" class="loading-skeleton">
                                    <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
                                        <p-skeleton shape="circle" size="40px"></p-skeleton>
                                        <p-skeleton width="150px" height="16px"></p-skeleton>
                                        <p-skeleton width="180px" height="16px"></p-skeleton>
                                        <p-skeleton width="100px" height="24px" borderRadius="12px"></p-skeleton>
                                        <p-skeleton width="80px" height="16px"></p-skeleton>
                                    </div>
                                </div>

                                <!-- Data Table -->
                                <p-table *ngIf="!loading"
                                         [value]="filteredFormateurs()"
                                         [paginator]="true"
                                         [rows]="10"
                                         [rowsPerPageOptions]="[5, 10, 25, 50]"
                                         [showCurrentPageReport]="true"
                                         currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} formateurs"
                                         [rowHover]="true"
                                         dataKey="id"
                                         styleClass="p-datatable-sm hr-table">

                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 250px" pSortableColumn="name">Formateur <p-sortIcon field="name"></p-sortIcon></th>
                                            <th pSortableColumn="email">Email <p-sortIcon field="email"></p-sortIcon></th>
                                            <th>Téléphone</th>
                                            <th pSortableColumn="specialization">Spécialisation <p-sortIcon field="specialization"></p-sortIcon></th>
                                            <th style="width: 100px; text-align: center">Statut</th>
                                            <th style="width: 120px; text-align: center">Actions</th>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="body" let-formateur>
                                        <tr>
                                            <!-- Formateur Column -->
                                            <td>
                                                <div class="formateur-info">
                                                    <p-avatar [label]="getInitials(formateur.name)"
                                                              shape="circle"
                                                              size="large"
                                                              [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                                    </p-avatar>
                                                    <div class="formateur-details">
                                                        <span class="formateur-name">{{ formateur.name }}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            <!-- Email Column -->
                                            <td>
                                                <span *ngIf="formateur.email" class="email-link">
                                                    <i class="pi pi-envelope"></i>
                                                    {{ formateur.email }}
                                                </span>
                                                <span *ngIf="!formateur.email" class="text-muted">-</span>
                                            </td>

                                            <!-- Phone Column -->
                                            <td>
                                                <span *ngIf="formateur.phone" class="phone-link">
                                                    <i class="pi pi-phone"></i>
                                                    {{ formateur.phone }}
                                                </span>
                                                <span *ngIf="!formateur.phone" class="text-muted">-</span>
                                            </td>

                                            <!-- Specialization Column -->
                                            <td>
                                                <p-tag *ngIf="formateur.specialization || formateur.specialization_name"
                                                       [value]="formateur.specialization_name || formateur.specialization"
                                                       severity="info"
                                                       [rounded]="true">
                                                </p-tag>
                                                <span *ngIf="!formateur.specialization && !formateur.specialization_name" class="text-muted">-</span>
                                            </td>

                                            <!-- Status Column -->
                                            <td class="text-center">
                                                <p-tag [value]="formateur.is_active ? 'Actif' : 'Inactif'"
                                                       [severity]="formateur.is_active ? 'success' : 'danger'"
                                                       [rounded]="true">
                                                </p-tag>
                                            </td>

                                            <!-- Actions Column -->
                                            <td class="text-center">
                                                <div class="hr-action-buttons">
                                                    <button pButton pRipple
                                                            icon="pi pi-pencil"
                                                            class="p-button-text p-button-rounded p-button-sm"
                                                            (click)="editFormateur(formateur)"
                                                            pTooltip="Modifier">
                                                    </button>
                                                    <button pButton pRipple
                                                            icon="pi pi-trash"
                                                            class="p-button-text p-button-rounded p-button-danger p-button-sm"
                                                            (click)="confirmDelete(formateur)"
                                                            pTooltip="Supprimer">
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="emptymessage">
                                        <tr>
                                            <td colspan="6">
                                                <div class="hr-empty-state">
                                                    <i class="pi pi-user-edit empty-icon"></i>
                                                    <h3>Aucun Formateur Trouvé</h3>
                                                    <p>Commencez par ajouter un formateur</p>
                                                    <button pButton pRipple
                                                            icon="pi pi-plus"
                                                            label="Ajouter un Formateur"
                                                            class="p-button-primary"
                                                            (click)="openNewDialog()">
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        </div>
                        </p-tabpanel>

                        <!-- Spécialisations Tab Panel -->
                        <p-tabpanel [value]="1">
                            <div class="tab-content">
                            <div class="section-header">
                                <span class="section-title">
                                    <i class="pi pi-bookmark"></i>
                                    Liste des Spécialisations
                                </span>
                                <div class="section-actions">
                                    <p-iconfield>
                                        <p-inputicon styleClass="pi pi-search"></p-inputicon>
                                        <input pInputText type="text"
                                               [(ngModel)]="specSearchTerm"
                                               (input)="onSpecSearch()"
                                               placeholder="Rechercher..."
                                               class="search-input" />
                                    </p-iconfield>
                                    <button pButton pRipple
                                            icon="pi pi-plus"
                                            label="Nouvelle Spécialisation"
                                            class="p-button-primary"
                                            (click)="openSpecDialog()">
                                    </button>
                                </div>
                            </div>

                            <div class="section-body">
                                <!-- Loading State -->
                                <div *ngIf="loadingSpec" class="loading-skeleton">
                                    <div class="skeleton-row" *ngFor="let i of [1,2,3,4]">
                                        <p-skeleton width="200px" height="16px"></p-skeleton>
                                        <p-skeleton width="300px" height="16px"></p-skeleton>
                                        <p-skeleton width="80px" height="24px" borderRadius="12px"></p-skeleton>
                                    </div>
                                </div>

                                <!-- Specializations Table -->
                                <p-table *ngIf="!loadingSpec"
                                         [value]="filteredSpecializations()"
                                         [paginator]="true"
                                         [rows]="10"
                                         [rowsPerPageOptions]="[5, 10, 25]"
                                         [showCurrentPageReport]="true"
                                         currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords} spécialisations"
                                         [rowHover]="true"
                                         dataKey="id"
                                         styleClass="p-datatable-sm hr-table">

                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 250px" pSortableColumn="name">Nom <p-sortIcon field="name"></p-sortIcon></th>
                                            <th>Description</th>
                                            <th style="width: 100px; text-align: center">Statut</th>
                                            <th style="width: 120px; text-align: center">Actions</th>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="body" let-spec>
                                        <tr>
                                            <td>
                                                <div class="spec-info">
                                                    <div class="spec-icon">
                                                        <i class="pi pi-bookmark"></i>
                                                    </div>
                                                    <span class="spec-name">{{ spec.name }}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span *ngIf="spec.description" class="spec-desc">{{ spec.description }}</span>
                                                <span *ngIf="!spec.description" class="text-muted">-</span>
                                            </td>
                                            <td class="text-center">
                                                <p-tag [value]="spec.is_active !== false ? 'Actif' : 'Inactif'"
                                                       [severity]="spec.is_active !== false ? 'success' : 'danger'"
                                                       [rounded]="true">
                                                </p-tag>
                                            </td>
                                            <td class="text-center">
                                                <div class="hr-action-buttons">
                                                    <button pButton pRipple
                                                            icon="pi pi-pencil"
                                                            class="p-button-text p-button-rounded p-button-sm"
                                                            (click)="editSpecialization(spec)"
                                                            pTooltip="Modifier">
                                                    </button>
                                                    <button pButton pRipple
                                                            icon="pi pi-trash"
                                                            class="p-button-text p-button-rounded p-button-danger p-button-sm"
                                                            (click)="confirmDeleteSpec(spec)"
                                                            pTooltip="Supprimer">
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="emptymessage">
                                        <tr>
                                            <td colspan="4">
                                                <div class="hr-empty-state">
                                                    <i class="pi pi-bookmark empty-icon"></i>
                                                    <h3>Aucune Spécialisation Trouvée</h3>
                                                    <p>Commencez par ajouter une spécialisation</p>
                                                    <button pButton pRipple
                                                            icon="pi pi-plus"
                                                            label="Ajouter une Spécialisation"
                                                            class="p-button-primary"
                                                            (click)="openSpecDialog()">
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        </div>
                        </p-tabpanel>
                    </p-tabpanels>
                </p-tabs>
            </div>
        </div>

        <!-- Formateur Dialog -->
        <p-dialog [(visible)]="showDialog"
                  [header]="editingFormateur ? 'Modifier Formateur' : 'Nouveau Formateur'"
                  [modal]="true"
                  [style]="{width: '500px'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog">
            <form [formGroup]="formateurForm" class="formateur-form">
                <div class="form-field">
                    <label for="name">
                        <i class="pi pi-user"></i> Nom <span class="required">*</span>
                    </label>
                    <input pInputText id="name" formControlName="name"
                           placeholder="Nom du formateur" class="w-full" />
                    <small class="p-error" *ngIf="formateurForm.get('name')?.invalid && formateurForm.get('name')?.touched">
                        Le nom est requis
                    </small>
                </div>

                <div class="form-field">
                    <label for="email">
                        <i class="pi pi-envelope"></i> Email
                    </label>
                    <input pInputText id="email" formControlName="email"
                           placeholder="email@exemple.com" class="w-full" />
                    <small class="p-error" *ngIf="formateurForm.get('email')?.errors?.['email']">
                        Email invalide
                    </small>
                </div>

                <div class="form-field">
                    <label for="phone">
                        <i class="pi pi-phone"></i> Téléphone
                    </label>
                    <input pInputText id="phone" formControlName="phone"
                           placeholder="+212 6XX XXX XXX" class="w-full" />
                </div>

                <div class="form-field">
                    <label for="specialization">
                        <i class="pi pi-bookmark"></i> Spécialisation
                    </label>
                    <p-select id="specialization"
                              formControlName="specialization_fk"
                              [options]="specializations"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="Sélectionner une spécialisation"
                              [showClear]="true"
                              [filter]="true"
                              filterPlaceholder="Rechercher..."
                              appendTo="body"
                              styleClass="w-full">
                    </p-select>
                </div>

                <div class="form-field">
                    <label for="status">
                        <i class="pi pi-info-circle"></i> Statut
                    </label>
                    <p-select id="status"
                              formControlName="is_active"
                              [options]="activeOptions"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Sélectionner le statut"
                              appendTo="body"
                              styleClass="w-full">
                    </p-select>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple
                            label="Annuler"
                            icon="pi pi-times"
                            class="p-button-text"
                            (click)="showDialog = false">
                    </button>
                    <button pButton pRipple
                            [label]="editingFormateur ? 'Mettre à jour' : 'Créer'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveFormateur()"
                            [disabled]="formateurForm.invalid"
                            [loading]="saving">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <!-- Specialization Dialog -->
        <p-dialog [(visible)]="showSpecDialog"
                  [header]="editingSpec ? 'Modifier Spécialisation' : 'Nouvelle Spécialisation'"
                  [modal]="true"
                  [style]="{width: '500px'}"
                  [draggable]="false"
                  [resizable]="false"
                  styleClass="hr-dialog">
            <form [formGroup]="specForm" class="formateur-form">
                <div class="form-field">
                    <label for="specName">
                        <i class="pi pi-bookmark"></i> Nom <span class="required">*</span>
                    </label>
                    <input pInputText id="specName" formControlName="name"
                           placeholder="Nom de la spécialisation" class="w-full" />
                    <small class="p-error" *ngIf="specForm.get('name')?.invalid && specForm.get('name')?.touched">
                        Le nom est requis
                    </small>
                </div>

                <div class="form-field">
                    <label for="specDesc">
                        <i class="pi pi-align-left"></i> Description
                    </label>
                    <input pInputText id="specDesc" formControlName="description"
                           placeholder="Description de la spécialisation" class="w-full" />
                </div>

                <div class="form-field">
                    <label for="specStatus">
                        <i class="pi pi-info-circle"></i> Statut
                    </label>
                    <p-select id="specStatus"
                              formControlName="is_active"
                              [options]="activeOptions"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="Sélectionner le statut"
                              appendTo="body"
                              styleClass="w-full">
                    </p-select>
                </div>
            </form>

            <ng-template pTemplate="footer">
                <div class="dialog-footer">
                    <button pButton pRipple
                            label="Annuler"
                            icon="pi pi-times"
                            class="p-button-text"
                            (click)="showSpecDialog = false">
                    </button>
                    <button pButton pRipple
                            [label]="editingSpec ? 'Mettre à jour' : 'Créer'"
                            icon="pi pi-check"
                            class="p-button-primary"
                            (click)="saveSpecialization()"
                            [disabled]="specForm.invalid"
                            [loading]="savingSpec">
                    </button>
                </div>
            </ng-template>
        </p-dialog>

        <p-toast position="top-right"></p-toast>
        <p-confirmDialog></p-confirmDialog>
    `,
    styles: [`
        .formateurs-container {
            padding: 1.5rem;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        .section-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .search-input {
                min-width: 250px;
            }

            .filter-select {
                min-width: 150px;
            }
        }

        .loading-skeleton {
            .skeleton-row {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid var(--surface-border);
            }
        }

        /* Formateur Info */
        .formateur-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .formateur-details {
                .formateur-name {
                    font-weight: 600;
                    color: var(--text-color);
                    display: block;
                }
            }
        }

        /* Email & Phone */
        .email-link,
        .phone-link {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color);

            i {
                color: var(--hr-primary);
                font-size: 0.875rem;
            }
        }

        .text-muted {
            color: var(--text-color-secondary);
        }

        /* Form Styles */
        .formateur-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;

            .form-field {
                label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    color: var(--text-color);

                    i {
                        color: var(--hr-primary);
                    }

                    .required {
                        color: var(--red-500);
                    }
                }
            }
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
        }

        /* Empty State */
        .hr-empty-state {
            text-align: center;
            padding: 4rem 2rem;

            .empty-icon {
                font-size: 4rem;
                color: var(--surface-300);
                margin-bottom: 1.5rem;
            }

            h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-color);
                margin: 0 0 0.5rem 0;
            }

            p {
                color: var(--text-color-secondary);
                margin: 0 0 1.5rem 0;
            }
        }

        /* Text colors */
        .text-success { color: var(--green-500) !important; }
        .text-danger { color: var(--red-500) !important; }
        .text-info { color: var(--blue-500) !important; }

        /* Tabs Styles */
        .tab-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0;

            i {
                font-size: 1rem;
            }
        }

        .tab-content {
            padding: 1rem 0;
        }

        /* Specialization Info */
        .spec-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .spec-icon {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: rgba(59, 130, 246, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    color: var(--blue-500);
                    font-size: 1rem;
                }
            }

            .spec-name {
                font-weight: 600;
                color: var(--text-color);
            }
        }

        .spec-desc {
            color: var(--text-color-secondary);
            font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .section-actions {
                flex-wrap: wrap;

                .search-input,
                .filter-select {
                    min-width: 100%;
                }
            }
        }
    `]
})
export class FormateursListComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    // Tab
    activeTabIndex = 0;

    // Formateurs Data
    formateurs = signal<Formateur[]>([]);
    specializations: TrainerSpecialization[] = [];
    specializationsSignal = signal<TrainerSpecialization[]>([]);
    loading = false;
    saving = false;
    loadingSpec = false;
    savingSpec = false;

    // Filters
    searchTerm = '';
    selectedStatus: boolean | null = null;
    specSearchTerm = '';

    // Formateur Dialog
    showDialog = false;
    editingFormateur: Formateur | null = null;
    formateurForm!: FormGroup;

    // Specialization Dialog
    showSpecDialog = false;
    editingSpec: TrainerSpecialization | null = null;
    specForm!: FormGroup;

    // Options
    statusOptions = [
        { label: 'Actif', value: true },
        { label: 'Inactif', value: false }
    ];

    activeOptions = [
        { label: 'Actif', value: true },
        { label: 'Inactif', value: false }
    ];

    // Computed
    filteredFormateurs = computed(() => {
        let result = this.formateurs();

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(f =>
                f.name?.toLowerCase().includes(term) ||
                f.email?.toLowerCase().includes(term) ||
                f.phone?.includes(term) ||
                f.specialization?.toLowerCase().includes(term)
            );
        }

        if (this.selectedStatus !== null) {
            result = result.filter(f => f.is_active === this.selectedStatus);
        }

        return result;
    });

    activeCount = computed(() => this.formateurs().filter(f => f.is_active).length);
    inactiveCount = computed(() => this.formateurs().filter(f => !f.is_active).length);

    filteredSpecializations = computed(() => {
        let result = this.specializationsSignal();

        if (this.specSearchTerm) {
            const term = this.specSearchTerm.toLowerCase();
            result = result.filter(s =>
                s.name?.toLowerCase().includes(term) ||
                s.description?.toLowerCase().includes(term)
            );
        }

        return result;
    });

    constructor(
        private formationService: DmsFormationService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.loadFormateurs();
        this.loadSpecializations();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm(): void {
        this.formateurForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', Validators.email],
            phone: [''],
            specialization_fk: [null],
            is_active: [true]
        });

        this.specForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            is_active: [true]
        });
    }

    loadFormateurs(): void {
        this.loading = true;
        this.formationService.getFormateurs()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.loading = false)
            )
            .subscribe({
                next: (data) => {
                    this.formateurs.set(data);
                },
                error: (err: any) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Échec du chargement des formateurs'
                    });
                }
            });
    }

    loadSpecializations(): void {
        this.loadingSpec = true;
        this.formationService.getTrainerSpecializations()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.loadingSpec = false)
            )
            .subscribe({
                next: (data) => {
                    this.specializations = data;
                    this.specializationsSignal.set(data);
                },
                error: () => {
                    this.specializations = [];
                    this.specializationsSignal.set([]);
                }
            });
    }

    onSpecSearch(): void {
        // Trigger computed recalculation
        this.specializationsSignal.update(s => [...s]);
    }

    openSpecDialog(): void {
        this.editingSpec = null;
        this.specForm.reset({ is_active: true });
        this.showSpecDialog = true;
    }

    editSpecialization(spec: TrainerSpecialization): void {
        this.editingSpec = spec;
        this.specForm.patchValue({
            name: spec.name,
            description: spec.description || '',
            is_active: spec.is_active !== false
        });
        this.showSpecDialog = true;
    }

    saveSpecialization(): void {
        if (this.specForm.invalid) return;

        this.savingSpec = true;
        const formValue = this.specForm.value;

        const request$ = this.editingSpec
            ? this.formationService.updateTrainerSpecialization(this.editingSpec.id, formValue)
            : this.formationService.createTrainerSpecialization(formValue);

        request$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.savingSpec = false)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: this.editingSpec
                        ? 'Spécialisation mise à jour avec succès'
                        : 'Spécialisation créée avec succès'
                });
                this.showSpecDialog = false;
                this.loadSpecializations();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.detail || 'Échec de la sauvegarde'
                });
            }
        });
    }

    confirmDeleteSpec(spec: TrainerSpecialization): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer la spécialisation "${spec.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.formationService.deleteTrainerSpecialization(spec.id)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Spécialisation supprimée avec succès'
                            });
                            this.loadSpecializations();
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

    onSearch(): void {
        // Trigger computed recalculation
        this.formateurs.update(f => [...f]);
    }

    onFilterChange(): void {
        // Trigger computed recalculation
        this.formateurs.update(f => [...f]);
    }

    getInitials(name: string | undefined): string {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    openNewDialog(): void {
        this.editingFormateur = null;
        this.formateurForm.reset({ is_active: true });
        this.showDialog = true;
    }

    editFormateur(formateur: Formateur): void {
        this.editingFormateur = formateur;
        this.formateurForm.patchValue({
            name: formateur.name,
            email: formateur.email || '',
            phone: formateur.phone || '',
            specialization_fk: (formateur as any).specialization_fk || null,
            is_active: formateur.is_active !== false
        });
        this.showDialog = true;
    }

    saveFormateur(): void {
        if (this.formateurForm.invalid) return;

        this.saving = true;
        const formValue = this.formateurForm.value;

        const request$ = this.editingFormateur
            ? this.formationService.updateFormateur(this.editingFormateur.id!, formValue)
            : this.formationService.createFormateur(formValue);

        request$.pipe(
            takeUntil(this.destroy$),
            finalize(() => this.saving = false)
        ).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Succès',
                    detail: this.editingFormateur
                        ? 'Formateur mis à jour avec succès'
                        : 'Formateur créé avec succès'
                });
                this.showDialog = false;
                this.loadFormateurs();
            },
            error: (err: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: err.error?.detail || 'Échec de la sauvegarde'
                });
            }
        });
    }

    confirmDelete(formateur: Formateur): void {
        this.confirmationService.confirm({
            message: `Êtes-vous sûr de vouloir supprimer le formateur "${formateur.name}" ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.formationService.deleteFormateur(formateur.id!)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Formateur supprimé avec succès'
                            });
                            this.loadFormateurs();
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
}
