import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ProductionService } from '../../../core/services/production.service';
import { forkJoin } from 'rxjs';

interface ConfigCard {
    title: string;
    icon: string;
    route: string;
    count: number;
    description: string;
    color: string;
}

@Component({
    selector: 'app-tech-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        RippleModule
    ],
    template: `
        <div class="tech-dashboard">
            <div class="page-header">
                <h1>
                    <i class="pi pi-cog"></i>DMS-Tech Configuration
                </h1>
                <p>
                    Configure and manage production master data: Projects, Lines, Parts, Machines, Zones, and Targets
                </p>
            </div>

            <div class="cards-grid">
                <div *ngFor="let card of configCards" class="config-card"
                     [routerLink]="card.route"
                     [style.border-left-color]="card.color">
                    <div class="card-header">
                        <div class="icon-wrapper" [style.background-color]="card.color + '20'">
                            <i [class]="card.icon" [style.color]="card.color"></i>
                        </div>
                        <span class="badge" [style.background-color]="card.color">
                            {{ card.count }}
                        </span>
                    </div>
                    <h3 class="card-title">{{ card.title }}</h3>
                    <p class="card-description">{{ card.description }}</p>
                    <div class="card-footer">
                        <a [routerLink]="card.route" class="manage-link">
                            Manage <i class="pi pi-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>

            <div class="quick-actions-section">
                <h2 class="section-title">
                    <i class="pi pi-info-circle"></i>Quick Actions
                </h2>
                <div class="actions-grid">
                    <p-button
                        label="Add New Project"
                        icon="pi pi-plus"
                        styleClass="w-full p-button-outlined"
                        routerLink="/dms-tech/projects">
                    </p-button>
                    <p-button
                        label="Add Production Line"
                        icon="pi pi-plus"
                        styleClass="w-full p-button-outlined"
                        routerLink="/dms-tech/production-lines">
                    </p-button>
                    <p-button
                        label="Add Part Number"
                        icon="pi pi-plus"
                        styleClass="w-full p-button-outlined"
                        routerLink="/dms-tech/parts">
                    </p-button>
                    <p-button
                        label="Configure Targets"
                        icon="pi pi-sliders-h"
                        styleClass="w-full p-button-outlined"
                        routerLink="/dms-tech/targets">
                    </p-button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .tech-dashboard {
            padding: 1rem;
        }

        .page-header {
            margin-bottom: 2rem;
        }

        .page-header h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .page-header p {
            color: var(--text-color-secondary);
            margin-top: 0.5rem;
        }

        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
        }

        .config-card {
            background: var(--surface-card);
            border-radius: 12px;
            padding: 1.5rem;
            border-left: 4px solid;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .config-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .icon-wrapper {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .icon-wrapper i {
            font-size: 1.5rem;
        }

        .badge {
            color: white;
            font-weight: 700;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
        }

        .card-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 0.5rem 0;
            color: var(--text-color);
        }

        .card-description {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0;
            line-height: 1.5;
            flex-grow: 1;
        }

        .card-footer {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--surface-border);
        }

        .manage-link {
            color: var(--primary-color);
            font-weight: 500;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            transition: color 0.2s;
        }

        .manage-link:hover {
            text-decoration: underline;
        }

        .manage-link i {
            font-size: 0.75rem;
        }

        .quick-actions-section {
            margin-top: 2.5rem;
        }

        .section-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin: 0 0 1rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-color);
        }

        .section-title i {
            color: var(--primary-color);
        }

        .actions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }

        @media (max-width: 576px) {
            .cards-grid {
                grid-template-columns: 1fr;
            }

            .actions-grid {
                grid-template-columns: 1fr;
            }
        }
    `]
})
export class TechDashboardComponent implements OnInit {
    configCards: ConfigCard[] = [
        {
            title: 'Projects',
            icon: 'pi pi-briefcase',
            route: '/dms-tech/projects',
            count: 0,
            description: 'Manage projects and their configurations',
            color: '#3B82F6'
        },
        {
            title: 'Production Lines',
            icon: 'pi pi-sitemap',
            route: '/dms-tech/production-lines',
            count: 0,
            description: 'Configure production lines and capacity',
            color: '#10B981'
        },
        {
            title: 'Part Numbers',
            icon: 'pi pi-box',
            route: '/dms-tech/parts',
            count: 0,
            description: 'Manage part numbers and specifications',
            color: '#F59E0B'
        },
        {
            title: 'Machines',
            icon: 'pi pi-cog',
            route: '/dms-tech/machines',
            count: 0,
            description: 'Configure machines and equipment',
            color: '#8B5CF6'
        },
        {
            title: 'Zones',
            icon: 'pi pi-map',
            route: '/dms-tech/zones',
            count: 0,
            description: 'Define production zones and areas',
            color: '#06B6D4'
        },
        {
            title: 'Workstations',
            icon: 'pi pi-desktop',
            route: '/dms-tech/workstations',
            count: 0,
            description: 'Manage workstations per production line',
            color: '#EC4899'
        },
        {
            title: 'Targets & Headcount',
            icon: 'pi pi-chart-bar',
            route: '/dms-tech/targets',
            count: 0,
            description: 'Set shift targets and headcount requirements',
            color: '#EF4444'
        }
    ];

    constructor(private productionService: ProductionService) {}

    ngOnInit(): void {
        this.loadCounts();
    }

    loadCounts(): void {
        forkJoin({
            projects: this.productionService.getProjects(),
            lines: this.productionService.getProductionLines(),
            parts: this.productionService.getParts(),
            machines: this.productionService.getMachines(),
            zones: this.productionService.getZones(),
            workstations: this.productionService.getWorkstations()
        }).subscribe({
            next: (data: any) => {
                this.configCards[0].count = (data.projects.results || data.projects)?.length || 0;
                this.configCards[1].count = (data.lines.results || data.lines)?.length || 0;
                this.configCards[2].count = (data.parts.results || data.parts)?.length || 0;
                this.configCards[3].count = (data.machines.results || data.machines)?.length || 0;
                this.configCards[4].count = (data.zones.results || data.zones)?.length || 0;
                this.configCards[5].count = (data.workstations.results || data.workstations)?.length || 0;
            },
            error: (err) => {
                console.error('Error loading counts:', err);
            }
        });
    }
}
