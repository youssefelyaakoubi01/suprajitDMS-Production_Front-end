/**
 * Teams List Component
 * Domain: DMS-RH
 *
 * Displays and manages teams and trainers
 */
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { TabsModule } from 'primeng/tabs';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';

// Domain imports
import { DmsTeamService, DmsExportService, Team, Formateur } from '@domains/dms-rh';

@Component({
    selector: 'app-teams-list',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        CardModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        AvatarGroupModule,
        TooltipModule,
        ToolbarModule,
        TabsModule,
        MenuModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <div class="teams-list">
            <p-tabs [value]="activeTab">
                <p-tablist>
                    <p-tab value="teams"><i class="pi pi-users mr-2"></i>Teams</p-tab>
                    <p-tab value="trainers"><i class="pi pi-user-edit mr-2"></i>Trainers</p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Teams Panel -->
                    <p-tabpanel value="teams">
                        <p-toolbar styleClass="mb-3 surface-ground border-round">
                            <ng-template #start>
                                <span class="text-xl font-semibold">Teams</span>
                            </ng-template>
                            <ng-template #end>
                                <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                                <button pButton icon="pi pi-download"
                                        class="p-button-success p-button-outlined mr-2"
                                        (click)="exportMenu.toggle($event)"
                                        pTooltip="Export data">
                                </button>
                                <button pButton icon="pi pi-plus" label="Add Team"
                                        (click)="onAddTeam()">
                                </button>
                            </ng-template>
                        </p-toolbar>

                        <div class="grid">
                            <div class="col-12 md:col-6 lg:col-4" *ngFor="let team of teams">
                                <p-card styleClass="team-card h-full">
                                    <ng-template pTemplate="header">
                                        <div class="team-header p-3">
                                            <div class="flex justify-content-between align-items-center">
                                                <span class="team-name">{{ team.name }}</span>
                                                <p-tag [value]="team.code" severity="info"></p-tag>
                                            </div>
                                        </div>
                                    </ng-template>

                                    <div class="team-body">
                                        <p class="team-description" *ngIf="team.description">
                                            {{ team.description }}
                                        </p>
                                    </div>

                                    <ng-template pTemplate="footer">
                                        <div class="flex justify-content-between align-items-center">
                                            <div class="team-actions">
                                                <button pButton icon="pi pi-eye"
                                                        class="p-button-text p-button-sm"
                                                        (click)="onViewTeam(team)" pTooltip="View Members">
                                                </button>
                                                <button pButton icon="pi pi-pencil"
                                                        class="p-button-text p-button-sm"
                                                        (click)="onEditTeam(team)" pTooltip="Edit">
                                                </button>
                                                <button pButton icon="pi pi-trash"
                                                        class="p-button-text p-button-sm p-button-danger"
                                                        (click)="onDeleteTeam(team)" pTooltip="Delete">
                                                </button>
                                            </div>
                                        </div>
                                    </ng-template>
                                </p-card>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Trainers Panel -->
                    <p-tabpanel value="trainers">
                        <p-toolbar styleClass="mb-3 surface-ground border-round">
                            <ng-template #start>
                                <span class="text-xl font-semibold">Trainers</span>
                            </ng-template>
                            <ng-template #end>
                                <button pButton icon="pi pi-plus" label="Add Trainer"
                                        (click)="onAddTrainer()">
                                </button>
                            </ng-template>
                        </p-toolbar>

                        <p-table [value]="trainers"
                                 [loading]="loadingTrainers"
                                 [paginator]="true"
                                 [rows]="10"
                                 [rowHover]="true"
                                 styleClass="p-datatable-sm">

                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Specialization</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </ng-template>

                            <ng-template pTemplate="body" let-trainer>
                                <tr>
                                    <td>
                                        <div class="flex align-items-center gap-2">
                                            <p-avatar [label]="trainer.name?.charAt(0)"
                                                      shape="circle" size="normal">
                                            </p-avatar>
                                            <span class="font-semibold">{{ trainer.name }}</span>
                                        </div>
                                    </td>
                                    <td>{{ trainer.email || '-' }}</td>
                                    <td>{{ trainer.specialization || '-' }}</td>
                                    <td>
                                        <p-tag [value]="trainer.is_active ? 'Active' : 'Inactive'"
                                               [severity]="trainer.is_active ? 'success' : 'danger'">
                                        </p-tag>
                                    </td>
                                    <td>
                                        <button pButton icon="pi pi-pencil"
                                                class="p-button-text p-button-sm"
                                                (click)="onEditTrainer(trainer)" pTooltip="Edit">
                                        </button>
                                        <button pButton icon="pi pi-trash"
                                                class="p-button-text p-button-sm p-button-danger"
                                                (click)="onDeleteTrainer(trainer)" pTooltip="Delete">
                                        </button>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </p-tabpanel>
                </p-tabpanels>
            </p-tabs>
            <p-toast></p-toast>
        </div>
    `,
    styles: [`
        .teams-list {
            padding: 1rem;
        }

        .team-card {
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
            }
        }

        .team-header {
            background: var(--surface-ground);
            border-bottom: 1px solid var(--surface-border);
        }

        .team-name {
            font-weight: 600;
            font-size: 1.1rem;
        }

        .team-description {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0;
        }

        .team-actions {
            display: flex;
            gap: 0.25rem;
        }
    `]
})
export class TeamsListComponent implements OnInit, OnDestroy {
    @Input() teams: Team[] = [];
    @Input() trainers: Formateur[] = [];
    @Input() loading = false;
    @Input() loadingTrainers = false;

    @Output() addTeam = new EventEmitter<void>();
    @Output() viewTeam = new EventEmitter<Team>();
    @Output() editTeam = new EventEmitter<Team>();
    @Output() deleteTeam = new EventEmitter<Team>();
    @Output() addTrainer = new EventEmitter<void>();
    @Output() editTrainer = new EventEmitter<Formateur>();
    @Output() deleteTrainer = new EventEmitter<Formateur>();

    private destroy$ = new Subject<void>();

    activeTab = 'teams';

    // Export menu items
    exportMenuItems: MenuItem[] = [
        {
            label: 'Export to Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportTeamsToExcel()
        },
        {
            label: 'Export to CSV',
            icon: 'pi pi-file',
            command: () => this.exportTeamsToCsv()
        }
    ];

    constructor(
        private teamService: DmsTeamService,
        private exportService: DmsExportService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        if (this.teams.length === 0) {
            this.loadTeams();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadTeams(): void {
        this.loading = true;
        this.teamService.getTeams()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (teams) => {
                    this.teams = teams;
                    this.loading = false;
                },
                error: () => {
                    this.loading = false;
                }
            });
    }

    onAddTeam(): void {
        this.addTeam.emit();
    }

    onViewTeam(team: Team): void {
        this.viewTeam.emit(team);
    }

    onEditTeam(team: Team): void {
        this.editTeam.emit(team);
    }

    onDeleteTeam(team: Team): void {
        this.deleteTeam.emit(team);
    }

    onAddTrainer(): void {
        this.addTrainer.emit();
    }

    onEditTrainer(trainer: Formateur): void {
        this.editTrainer.emit(trainer);
    }

    onDeleteTrainer(trainer: Formateur): void {
        this.deleteTrainer.emit(trainer);
    }

    exportTeamsToExcel(): void {
        if (this.teams.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No teams to export'
            });
            return;
        }

        this.exportService.exportTeams(this.teams);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.teams.length} teams exported to Excel`
        });
    }

    exportTeamsToCsv(): void {
        if (this.teams.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Data',
                detail: 'No teams to export'
            });
            return;
        }

        this.exportService.exportTeamsToCsv(this.teams);
        this.messageService.add({
            severity: 'success',
            summary: 'Export Complete',
            detail: `${this.teams.length} teams exported to CSV`
        });
    }
}
