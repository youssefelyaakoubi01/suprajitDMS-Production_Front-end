/**
 * Positions List Component
 * Domain: DMS-Admin
 *
 * CRUD management for user positions/roles
 */
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { RippleModule } from 'primeng/ripple';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { Position, PositionCreate, POSITION_COLORS, POSITION_ICONS } from '../../models';

@Component({
    selector: 'app-positions-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        CheckboxModule,
        TooltipModule,
        SkeletonModule,
        RippleModule,
        InputGroupModule,
        InputGroupAddonModule,
        InputNumberModule,
        TextareaModule
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
                             style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);">
                            <i class="pi pi-id-card text-white text-3xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl md:text-3xl font-bold m-0 text-900">Gestion des Positions</h1>
                            <p class="text-500 mt-1 mb-0">
                                <span class="font-semibold text-primary">{{ positions.length }}</span> position(s)
                                <span class="mx-2">|</span>
                                <span class="text-green-600 font-medium">{{ activeCount }}</span> active(s)
                                <span class="mx-2">|</span>
                                <span class="text-orange-600 font-medium">{{ inactiveCount }}</span> inactive(s)
                            </p>
                        </div>
                    </div>
                    <button pButton pRipple label="Nouvelle Position" icon="pi pi-plus"
                            class="p-button-primary p-button-raised" (click)="openNewDialog()"></button>
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
                                       placeholder="Rechercher par nom ou code..."
                                       class="w-full" />
                            </p-inputGroup>
                        </div>

                        <!-- Status Filter -->
                        <div class="flex gap-2">
                            <p-select [options]="statusOptions" [(ngModel)]="selectedStatus"
                                      (onChange)="filterPositions()" placeholder="Tous les statuts"
                                      [showClear]="true" styleClass="w-full md:w-auto" style="min-width: 160px;">
                            </p-select>

                            <button pButton pRipple icon="pi pi-filter-slash" label="Reinitialiser"
                                    class="p-button-outlined p-button-secondary"
                                    (click)="resetFilters()" *ngIf="hasActiveFilters"></button>
                        </div>
                    </div>
                </div>

                <!-- Table -->
                <p-table #dt [value]="filteredPositions" [rows]="10" [paginator]="true"
                         [rowsPerPageOptions]="[10, 25, 50]" [loading]="loading"
                         dataKey="id"
                         [showCurrentPageReport]="true"
                         currentPageReportTemplate="Affichage {first} a {last} sur {totalRecords}"
                         styleClass="p-datatable-sm p-datatable-striped"
                         [rowHover]="true">

                    <ng-template pTemplate="header">
                        <tr>
                            <th style="width: 60px" pSortableColumn="order">
                                #
                                <p-sortIcon field="order"></p-sortIcon>
                            </th>
                            <th style="width: 50px">Icon</th>
                            <th pSortableColumn="name">
                                Nom
                                <p-sortIcon field="name"></p-sortIcon>
                            </th>
                            <th style="width: 120px" pSortableColumn="code">
                                Code
                                <p-sortIcon field="code"></p-sortIcon>
                            </th>
                            <th>Description</th>
                            <th style="width: 100px">Couleur</th>
                            <th style="width: 100px">Statut</th>
                            <th style="width: 130px" class="text-center">Actions</th>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-position>
                        <tr class="cursor-pointer" (dblclick)="editPosition(position)">
                            <td>
                                <span class="text-500 font-medium">{{ position.order }}</span>
                            </td>
                            <td>
                                <div class="flex align-items-center justify-content-center border-round-lg"
                                     [style.background]="getColorBackground(position.color)"
                                     style="width: 2.5rem; height: 2.5rem;">
                                    <i [class]="position.icon" class="text-white"></i>
                                </div>
                            </td>
                            <td>
                                <span class="font-semibold text-900">{{ position.name }}</span>
                            </td>
                            <td>
                                <code class="px-2 py-1 border-round surface-ground text-primary font-semibold text-sm">
                                    {{ position.code }}
                                </code>
                            </td>
                            <td>
                                <span class="text-600 text-sm" *ngIf="position.description">{{ position.description }}</span>
                                <span class="text-400 font-italic text-sm" *ngIf="!position.description">Aucune description</span>
                            </td>
                            <td>
                                <p-tag [value]="getColorLabel(position.color)"
                                       [severity]="position.color"
                                       [rounded]="true"></p-tag>
                            </td>
                            <td>
                                <div class="flex align-items-center gap-2">
                                    <span class="flex align-items-center justify-content-center border-round-lg"
                                          [class.bg-green-100]="position.is_active"
                                          [class.bg-orange-100]="!position.is_active"
                                          style="width: 2rem; height: 2rem;">
                                        <i [class]="position.is_active ? 'pi pi-check' : 'pi pi-times'"
                                           [class.text-green-600]="position.is_active"
                                           [class.text-orange-600]="!position.is_active"></i>
                                    </span>
                                    <span class="font-medium text-sm"
                                          [class.text-green-600]="position.is_active"
                                          [class.text-orange-600]="!position.is_active">
                                        {{ position.is_active ? 'Active' : 'Inactive' }}
                                    </span>
                                </div>
                            </td>
                            <td>
                                <div class="flex justify-content-center gap-1">
                                    <button pButton pRipple icon="pi pi-pencil"
                                            class="p-button-rounded p-button-text p-button-primary p-button-sm"
                                            pTooltip="Modifier" tooltipPosition="top"
                                            (click)="editPosition(position)"></button>
                                    <button pButton pRipple icon="pi pi-trash"
                                            class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                            pTooltip="Supprimer" tooltipPosition="top"
                                            (click)="confirmDelete(position)"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="8">
                                <div class="flex flex-column align-items-center justify-content-center py-6">
                                    <div class="flex align-items-center justify-content-center border-round-xl surface-ground mb-4"
                                         style="width: 5rem; height: 5rem;">
                                        <i class="pi pi-id-card text-4xl text-500"></i>
                                    </div>
                                    <span class="font-semibold text-900 mb-1">Aucune position trouvee</span>
                                    <span class="text-500 text-sm mb-3">Creez votre premiere position</span>
                                    <button pButton pRipple label="Nouvelle Position" icon="pi pi-plus"
                                            class="p-button-outlined" (click)="openNewDialog()"></button>
                                </div>
                            </td>
                        </tr>
                    </ng-template>

                    <ng-template pTemplate="loadingbody">
                        <tr *ngFor="let i of [1,2,3,4,5]">
                            <td><p-skeleton width="2rem" height="1rem"></p-skeleton></td>
                            <td><p-skeleton width="2.5rem" height="2.5rem" borderRadius="8px"></p-skeleton></td>
                            <td><p-skeleton width="120px" height="1rem"></p-skeleton></td>
                            <td><p-skeleton width="80px" height="1.5rem" borderRadius="4px"></p-skeleton></td>
                            <td><p-skeleton width="200px" height="1rem"></p-skeleton></td>
                            <td><p-skeleton width="60px" height="1.5rem" borderRadius="16px"></p-skeleton></td>
                            <td><p-skeleton width="70px" height="1.5rem"></p-skeleton></td>
                            <td>
                                <div class="flex justify-content-center gap-1">
                                    <p-skeleton *ngFor="let j of [1,2]" shape="circle" size="2rem"></p-skeleton>
                                </div>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>

        <!-- Position Form Dialog -->
        <p-dialog [(visible)]="dialogVisible" [modal]="true" [style]="{width: '550px', maxWidth: '95vw'}"
                  [header]="isEditMode ? 'Modifier la position' : 'Nouvelle position'"
                  [closable]="true" [draggable]="false" [resizable]="false">

            <div class="flex flex-column gap-4" *ngIf="editingPosition">
                <!-- Name & Code -->
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="name" class="block font-medium text-900 mb-2">Nom <span class="text-red-500">*</span></label>
                        <input pInputText id="name" [(ngModel)]="editingPosition.name"
                               [ngClass]="{'ng-invalid ng-dirty': submitted && !editingPosition.name}"
                               placeholder="Ex: Administrateur" class="w-full" />
                        <small class="p-error block mt-1" *ngIf="submitted && !editingPosition.name">
                            Le nom est requis
                        </small>
                    </div>
                    <div class="col-12 md:col-6">
                        <label for="code" class="block font-medium text-900 mb-2">Code <span class="text-red-500">*</span></label>
                        <input pInputText id="code" [(ngModel)]="editingPosition.code"
                               [ngClass]="{'ng-invalid ng-dirty': submitted && !editingPosition.code}"
                               placeholder="Ex: admin" class="w-full"
                               (input)="editingPosition.code = $any($event.target).value.toLowerCase()" />
                        <small class="p-error block mt-1" *ngIf="submitted && !editingPosition.code">
                            Le code est requis
                        </small>
                    </div>
                </div>

                <!-- Icon & Color -->
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="icon" class="block font-medium text-900 mb-2">Icone</label>
                        <p-select id="icon" [options]="iconOptions" [(ngModel)]="editingPosition.icon"
                                  optionValue="value" placeholder="Selectionner une icone"
                                  styleClass="w-full">
                            <ng-template let-icon pTemplate="selectedItem">
                                <div class="flex align-items-center gap-2" *ngIf="icon">
                                    <i [class]="icon.value + ' text-primary'"></i>
                                    <span>{{ icon.label }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-icon pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <i [class]="icon.value + ' text-500'"></i>
                                    <span>{{ icon.label }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>
                    <div class="col-12 md:col-6">
                        <label for="color" class="block font-medium text-900 mb-2">Couleur</label>
                        <p-select id="color" [options]="colorOptions" [(ngModel)]="editingPosition.color"
                                  optionValue="value" placeholder="Selectionner une couleur"
                                  styleClass="w-full">
                            <ng-template let-color pTemplate="selectedItem">
                                <div class="flex align-items-center gap-2" *ngIf="color">
                                    <span class="border-round" [style.background]="getColorBackground(color.value)"
                                          style="width: 1rem; height: 1rem;"></span>
                                    <span>{{ color.label }}</span>
                                </div>
                            </ng-template>
                            <ng-template let-color pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <span class="border-round" [style.background]="getColorBackground(color.value)"
                                          style="width: 1rem; height: 1rem;"></span>
                                    <span>{{ color.label }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                    </div>
                </div>

                <!-- Order & Active -->
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="order" class="block font-medium text-900 mb-2">Ordre d'affichage</label>
                        <p-inputNumber id="order" [(ngModel)]="editingPosition.order"
                                       [showButtons]="true" [min]="0" styleClass="w-full"></p-inputNumber>
                    </div>
                    <div class="col-12 md:col-6">
                        <label class="block font-medium text-900 mb-2">Statut</label>
                        <div class="flex align-items-center gap-2 h-3rem">
                            <p-checkbox [(ngModel)]="editingPosition.is_active" [binary]="true"
                                        inputId="is_active"></p-checkbox>
                            <label for="is_active" class="cursor-pointer">Position active</label>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="block font-medium text-900 mb-2">Description</label>
                    <textarea pInputTextarea id="description" [(ngModel)]="editingPosition.description"
                              rows="3" placeholder="Description de la position..." class="w-full"></textarea>
                </div>

                <!-- Preview -->
                <div class="surface-ground border-round-lg p-3">
                    <div class="text-500 text-sm mb-2">Apercu</div>
                    <div class="flex align-items-center gap-3">
                        <div class="flex align-items-center justify-content-center border-round-lg"
                             [style.background]="getColorBackground(editingPosition.color)"
                             style="width: 3rem; height: 3rem;">
                            <i [class]="editingPosition.icon" class="text-white text-xl"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-900">{{ editingPosition.name || 'Nom de la position' }}</div>
                            <code class="text-sm text-primary">{{ editingPosition.code || 'code' }}</code>
                        </div>
                    </div>
                </div>
            </div>

            <ng-template pTemplate="footer">
                <div class="flex justify-content-end gap-2">
                    <button pButton pRipple label="Annuler" icon="pi pi-times"
                            class="p-button-text p-button-secondary" (click)="closeDialog()"></button>
                    <button pButton pRipple [label]="isEditMode ? 'Mettre a jour' : 'Creer'"
                            [icon]="isEditMode ? 'pi pi-save' : 'pi pi-plus'"
                            class="p-button-primary"
                            (click)="savePosition()" [loading]="saving"></button>
                </div>
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
        }

        code {
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
        }
    `]
})
export class PositionsListComponent implements OnInit, OnDestroy {
    @ViewChild('dt') table!: Table;

    private destroy$ = new Subject<void>();
    private searchSubject$ = new Subject<string>();

    positions: Position[] = [];
    filteredPositions: Position[] = [];

    loading = true;
    saving = false;
    submitted = false;

    searchTerm = '';
    selectedStatus: boolean | null = null;

    dialogVisible = false;
    isEditMode = false;
    editingPosition: any = {};

    colorOptions = POSITION_COLORS;
    iconOptions = POSITION_ICONS;

    statusOptions = [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
    ];

    get hasActiveFilters(): boolean {
        return !!(this.searchTerm || this.selectedStatus !== null);
    }

    get activeCount(): number {
        return this.positions.filter(p => p.is_active).length;
    }

    get inactiveCount(): number {
        return this.positions.filter(p => !p.is_active).length;
    }

    constructor(
        private adminService: AdminService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadPositions();
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
            this.filterPositions();
        });
    }

    private loadPositions(): void {
        this.loading = true;
        this.adminService.getPositions()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (positions) => {
                    this.positions = positions;
                    this.filterPositions();
                    this.loading = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Impossible de charger les positions'
                    });
                    this.loading = false;
                }
            });
    }

    onSearchChange(term: string): void {
        this.searchSubject$.next(term);
    }

    filterPositions(): void {
        let result = [...this.positions];

        if (this.searchTerm) {
            const search = this.searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name?.toLowerCase().includes(search) ||
                p.code?.toLowerCase().includes(search)
            );
        }

        if (this.selectedStatus !== null) {
            result = result.filter(p => p.is_active === this.selectedStatus);
        }

        this.filteredPositions = result;
    }

    resetFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = null;
        this.filterPositions();
    }

    openNewDialog(): void {
        this.isEditMode = false;
        this.submitted = false;
        this.editingPosition = {
            name: '',
            code: '',
            description: '',
            icon: 'pi pi-user',
            color: 'info',
            is_active: true,
            order: this.positions.length
        };
        this.dialogVisible = true;
    }

    editPosition(position: Position): void {
        this.isEditMode = true;
        this.submitted = false;
        this.editingPosition = { ...position };
        this.dialogVisible = true;
    }

    closeDialog(): void {
        this.dialogVisible = false;
        this.editingPosition = {};
    }

    savePosition(): void {
        this.submitted = true;

        if (!this.editingPosition.name || !this.editingPosition.code) {
            return;
        }

        this.saving = true;

        const positionData: PositionCreate = {
            name: this.editingPosition.name,
            code: this.editingPosition.code,
            description: this.editingPosition.description || '',
            icon: this.editingPosition.icon,
            color: this.editingPosition.color,
            is_active: this.editingPosition.is_active,
            order: this.editingPosition.order
        };

        const operation = this.isEditMode
            ? this.adminService.updatePosition(this.editingPosition.id, positionData)
            : this.adminService.createPosition(positionData);

        operation.pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succes',
                        detail: this.isEditMode ? 'Position mise a jour' : 'Position creee',
                        life: 3000
                    });
                    this.loadPositions();
                    this.closeDialog();
                    this.saving = false;
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: err.error?.detail || err.error?.code?.[0] || 'Erreur lors de la sauvegarde',
                        life: 5000
                    });
                    this.saving = false;
                }
            });
    }

    confirmDelete(position: Position): void {
        this.confirmationService.confirm({
            message: `Voulez-vous vraiment supprimer la position <strong>${position.name}</strong> ?`,
            header: 'Confirmer la suppression',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Supprimer',
            rejectLabel: 'Annuler',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.deletePosition(position);
            }
        });
    }

    private deletePosition(position: Position): void {
        this.adminService.deletePosition(position.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Succes',
                        detail: 'Position supprimee',
                        life: 3000
                    });
                    this.loadPositions();
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

    getColorBackground(color: string): string {
        const colors: Record<string, string> = {
            'success': '#10B981',
            'info': '#3B82F6',
            'warn': '#F59E0B',
            'danger': '#EF4444',
            'secondary': '#6B7280'
        };
        return colors[color] || colors['info'];
    }

    getColorLabel(color: string): string {
        const found = this.colorOptions.find(c => c.value === color);
        return found?.label?.split(' ')[0] || color;
    }
}
