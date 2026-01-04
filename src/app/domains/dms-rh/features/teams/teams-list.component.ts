/**
 * Teams List Component
 * Domain: DMS-RH
 *
 * Displays and manages teams and trainers with modern Sakai template styling
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
import { SkeletonModule } from 'primeng/skeleton';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
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
        ToastModule,
        SkeletonModule,
        BadgeModule,
        RippleModule
    ],
    providers: [MessageService],
    template: `
        <div class="teams-list">
            <!-- Page Header -->
            <div class="hr-page-header">
                <div class="header-title">
                    <div class="header-icon">
                        <i class="pi pi-sitemap"></i>
                    </div>
                    <div class="title-text">
                        <h1>Teams & Trainers</h1>
                        <span class="subtitle">Manage your team structure and training staff</span>
                    </div>
                </div>
            </div>

            <!-- Stats Row -->
            <div class="stats-row">
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--hr-primary);">
                        <i class="pi pi-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value">{{ teams.length }}</div>
                        <div class="stat-label">Total Teams</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--hr-success);">
                        <i class="pi pi-user-edit"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-success">{{ activeTrainersCount }}</div>
                        <div class="stat-label">Active Trainers</div>
                    </div>
                </div>
                <div class="hr-stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--hr-info);">
                        <i class="pi pi-id-card"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-value text-info">{{ totalMembersCount }}</div>
                        <div class="stat-label">Total Members</div>
                    </div>
                </div>
            </div>

            <p-tabs [value]="activeTab">
                <p-tablist>
                    <p-tab value="teams">
                        <div class="tab-header">
                            <i class="pi pi-users"></i>
                            <span>Teams</span>
                            <p-badge [value]="teams.length.toString()" severity="secondary"></p-badge>
                        </div>
                    </p-tab>
                    <p-tab value="trainers">
                        <div class="tab-header">
                            <i class="pi pi-user-edit"></i>
                            <span>Trainers</span>
                            <p-badge [value]="trainers.length.toString()" severity="secondary"></p-badge>
                        </div>
                    </p-tab>
                </p-tablist>

                <p-tabpanels>
                    <!-- Teams Panel -->
                    <p-tabpanel value="teams">
                        <div class="hr-section-card">
                            <div class="section-header">
                                <span class="section-title">
                                    <i class="pi pi-sitemap"></i>
                                    Team Directory
                                </span>
                                <div class="section-actions">
                                    <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                                    <button pButton pRipple
                                            icon="pi pi-download"
                                            class="p-button-outlined p-button-success p-button-sm"
                                            (click)="exportMenu.toggle($event)"
                                            pTooltip="Export data">
                                    </button>
                                    <button pButton pRipple
                                            icon="pi pi-plus"
                                            label="Add Team"
                                            class="p-button-primary p-button-sm"
                                            (click)="onAddTeam()">
                                    </button>
                                </div>
                            </div>
                            <div class="section-body">
                                <!-- Loading State -->
                                <div class="teams-grid" *ngIf="loading">
                                    <div class="team-card-skeleton" *ngFor="let i of [1,2,3,4,5,6]">
                                        <div class="skeleton-header">
                                            <p-skeleton height="24px" width="60%"></p-skeleton>
                                            <p-skeleton height="22px" width="50px" borderRadius="11px"></p-skeleton>
                                        </div>
                                        <p-skeleton height="16px" width="80%" styleClass="mb-2"></p-skeleton>
                                        <div class="skeleton-footer">
                                            <p-skeleton shape="circle" size="32px"></p-skeleton>
                                            <p-skeleton shape="circle" size="32px"></p-skeleton>
                                            <p-skeleton shape="circle" size="32px"></p-skeleton>
                                        </div>
                                    </div>
                                </div>

                                <!-- Teams Grid -->
                                <div class="teams-grid" *ngIf="!loading">
                                    <div class="hr-data-card team-card"
                                         *ngFor="let team of teams"
                                         pRipple>
                                        <div class="card-header">
                                            <div class="header-content">
                                                <div class="team-avatar">
                                                    <span>{{ getTeamInitials(team) }}</span>
                                                </div>
                                                <div class="team-info">
                                                    <h3 class="card-title">{{ team.name }}</h3>
                                                    <p-tag [value]="team.code" severity="info" [rounded]="true"></p-tag>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <p class="team-description" *ngIf="team.description">
                                                {{ team.description }}
                                            </p>
                                            <p class="team-description no-desc" *ngIf="!team.description">
                                                No description available
                                            </p>

                                            <div class="team-stats">
                                                <div class="stat-item">
                                                    <i class="pi pi-users"></i>
                                                    <span>{{ team.memberCount || 0 }} members</span>
                                                </div>
                                                <div class="stat-item" *ngIf="team.leader">
                                                    <i class="pi pi-star-fill"></i>
                                                    <span>{{ team.leader }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-footer">
                                            <div class="hr-action-buttons">
                                                <button pButton pRipple
                                                        icon="pi pi-eye"
                                                        class="p-button-text p-button-rounded p-button-sm"
                                                        (click)="onViewTeam(team)"
                                                        pTooltip="View Members">
                                                </button>
                                                <button pButton pRipple
                                                        icon="pi pi-pencil"
                                                        class="p-button-text p-button-rounded p-button-sm"
                                                        (click)="onEditTeam(team)"
                                                        pTooltip="Edit">
                                                </button>
                                                <button pButton pRipple
                                                        icon="pi pi-trash"
                                                        class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                                        (click)="onDeleteTeam(team)"
                                                        pTooltip="Delete">
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty State -->
                                <div class="hr-empty-state" *ngIf="!loading && teams.length === 0">
                                    <i class="empty-icon pi pi-sitemap"></i>
                                    <h3>No teams found</h3>
                                    <p>Get started by creating your first team</p>
                                    <button pButton pRipple
                                            label="Create Team"
                                            icon="pi pi-plus"
                                            (click)="onAddTeam()">
                                    </button>
                                </div>
                            </div>
                        </div>
                    </p-tabpanel>

                    <!-- Trainers Panel -->
                    <p-tabpanel value="trainers">
                        <div class="hr-section-card">
                            <div class="section-header">
                                <span class="section-title">
                                    <i class="pi pi-user-edit"></i>
                                    Trainers Directory
                                </span>
                                <button pButton pRipple
                                        icon="pi pi-plus"
                                        label="Add Trainer"
                                        class="p-button-primary p-button-sm"
                                        (click)="onAddTrainer()">
                                </button>
                            </div>
                            <div class="section-body p-0">
                                <p-table [value]="trainers"
                                         [loading]="loadingTrainers"
                                         [paginator]="true"
                                         [rows]="10"
                                         [rowHover]="true"
                                         styleClass="hr-table">

                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th style="width: 60px"></th>
                                            <th pSortableColumn="name">
                                                <div class="flex align-items-center gap-2">
                                                    Name
                                                    <p-sortIcon field="name"></p-sortIcon>
                                                </div>
                                            </th>
                                            <th>Email</th>
                                            <th pSortableColumn="specialization">
                                                <div class="flex align-items-center gap-2">
                                                    Specialization
                                                    <p-sortIcon field="specialization"></p-sortIcon>
                                                </div>
                                            </th>
                                            <th style="width: 100px">Status</th>
                                            <th style="width: 120px; text-align: center">Actions</th>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="body" let-trainer>
                                        <tr>
                                            <td>
                                                <div class="hr-avatar-badge">
                                                    <p-avatar [label]="trainer.name?.charAt(0)"
                                                              shape="circle"
                                                              size="large"
                                                              [style]="{'background': 'var(--hr-gradient)', 'color': 'white'}">
                                                    </p-avatar>
                                                    <span class="badge" [class.badge-active]="trainer.is_active" [class.badge-inactive]="!trainer.is_active"></span>
                                                </div>
                                            </td>
                                            <td>
                                                <span class="font-semibold">{{ trainer.name }}</span>
                                            </td>
                                            <td>
                                                <div class="hr-info-row" *ngIf="trainer.email">
                                                    <i class="pi pi-envelope"></i>
                                                    <span>{{ trainer.email }}</span>
                                                </div>
                                                <span *ngIf="!trainer.email" class="text-color-secondary">-</span>
                                            </td>
                                            <td>
                                                <p-tag *ngIf="trainer.specialization"
                                                       [value]="trainer.specialization"
                                                       severity="info"
                                                       [rounded]="true">
                                                </p-tag>
                                                <span *ngIf="!trainer.specialization" class="text-color-secondary">-</span>
                                            </td>
                                            <td>
                                                <p-tag [value]="trainer.is_active ? 'Active' : 'Inactive'"
                                                       [severity]="trainer.is_active ? 'success' : 'danger'"
                                                       [rounded]="true">
                                                </p-tag>
                                            </td>
                                            <td>
                                                <div class="hr-action-buttons">
                                                    <button pButton pRipple
                                                            icon="pi pi-pencil"
                                                            class="p-button-text p-button-rounded p-button-sm"
                                                            (click)="onEditTrainer(trainer)"
                                                            pTooltip="Edit">
                                                    </button>
                                                    <button pButton pRipple
                                                            icon="pi pi-trash"
                                                            class="p-button-text p-button-rounded p-button-sm p-button-danger"
                                                            (click)="onDeleteTrainer(trainer)"
                                                            pTooltip="Delete">
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>

                                    <ng-template pTemplate="emptymessage">
                                        <tr>
                                            <td colspan="6">
                                                <div class="hr-empty-state">
                                                    <i class="empty-icon pi pi-user-edit"></i>
                                                    <h3>No trainers found</h3>
                                                    <p>Add your first trainer to get started</p>
                                                    <button pButton pRipple
                                                            label="Add Trainer"
                                                            icon="pi pi-plus"
                                                            (click)="onAddTrainer()">
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

            <p-toast></p-toast>
        </div>
    `,
    styles: [`
        .teams-list {
            padding: 1.5rem;
        }

        /* Stats Row */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        /* Tab Header */
        .tab-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        /* Section Actions */
        .section-actions {
            display: flex;
            gap: 0.5rem;
        }

        /* Teams Grid */
        .teams-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1.25rem;
        }

        /* Team Card Skeleton */
        .team-card-skeleton {
            background: var(--surface-card);
            border-radius: 16px;
            padding: 1.25rem;
            border: 1px solid var(--surface-border);

            .skeleton-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
            }

            .skeleton-footer {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }
        }

        /* Team Card Enhancements */
        .team-card {
            cursor: pointer;

            .card-header {
                padding: 1.25rem;
                background: transparent;
                border-bottom: none;

                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
            }

            .team-avatar {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                background: var(--hr-gradient);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 1.125rem;
            }

            .team-info {
                display: flex;
                flex-direction: column;
                gap: 0.375rem;

                .card-title {
                    margin: 0;
                    font-size: 1.0625rem;
                }
            }

            .card-body {
                padding: 0 1.25rem 1.25rem;
            }

            .team-description {
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                margin: 0 0 1rem 0;
                line-height: 1.5;

                &.no-desc {
                    font-style: italic;
                    opacity: 0.7;
                }
            }

            .team-stats {
                display: flex;
                gap: 1.25rem;

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.8125rem;
                    color: var(--text-color-secondary);

                    i {
                        color: var(--hr-primary);
                        font-size: 0.875rem;
                    }
                }
            }
        }

        /* Table Customization */
        :host ::ng-deep {
            .p-datatable .p-datatable-thead > tr > th {
                background: var(--surface-50);
                padding: 1rem;
            }

            .p-datatable .p-datatable-tbody > tr > td {
                padding: 0.75rem 1rem;
            }

            .p-tabs {
                .p-tablist {
                    background: transparent;
                    border: none;
                }
            }
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

    get activeTrainersCount(): number {
        return this.trainers.filter(t => t.is_active).length;
    }

    get totalMembersCount(): number {
        return this.teams.reduce((total, team) => total + (team.memberCount || 0), 0);
    }

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

    getTeamInitials(team: Team): string {
        if (!team.name) return '?';
        const words = team.name.split(' ');
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return team.name.substring(0, 2).toUpperCase();
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
