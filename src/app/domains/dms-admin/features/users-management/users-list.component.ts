/**
 * Users List Component
 * Domain: DMS-Admin
 *
 * Enhanced Django Admin-style user management with modern UI/UX
 * Uses PrimeNG components and PrimeFlex for professional interface
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Table, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { DMSUser, DMSUserCreate, DMS_MODULE_PERMISSIONS, DmsModulePermission } from '../../models';

interface StatusOption {
    label: string;
    value: string;
    severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary';
    icon: string;
}

interface PositionOption {
    label: string;
    value: string;
    icon: string;
}

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        TableModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        MultiSelectModule,
        TagModule,
        ToolbarModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        AvatarModule,
        CheckboxModule,
        PasswordModule,
        TooltipModule,
        SkeletonModule,
        RippleModule,
        DividerModule,
        BadgeModule,
        InputGroupModule,
        InputGroupAddonModule
    ],
    providers: [MessageService, ConfirmationService],
    template: `
        <p-toast position="top-right"></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="flex flex-column gap-4">
            <!-- Header Card -->
            <div class="surface-card shadow-2 border-round-xl p-4">
                <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-4">
                    <div class="flex align-items-center gap-4">
                        <div class="flex align-items-center justify-content-center border-round-xl"
                             style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);">
                            <i class="pi pi-users text-white text-3xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold m-0 text-900">Gestion des Utilisateurs</h1>
                            <p class="text-500 mt-1 mb-0">
                                <span class="font-semibold text-primary">{{ filteredUsers.length }}</span> utilisateur(s)
                                <span *ngIf="selectedUsers.length > 0" class="ml-2">
                                    • <span class="font-semibold text-orange-500">{{ selectedUsers.length }}</span> sélectionné(s)
                                </span>
                            </p>
                        </div>
                    </div>
                    <button pButton pRipple label="Nouvel Utilisateur" icon="pi pi-user-plus"
                            class="p-button-primary p-button-raised" (click)="openNewUserDialog()"></button>
                </div>
            </div>

            <!-- Main Content Card -->
            <div class="surface-card shadow-2 border-round-xl overflow-hidden">
                <!-- Filters Bar -->
                <div class="p-4 surface-ground border-bottom-1 surface-border">
                    <div class="flex flex-column lg:flex-row gap-3">
                        <!-- Search -->
                        <div class="flex-1">
                            <p-inputGroup>
                                <p-inputGroupAddon>
                                    <i class="pi pi-search"></i>
                                </p-inputGroupAddon>
                                <input pInputText type="text" [(ngModel)]="searchTerm"
                                       (ngModelChange)="onSearchChange($event)"
                                       placeholder="Rechercher par nom ou login..."
                                       class="w-full" />
                            </p-inputGroup>
                        </div>

                        <!-- Filters -->
                        <div class="flex flex-wrap gap-2">
                            <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
                                      (onChange)="filterUsers()" placeholder="Tous les statuts"
                                      [showClear]="true" styleClass="w-full md:w-auto" style="min-width: 160px;">
                                <ng-template let-status pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="status">
                                        <i [class]="status.icon" [class.text-green-500]="status.value === 'active'"
                                           [class.text-orange-500]="status.value === 'inactive'"
                                           [class.text-red-500]="status.value === 'suspended'"></i>
                                        <span>{{ status.label }}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-status pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="status.icon" [class.text-green-500]="status.value === 'active'"
                                           [class.text-orange-500]="status.value === 'inactive'"
                                           [class.text-red-500]="status.value === 'suspended'"></i>
                                        <span>{{ status.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>

                            <p-select [options]="positionOptions" [(ngModel)]="selectedPosition"
                                      (onChange)="filterUsers()" placeholder="Toutes les positions"
                                      [showClear]="true" styleClass="w-full md:w-auto" style="min-width: 180px;">
                                <ng-template let-pos pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="pos">
                                        <i [class]="pos.icon + ' text-primary'"></i>
                                        <span>{{ pos.label }}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-pos pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="pos.icon + ' text-500'"></i>
                                        <span>{{ pos.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>

                            <button pButton pRipple icon="pi pi-filter-slash" label="Réinitialiser"
                                    class="p-button-outlined p-button-secondary"
                                    (click)="resetFilters()" *ngIf="hasActiveFilters"></button>
                        </div>
                    </div>
                </div>

                <!-- Bulk Actions Bar -->
                <div class="p-3 bg-primary-50 border-bottom-1 surface-border flex align-items-center justify-content-between gap-3"
                     *ngIf="selectedUsers.length > 0">
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-info-circle text-primary"></i>
                        <span class="font-medium text-primary">{{ selectedUsers.length }} utilisateur(s) sélectionné(s)</span>
                    </div>
                    <div class="flex gap-2">
                        <button pButton pRipple icon="pi pi-check-circle" label="Activer"
                                class="p-button-success p-button-sm" (click)="bulkActivate()"></button>
                        <button pButton pRipple icon="pi pi-ban" label="Désactiver"
                                class="p-button-warning p-button-sm" (click)="bulkDeactivate()"></button>
                        <button pButton pRipple icon="pi pi-trash" label="Supprimer"
                                class="p-button-danger p-button-sm" (click)="bulkDelete()"></button>
                        <button pButton pRipple icon="pi pi-times"
                                class="p-button-text p-button-secondary p-button-sm"
                                (click)="selectedUsers = []" pTooltip="Désélectionner tout"></button>
                    </div>
                </div>

                <!-- Table -->
                <p-table #dt [value]="filteredUsers" [rows]="10" [paginator]="true"
                         [rowsPerPageOptions]="[10, 25, 50, 100]" [loading]="loading"
                         [(selection)]="selectedUsers" dataKey="id"
                         [globalFilterFields]="['login', 'employee_name', 'position_display']"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Affichage {first} à {last} sur {totalRecords}"
                         styleClass="p-datatable-sm p-datatable-striped"
                         [rowHover]="true">

                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 3rem">
                                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
                            </th>
                            <th style="width: 280px" pSortableColumn="employee_name">
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-user text-500"></i>
                                    Utilisateur
                                    <p-sortIcon field="employee_name"></p-sortIcon>
                                </div>
                            </th>
                            <th style="width: 150px" pSortableColumn="login">
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-at text-500"></i>
                                    Login
                                    <p-sortIcon field="login"></p-sortIcon>
                                </div>
                            </th>
                            <th style="width: 140px" pSortableColumn="position_display">
                                Position
                                <p-sortIcon field="position_display"></p-sortIcon>
                            </th>
                            <th style="width: 100px">Status</th>
                            <th style="width: 200px">
                                <div class="flex align-items-center gap-2">
                                    <i class="pi pi-th-large text-500"></i>
                                    Modules
                                </div>
                            </th>
                            <th style="width: 130px" class="text-center">Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-user>
                        <tr class="cursor-pointer" (dblclick)="editUser(user)">
                            <td>
                                <p-tableCheckbox [value]="user"></p-tableCheckbox>
                            </td>
                            <td>
                                <div class="flex align-items-center gap-3">
                                    <p-avatar [image]="user.employee_photo || ''"
                                              [label]="!user.employee_photo ? getUserInitials(user) : ''"
                                              shape="circle" size="large"
                                              [style]="{'background': getAvatarGradient(user), 'color': '#fff', 'font-weight': '600'}">
                                    </p-avatar>
                                    <div>
                                        <div class="font-semibold text-900">{{ user.employee_name || 'Non lié' }}</div>
                                        <div class="text-500 text-sm" *ngIf="user.department_name">
                                            <i class="pi pi-building text-xs mr-1"></i>{{ user.department_name }}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <code class="px-2 py-1 border-round surface-ground text-primary font-semibold text-sm">
                                    {{ user.login }}
                                </code>
                            </td>
                            <td>
                                <p-tag [value]="user.position_display || user.position"
                                       [severity]="getPositionSeverity(user.position)"
                                       [rounded]="true"></p-tag>
                            </td>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <span class="flex align-items-center justify-content-center border-round-lg"
                                          [class.bg-green-100]="user.status === 'active'"
                                          [class.bg-orange-100]="user.status === 'inactive'"
                                          [class.bg-red-100]="user.status === 'suspended'"
                                          style="width: 2rem; height: 2rem;">
                                        <i [class]="getStatusIcon(user.status)"
                                           [class.text-green-600]="user.status === 'active'"
                                           [class.text-orange-600]="user.status === 'inactive'"
                                           [class.text-red-600]="user.status === 'suspended'"></i>
                                    </span>
                                    <span class="font-medium text-sm"
                                          [class.text-green-600]="user.status === 'active'"
                                          [class.text-orange-600]="user.status === 'inactive'"
                                          [class.text-red-600]="user.status === 'suspended'">
                                        {{ getStatusLabel(user.status) }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="flex flex-wrap gap-1">
                                    <span *ngFor="let perm of getActivePermissions(user)"
                                          class="inline-flex align-items-center justify-content-center border-round-lg shadow-1 transition-all transition-duration-200 hover:shadow-3"
                                          [style.background]="perm.color"
                                          style="width: 1.75rem; height: 1.75rem; cursor: help;"
                                          [pTooltip]="perm.label" tooltipPosition="top">
                                        <i [class]="perm.icon + ' text-white'" style="font-size: 0.7rem;"></i>
                                    </span>
                                    <span *ngIf="getActivePermissions(user).length === 0"
                                          class="text-500 text-sm font-italic">Aucun accès</span>
                                </div>
                            </td>
                            <td>
                                <div class="flex justify-content-center gap-1">
                                    <button pButton pRipple icon="pi pi-pencil"
                                            class="p-button-rounded p-button-text p-button-primary p-button-sm"
                                            pTooltip="Modifier" tooltipPosition="top"
                                            (click)="editUser(user)"></button>
                                    <button pButton pRipple icon="pi pi-key"
                                            class="p-button-rounded p-button-text p-button-warning p-button-sm"
                                            pTooltip="Réinitialiser mot de passe" tooltipPosition="top"
                                            (click)="resetPassword(user)"></button>
                                    <button pButton pRipple icon="pi pi-trash"
                                            class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                            pTooltip="Supprimer" tooltipPosition="top"
                                            (click)="confirmDelete(user)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7">
                                <div class="flex flex-column align-items-center justify-content-center py-6">
                                    <div class="flex align-items-center justify-content-center border-round-xl surface-ground mb-4"
                                         style="width: 5rem; height: 5rem;">
                                        <i class="pi pi-users text-4xl text-500"></i>
                                    </div>
                                    <span class="font-semibold text-900 mb-1">Aucun utilisateur trouvé</span>
                                    <span class="text-500 text-sm mb-3">Essayez de modifier vos critères de recherche</span>
                                    <button pButton pRipple label="Créer un utilisateur" icon="pi pi-plus"
                                            class="p-button-outlined" (click)="openNewUserDialog()"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="loadingbody">
                        <tr *ngFor="let i of [1,2,3,4,5]">
                            <td><p-skeleton width="1.5rem" height="1.5rem"></p-skeleton></td>
                            <td>
                                <div class="flex align-items-center gap-3">
                                    <p-skeleton shape="circle" size="2.5rem"></p-skeleton>
                                    <div class="flex flex-column gap-2">
                                        <p-skeleton width="120px" height="1rem"></p-skeleton>
                                        <p-skeleton width="80px" height="0.75rem"></p-skeleton>
                                    </div>
                                </div>
                            </td>
                            <td><p-skeleton width="100px" height="1.5rem"></p-skeleton></td>
                            <td><p-skeleton width="80px" height="1.5rem" borderRadius="16px"></p-skeleton></td>
                            <td><p-skeleton width="70px" height="1.5rem"></p-skeleton></td>
                            <td>
                                <div class="flex gap-1">
                                    <p-skeleton *ngFor="let j of [1,2,3]" width="1.75rem" height="1.75rem" borderRadius="8px"></p-skeleton>
                                </div>
                            </td>
                            <td>
                                <div class="flex justify-content-center gap-1">
                                    <p-skeleton *ngFor="let j of [1,2,3]" shape="circle" size="2rem"></p-skeleton>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- User Form Dialog -->
        <p-dialog [(visible)]="userDialogVisible" [modal]="true" [style]="{width: '750px', maxWidth: '95vw'}"
                  [header]="isEditMode ? 'Modifier l\\'utilisateur' : 'Nouvel utilisateur'"
                  [closable]="true" [draggable]="false" [resizable]="false"
                  styleClass="user-form-dialog">

            <div class="flex flex-column gap-4" *ngIf="editingUser">
                <!-- Basic Info Section -->
                <div class="surface-ground border-round-xl p-4">
                    <div class="flex align-items-center gap-2 mb-4">
                        <div class="flex align-items-center justify-content-center border-round-lg bg-blue-100"
                             style="width: 2rem; height: 2rem;">
                            <i class="pi pi-user text-blue-600 text-sm"></i>
                        </div>
                        <span class="font-semibold text-900">Informations de connexion</span>
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="login" class="block font-medium text-900 mb-2">Login <span class="text-red-500">*</span></label>
                            <p-inputGroup>
                                <p-inputGroupAddon><i class="pi pi-at"></i></p-inputGroupAddon>
                                <input pInputText id="login" [(ngModel)]="editingUser.login"
                                       [ngClass]="{'ng-invalid ng-dirty': submitted && !editingUser.login}"
                                       placeholder="Identifiant de connexion" />
                            </p-inputGroup>
                            <small class="p-error block mt-1" *ngIf="submitted && !editingUser.login">
                                Le login est requis
                            </small>
                        </div>

                        <div class="col-12 md:col-6" *ngIf="!isEditMode">
                            <label for="password" class="block font-medium text-900 mb-2">Mot de passe <span class="text-red-500">*</span></label>
                            <p-password id="password" [(ngModel)]="editingUser.password"
                                        [toggleMask]="true" [feedback]="true"
                                        [ngClass]="{'ng-invalid ng-dirty': submitted && !isEditMode && !editingUser.password}"
                                        placeholder="Mot de passe sécurisé"
                                        styleClass="w-full"
                                        [inputStyleClass]="'w-full'">
                            </p-password>
                            <small class="p-error block mt-1" *ngIf="submitted && !isEditMode && !editingUser.password">
                                Le mot de passe est requis
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Employee Link Section -->
                <div class="surface-ground border-round-xl p-4">
                    <div class="flex align-items-center gap-2 mb-4">
                        <div class="flex align-items-center justify-content-center border-round-lg bg-purple-100"
                             style="width: 2rem; height: 2rem;">
                            <i class="pi pi-link text-purple-600 text-sm"></i>
                        </div>
                        <span class="font-semibold text-900">Liaison employé</span>
                    </div>

                    <div class="grid">
                        <div class="col-12">
                            <label for="employee" class="block font-medium text-900 mb-2">Employé associé</label>
                            <p-select id="employee" [options]="employees" [(ngModel)]="editingUser.employee"
                                      optionLabel="name" optionValue="id" [filter]="true"
                                      filterBy="name" [showClear]="true"
                                      placeholder="Rechercher et sélectionner un employé..."
                                      styleClass="w-full">
                                <ng-template let-emp pTemplate="item">
                                    <div class="flex align-items-center gap-3">
                                        <p-avatar [label]="emp.name?.charAt(0)" shape="circle" size="normal"
                                                  [style]="{'background': '#667eea', 'color': '#fff'}"></p-avatar>
                                        <div>
                                            <span class="font-medium">{{ emp.name }}</span>
                                            <span class="text-500 text-sm ml-2" *ngIf="emp.badge">({{ emp.badge }})</span>
                                        </div>
                                    </div>
                                </ng-template>
                            </p-select>
                            <small class="text-500 block mt-1">
                                <i class="pi pi-info-circle mr-1"></i>
                                Lier cet utilisateur à un employé existant pour synchroniser les données
                            </small>
                        </div>
                    </div>
                </div>

                <!-- Position & Status Section -->
                <div class="surface-ground border-round-xl p-4">
                    <div class="flex align-items-center gap-2 mb-4">
                        <div class="flex align-items-center justify-content-center border-round-lg bg-orange-100"
                             style="width: 2rem; height: 2rem;">
                            <i class="pi pi-id-card text-orange-600 text-sm"></i>
                        </div>
                        <span class="font-semibold text-900">Rôle et statut</span>
                    </div>

                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="position" class="block font-medium text-900 mb-2">Position <span class="text-red-500">*</span></label>
                            <p-select id="position" [options]="positionOptions" [(ngModel)]="editingUser.position"
                                      optionValue="value" placeholder="Sélectionner une position"
                                      styleClass="w-full">
                                <ng-template let-pos pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="pos">
                                        <i [class]="pos.icon + ' text-primary'"></i>
                                        <span>{{ pos.label }}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-pos pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="pos.icon + ' text-500'"></i>
                                        <span>{{ pos.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="status" class="block font-medium text-900 mb-2">Statut</label>
                            <p-select id="status" [options]="statusOptions" [(ngModel)]="editingUser.status"
                                      optionValue="value" placeholder="Sélectionner un statut"
                                      styleClass="w-full">
                                <ng-template let-status pTemplate="selectedItem">
                                    <div class="flex align-items-center gap-2" *ngIf="status">
                                        <i [class]="status.icon"
                                           [class.text-green-500]="status.value === 'active'"
                                           [class.text-orange-500]="status.value === 'inactive'"
                                           [class.text-red-500]="status.value === 'suspended'"></i>
                                        <span>{{ status.label }}</span>
                                    </div>
                                </ng-template>
                                <ng-template let-status pTemplate="item">
                                    <div class="flex align-items-center gap-2">
                                        <i [class]="status.icon"
                                           [class.text-green-500]="status.value === 'active'"
                                           [class.text-orange-500]="status.value === 'inactive'"
                                           [class.text-red-500]="status.value === 'suspended'"></i>
                                        <span>{{ status.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>
                    </div>
                </div>

                <!-- Permissions Section -->
                <div class="surface-ground border-round-xl p-4">
                    <div class="flex align-items-center justify-content-between mb-4">
                        <div class="flex align-items-center gap-2">
                            <div class="flex align-items-center justify-content-center border-round-lg bg-green-100"
                                 style="width: 2rem; height: 2rem;">
                                <i class="pi pi-lock text-green-600 text-sm"></i>
                            </div>
                            <span class="font-semibold text-900">Permissions des modules</span>
                        </div>
                        <div class="flex gap-2">
                            <button pButton pRipple label="Tout sélectionner" icon="pi pi-check-square"
                                    class="p-button-text p-button-sm" (click)="selectAllPermissions()"></button>
                            <button pButton pRipple label="Tout désélectionner" icon="pi pi-stop"
                                    class="p-button-text p-button-sm" (click)="deselectAllPermissions()"></button>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="col-6 md:col-4 lg:col-3" *ngFor="let perm of modulePermissions">
                            <div class="flex align-items-center gap-3 p-3 border-round-lg surface-card border-1 surface-border cursor-pointer transition-all transition-duration-200"
                                 [class.border-primary]="editingUser[perm.key]"
                                 [class.bg-primary-50]="editingUser[perm.key]"
                                 (click)="togglePermission(perm.key)">
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     [style.background]="editingUser[perm.key] ? perm.color : 'var(--surface-200)'"
                                     style="width: 2.5rem; height: 2.5rem; transition: all 0.2s;">
                                    <i [class]="perm.icon"
                                       [class.text-white]="editingUser[perm.key]"
                                       [class.text-500]="!editingUser[perm.key]"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-900 text-sm">{{ perm.label }}</div>
                                </div>
                                <p-checkbox [(ngModel)]="editingUser[perm.key]" [binary]="true"
                                            (click)="$event.stopPropagation()"></p-checkbox>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-between align-items-center">
                    <span class="text-500 text-sm" *ngIf="isEditMode">
                        <i class="pi pi-info-circle mr-1"></i>
                        ID: {{ editingUser?.id }}
                    </span>
                    <div class="flex gap-2">
                        <button pButton pRipple label="Annuler" icon="pi pi-times"
                                class="p-button-text p-button-secondary" (click)="closeUserDialog()"></button>
                        <button pButton pRipple [label]="isEditMode ? 'Mettre à jour' : 'Créer'"
                                [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus'"
                                class="p-button-primary"
                                (click)="saveUser()" [loading]="saving"></button>
                    </div>
                </div>
            </ng-template>
        </p-dialog>

        <!-- Reset Password Dialog -->
        <p-dialog [(visible)]="passwordDialogVisible" [modal]="true" [style]="{width: '450px', maxWidth: '95vw'}"
                  header="Réinitialiser le mot de passe" [closable]="true" [draggable]="false">
            <div class="flex flex-column gap-4" *ngIf="selectedUserForPassword">
                <div class="flex align-items-center gap-3 p-3 surface-ground border-round-lg">
                    <p-avatar [label]="getUserInitials(selectedUserForPassword)" shape="circle" size="large"
                              [style]="{'background': getAvatarGradient(selectedUserForPassword), 'color': '#fff'}"></p-avatar>
                    <div>
                        <div class="font-semibold text-900">{{ selectedUserForPassword.employee_name || selectedUserForPassword.login }}</div>
                        <div class="text-500 text-sm">{{ selectedUserForPassword.login }}</div>
                    </div>
                </div>

                <div>
                    <label for="newPassword" class="block font-medium text-900 mb-2">Nouveau mot de passe</label>
                    <p-password id="newPassword" [(ngModel)]="newPassword"
                                [toggleMask]="true" [feedback]="true"
                                placeholder="Entrez le nouveau mot de passe"
                                styleClass="w-full"
                                [inputStyleClass]="'w-full'">
                    </p-password>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <button pButton pRipple label="Annuler" icon="pi pi-times"
                        class="p-button-text p-button-secondary" (click)="closePasswordDialog()"></button>
                <button pButton pRipple label="Réinitialiser" icon="pi pi-key"
                        class="p-button-warning" (click)="confirmResetPassword()"
                        [loading]="saving" [disabled]="!newPassword"></button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep {
            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
                vertical-align: middle;
            }

            .p-datatable .p-datatable-thead > tr > th {
                padding: 1rem;
                background: var(--surface-50);
            }

            .p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {
                background: var(--surface-50);
            }

            .p-datatable .p-datatable-tbody > tr:hover {
                background: var(--primary-50) !important;
            }

            .p-paginator {
                padding: 1rem;
                border-top: 1px solid var(--surface-border);
            }

            .user-form-dialog .p-dialog-content {
                padding: 1.5rem;
            }
        }

        code {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }
    `]
})
export class UsersListComponent implements OnInit, OnDestroy {
    @ViewChild('dt') table!: Table;

    private destroy$ = new Subject<void>();
    private searchSubject$ = new Subject<string>();

    users: DMSUser[] = [];
    filteredUsers: DMSUser[] = [];
    selectedUsers: DMSUser[] = [];
    employees: { id: number; name: string; badge?: string }[] = [];

    loading = true;
    saving = false;
    submitted = false;

    searchTerm = '';
    selectedStatus: string | null = null;
    selectedPosition: string | null = null;

    userDialogVisible = false;
    passwordDialogVisible = false;
    isEditMode = false;
    editingUser: any = {};
    selectedUserForPassword: DMSUser | null = null;
    newPassword = '';

    modulePermissions = DMS_MODULE_PERMISSIONS;

    statusOptions: StatusOption[] = [
        { label: 'Actif', value: 'active', severity: 'success', icon: 'pi pi-check-circle' },
        { label: 'Inactif', value: 'inactive', severity: 'warn', icon: 'pi pi-minus-circle' },
        { label: 'Suspendu', value: 'suspended', severity: 'danger', icon: 'pi pi-ban' }
    ];

    positionOptions: PositionOption[] = [
        { label: 'Administrateur', value: 'admin', icon: 'pi pi-shield' },
        { label: 'Manager RH', value: 'rh_manager', icon: 'pi pi-users' },
        { label: 'Team Leader', value: 'team_leader', icon: 'pi pi-star' },
        { label: 'Superviseur', value: 'supervisor', icon: 'pi pi-eye' },
        { label: 'Opérateur', value: 'operator', icon: 'pi pi-user' },
        { label: 'Formateur', value: 'formateur', icon: 'pi pi-book' }
    ];

    get hasActiveFilters(): boolean {
        return !!(this.searchTerm || this.selectedStatus || this.selectedPosition);
    }

    constructor(
        private adminService: AdminService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadEmployees();
        this.setupSearch();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearch(): void {
        this.searchSubject$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.filterUsers();
        });
    }

    private loadUsers(): void {
        this.loading = true;
        this.adminService.getUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    this.filterUsers();
                    this.loading = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les utilisateurs'
                    });
                    this.loading = false;
                }
            });
    }

    private loadEmployees(): void {
        this.adminService.getAvailableEmployees()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (employees) => {
                    this.employees = employees;
                }
            });
    }

    onSearchChange(term: string): void {
        this.searchSubject$.next(term);
    }

    filterUsers(): void {
        let result = [...this.users];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(u =>
                u.login?.toLowerCase().includes(search) ||
                u.employee_name?.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatus) {
            result = result.filter(u => u.status === this.selectedStatus);
        }

        if (this.selectedPosition) {
            result = result.filter(u => u.position === this.selectedPosition);
        }

        this.filteredUsers = result;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = null;
        this.selectedPosition = null;
        this.filterUsers();
    }

    openNewUserDialog(): void {
        this.isEditMode = false;
        this.submitted = false;
        this.editingUser = {
            login: '',
            password: '',
            employee: null,
            position: 'operator',
            status: 'active',
            dms_production: false,
            dms_hr: false,
            dms_maintenance: false,
            dms_inventory: false,
            dms_quality: false,
            dms_analytics: false,
            dms_tech: false,
            dms_kpi: false,
            dms_ll: false,
            dms_admin: false
        };
        this.userDialogVisible = true;
    }

    editUser(user: DMSUser): void {
        this.isEditMode = true;
        this.submitted = false;
        this.editingUser = { ...user };
        this.userDialogVisible = true;
    }

    closeUserDialog(): void {
        this.userDialogVisible = false;
        this.editingUser = {};
    }

    togglePermission(key: string): void {
        this.editingUser[key] = !this.editingUser[key];
    }

    selectAllPermissions(): void {
        this.modulePermissions.forEach(perm => {
            this.editingUser[perm.key] = true;
        });
    }

    deselectAllPermissions(): void {
        this.modulePermissions.forEach(perm => {
            this.editingUser[perm.key] = false;
        });
    }

    saveUser(): void {
        this.submitted = true;

        if (!this.editingUser.login) {
            return;
        }

        if (!this.isEditMode && !this.editingUser.password) {
            return;
        }

        this.saving = true;

        const userData: DMSUserCreate = {
            login: this.editingUser.login,
            password: this.editingUser.password,
            employee: this.editingUser.employee,
            position: this.editingUser.position,
            status: this.editingUser.status,
            dms_production: this.editingUser.dms_production,
            dms_hr: this.editingUser.dms_hr,
            dms_maintenance: this.editingUser.dms_maintenance,
            dms_inventory: this.editingUser.dms_inventory,
            dms_quality: this.editingUser.dms_quality,
            dms_analytics: this.editingUser.dms_analytics,
            dms_tech: this.editingUser.dms_tech,
            dms_kpi: this.editingUser.dms_kpi,
            dms_ll: this.editingUser.dms_ll,
            dms_admin: this.editingUser.dms_admin
        };

        const operation = this.isEditMode
            ? this.adminService.updateUser(this.editingUser.id, userData)
            : this.adminService.createUser(userData);

        operation.pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: this.isEditMode ? 'Utilisateur mis à jour' : 'Utilisateur créé',
                        life: 3000
                    });
                    this.loadUsers();
                    this.closeUserDialog();
                    this.saving = false;
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.detail || 'Erreur lors de la sauvegarde',
                        life: 5000
                    });
                    this.saving = false;
                }
            });
    }

    confirmDelete(user: DMSUser): void {
        this.confirmationService.confirm({
            message: `Voulez-vous vraiment supprimer l'utilisateur <strong>${user.employee_name || user.login}</strong> ?<br><br>Cette action est irréversible.`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deleteUser(user);
            }
        });
    }

    private deleteUser(user: DMSUser): void {
        this.adminService.deleteUser(user.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Utilisateur supprimé',
                        life: 3000
                    });
                    this.loadUsers();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Erreur lors de la suppression',
                        life: 5000
                    });
                }
            });
    }

    resetPassword(user: DMSUser): void {
        this.selectedUserForPassword = user;
        this.newPassword = '';
        this.passwordDialogVisible = true;
    }

    closePasswordDialog(): void {
        this.passwordDialogVisible = false;
        this.selectedUserForPassword = null;
        this.newPassword = '';
    }

    confirmResetPassword(): void {
        if (!this.selectedUserForPassword || !this.newPassword) return;

        this.saving = true;
        this.adminService.resetPassword(this.selectedUserForPassword.id, this.newPassword)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succès',
                        detail: 'Mot de passe réinitialisé',
                        life: 3000
                    });
                    this.closePasswordDialog();
                    this.saving = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Erreur lors de la réinitialisation',
                        life: 5000
                    });
                    this.saving = false;
                }
            });
    }

    bulkActivate(): void {
        this.confirmationService.confirm({
            message: `Activer <strong>${this.selectedUsers.length}</strong> utilisateur(s) ?`,
            header: 'Confirmation',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Activer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-success',
            accept: () => {
                this.adminService.bulkUpdateStatus({
                    user_ids: this.selectedUsers.map(u => u.id),
                    status: 'active'
                }).pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Utilisateurs activés',
                            life: 3000
                        });
                        this.selectedUsers = [];
                        this.loadUsers();
                    }
                });
            }
        });
    }

    bulkDeactivate(): void {
        this.confirmationService.confirm({
            message: `Désactiver <strong>${this.selectedUsers.length}</strong> utilisateur(s) ?`,
            header: 'Confirmation',
            icon: 'pi pi-ban',
            acceptLabel: 'Désactiver',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-warning',
            accept: () => {
                this.adminService.bulkUpdateStatus({
                    user_ids: this.selectedUsers.map(u => u.id),
                    status: 'inactive'
                }).pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Succès',
                            detail: 'Utilisateurs désactivés',
                            life: 3000
                        });
                        this.selectedUsers = [];
                        this.loadUsers();
                    }
                });
            }
        });
    }

    bulkDelete(): void {
        this.confirmationService.confirm({
            message: `Supprimer définitivement <strong>${this.selectedUsers.length}</strong> utilisateur(s) ?<br><br>Cette action est irréversible.`,
            header: 'Attention',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.adminService.bulkDelete(this.selectedUsers.map(u => u.id))
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                        next: () => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Succès',
                                detail: 'Utilisateurs supprimés',
                                life: 3000
                            });
                            this.selectedUsers = [];
                            this.loadUsers();
                        }
                    });
            }
        });
    }

    getUserInitials(user: DMSUser): string {
        if (user.employee_name) {
            const parts = user.employee_name.split(' ');
            return parts.map(p => p[0]).join('').toUpperCase().substring(0, 2);
        }
        return user.login.substring(0, 2).toUpperCase();
    }

    getAvatarGradient(user: DMSUser): string {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
        const hash = (user.login || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return gradients[hash % gradients.length];
    }

    getActivePermissions(user: DMSUser): DmsModulePermission[] {
        return this.modulePermissions.filter(perm => (user as any)[perm.key]);
    }

    getStatusLabel(status: string): string {
        const found = this.statusOptions.find(s => s.value === status);
        return found?.label || status;
    }

    getStatusIcon(status: string): string {
        const found = this.statusOptions.find(s => s.value === status);
        return found?.icon || 'pi pi-circle';
    }

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const found = this.statusOptions.find(s => s.value === status);
        return found?.severity || 'info';
    }

    getPositionSeverity(position: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
        const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
            'admin': 'danger',
            'rh_manager': 'warn',
            'team_leader': 'info',
            'supervisor': 'info',
            'operator': 'success',
            'formateur': 'secondary'
        };
        return severities[position] || 'secondary';
    }
}
