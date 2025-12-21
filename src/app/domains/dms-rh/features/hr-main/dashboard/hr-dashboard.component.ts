import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

import { HRService } from '@core/services/hr.service';
import { Employee, HRDashboardStats, FormationStats } from '@core/models/employee.model';

interface KPICard {
    title: string;
    value: number | string;
    icon: string;
    color: string;
    trend?: number;
    subtitle?: string;
}

interface RecentActivity {
    id: number;
    type: 'hire' | 'formation' | 'qualification' | 'recyclage';
    title: string;
    description: string;
    date: Date;
    employee?: string;
    icon: string;
    color: string;
}

@Component({
    selector: 'app-hr-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ChartModule,
        ButtonModule,
        TagModule,
        AvatarModule,
        AvatarGroupModule,
        TableModule,
        ProgressBarModule,
        TooltipModule,
        DividerModule,
        SkeletonModule
    ],
    templateUrl: './hr-dashboard.component.html',
    styleUrls: ['./hr-dashboard.component.scss']
})
export class HrDashboardComponent implements OnInit {
    // Loading states
    loading = true;
    loadingStats = true;

    // KPI Cards
    kpiCards: KPICard[] = [];

    // Charts data
    employeesByDeptChart: any;
    employeesByCategoryChart: any;
    formationsChart: any;
    qualificationsChart: any;
    chartOptions: any;
    pieChartOptions: any;

    // Stats
    dashboardStats: HRDashboardStats | null = null;
    formationStats: FormationStats | null = null;

    // Recent activities
    recentActivities: RecentActivity[] = [];

    // Upcoming formations
    upcomingFormations: any[] = [];

    // Employees requiring attention
    employeesNeedingRecyclage: Employee[] = [];

    // Top performers
    topPerformers: any[] = [];

    constructor(private hrService: HRService) {}

    ngOnInit(): void {
        this.initChartOptions();
        this.loadDashboardData();
    }

    private initChartOptions(): void {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder }
                },
                y: {
                    ticks: { color: textColorSecondary },
                    grid: { color: surfaceBorder },
                    beginAtZero: true
                }
            }
        };

        this.pieChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 20
                    }
                }
            }
        };
    }

    private loadDashboardData(): void {
        this.loading = true;
        this.loadingStats = true;

        // Load real stats from backend
        this.hrService.getDashboardStats().subscribe({
            next: (stats: any) => {
                this.dashboardStats = {
                    totalEmployees: stats.total_employees,
                    activeEmployees: stats.active_employees,
                    inactiveEmployees: stats.inactive_employees,
                    employeesByDepartment: stats.employees_by_department?.map((d: any) => ({
                        department: d.department,
                        count: d.count
                    })) || [],
                    employeesByCategory: stats.employees_by_category?.map((c: any) => ({
                        category: c.category,
                        count: c.count
                    })) || [],
                    recentHires: [],
                    employeesRequiringRecyclage: stats.employees_requiring_recyclage,
                    qualificationCompletionRate: stats.qualification_rate,
                    averageVersatility: 2.4
                };

                this.formationStats = {
                    totalFormations: stats.total_formations,
                    plannedFormations: stats.pending_qualifications,
                    completedFormations: stats.passed_qualifications,
                    formationsByType: [],
                    upcomingFormations: []
                };

                this.buildKpiCards();
                this.loadCharts();
                this.loadingStats = false;
            },
            error: (err) => {
                console.error('Error loading dashboard stats:', err);
                // Fallback to mock data
                this.loadStatsFallback();
            }
        });

        // Load recyclage employees
        this.hrService.getEmployeesRequiringRecyclage().subscribe({
            next: (employees: any[]) => {
                this.employeesNeedingRecyclage = employees.map(e => ({
                    Id_Emp: e.id,
                    Nom_Emp: e.full_name?.split(' ')[1] || '',
                    Prenom_Emp: e.full_name?.split(' ')[0] || '',
                    DateNaissance_Emp: new Date(),
                    Genre_Emp: '',
                    Categorie_Emp: e.category,
                    DateEmbauche_Emp: new Date(e.hire_date),
                    Departement_Emp: e.department,
                    Picture: e.picture || '',
                    EmpStatus: 'Active',
                    daysUntilRecyclage: e.days_until_recyclage,
                    isOverdue: e.is_overdue
                } as any));
            },
            error: (err) => {
                console.error('Error loading recyclage employees:', err);
                this.loadEmployeesNeedingRecyclageFallback();
            }
        });

        this.loadRecentActivities();
        this.loadUpcomingFormations();
        this.loadTopPerformers();
        this.loading = false;
    }

    private buildKpiCards(): void {
        if (!this.dashboardStats || !this.formationStats) return;

        this.kpiCards = [
            {
                title: 'Total Employees',
                value: this.dashboardStats.totalEmployees,
                icon: 'pi pi-users',
                color: '#3B82F6',
                trend: 5.2,
                subtitle: `${this.dashboardStats.activeEmployees} active`
            },
            {
                title: 'Qualifications Passed',
                value: this.formationStats.completedFormations,
                icon: 'pi pi-verified',
                color: '#10B981',
                trend: 12.5,
                subtitle: `${this.formationStats.plannedFormations} pending`
            },
            {
                title: 'Qualification Rate',
                value: `${this.dashboardStats.qualificationCompletionRate}%`,
                icon: 'pi pi-chart-line',
                color: '#8B5CF6',
                trend: 3.1,
                subtitle: 'Overall completion'
            },
            {
                title: 'Recyclage Needed',
                value: this.dashboardStats.employeesRequiringRecyclage,
                icon: 'pi pi-refresh',
                color: '#F59E0B',
                trend: -2,
                subtitle: 'Employees to retrain'
            }
        ];
    }

    private loadStatsFallback(): void {
        this.dashboardStats = {
            totalEmployees: 0,
            activeEmployees: 0,
            inactiveEmployees: 0,
            employeesByDepartment: [],
            employeesByCategory: [],
            recentHires: [],
            employeesRequiringRecyclage: 0,
            qualificationCompletionRate: 0,
            averageVersatility: 0
        };

        this.formationStats = {
            totalFormations: 0,
            plannedFormations: 0,
            completedFormations: 0,
            formationsByType: [],
            upcomingFormations: []
        };

        this.buildKpiCards();
        this.loadCharts();
        this.loadingStats = false;
    }

    private loadEmployeesNeedingRecyclageFallback(): void {
        this.employeesNeedingRecyclage = [];
    }

    private loadCharts(): void {
        const documentStyle = getComputedStyle(document.documentElement);

        // Employees by Department Chart
        this.employeesByDeptChart = {
            labels: ['Production', 'Quality', 'Maintenance', 'Logistics', 'HR'],
            datasets: [
                {
                    data: [85, 25, 20, 15, 11],
                    backgroundColor: [
                        '#3B82F6',
                        '#10B981',
                        '#F59E0B',
                        '#8B5CF6',
                        '#EC4899'
                    ],
                    hoverBackgroundColor: [
                        '#2563EB',
                        '#059669',
                        '#D97706',
                        '#7C3AED',
                        '#DB2777'
                    ]
                }
            ]
        };

        // Employees by Category Chart
        this.employeesByCategoryChart = {
            labels: ['Operator', 'Team Leader', 'Technician', 'Engineer', 'Manager'],
            datasets: [
                {
                    data: [95, 20, 25, 10, 6],
                    backgroundColor: [
                        '#06B6D4',
                        '#8B5CF6',
                        '#F59E0B',
                        '#10B981',
                        '#EF4444'
                    ]
                }
            ]
        };

        // Formations by Month Chart
        this.formationsChart = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Completed',
                    data: [12, 15, 8, 18, 14, 20],
                    backgroundColor: '#10B981',
                    borderRadius: 8
                },
                {
                    label: 'Planned',
                    data: [5, 8, 10, 6, 12, 8],
                    backgroundColor: '#3B82F6',
                    borderRadius: 8
                }
            ]
        };

        // Qualifications Progress Chart
        this.qualificationsChart = {
            labels: ['Level 0', 'Level 1', 'Level 2', 'Level 3', 'Level 4'],
            datasets: [
                {
                    label: 'Employees',
                    data: [15, 25, 45, 50, 21],
                    backgroundColor: [
                        '#9CA3AF',
                        '#FCD34D',
                        '#60A5FA',
                        '#34D399',
                        '#8B5CF6'
                    ],
                    borderRadius: 8
                }
            ]
        };
    }

    private loadRecentActivities(): void {
        this.recentActivities = [
            {
                id: 1,
                type: 'hire',
                title: 'New Employee Hired',
                description: 'Sarah Martin joined as Operator in Production',
                date: new Date('2024-01-15'),
                employee: 'Sarah Martin',
                icon: 'pi pi-user-plus',
                color: '#10B981'
            },
            {
                id: 2,
                type: 'formation',
                title: 'Formation Completed',
                description: 'Safety Training completed by 12 employees',
                date: new Date('2024-01-14'),
                icon: 'pi pi-book',
                color: '#3B82F6'
            },
            {
                id: 3,
                type: 'qualification',
                title: 'Qualification Validated',
                description: 'Ahmed Benali achieved Level 4 in Assembly',
                date: new Date('2024-01-13'),
                employee: 'Ahmed Benali',
                icon: 'pi pi-verified',
                color: '#8B5CF6'
            },
            {
                id: 4,
                type: 'recyclage',
                title: 'Recyclage Scheduled',
                description: '5 employees scheduled for retraining',
                date: new Date('2024-01-12'),
                icon: 'pi pi-refresh',
                color: '#F59E0B'
            },
            {
                id: 5,
                type: 'hire',
                title: 'Team Leader Promoted',
                description: 'Pierre Dubois promoted to Team Leader',
                date: new Date('2024-01-11'),
                employee: 'Pierre Dubois',
                icon: 'pi pi-arrow-up',
                color: '#EC4899'
            }
        ];
    }

    private loadUpcomingFormations(): void {
        this.upcomingFormations = [
            {
                id: 1,
                name: 'Safety Training',
                date: new Date('2024-01-20'),
                participants: 15,
                trainer: 'Jean Dupont',
                status: 'confirmed'
            },
            {
                id: 2,
                name: 'Quality Control Basics',
                date: new Date('2024-01-22'),
                participants: 8,
                trainer: 'Marie Leblanc',
                status: 'pending'
            },
            {
                id: 3,
                name: 'Welding Certification',
                date: new Date('2024-01-25'),
                participants: 5,
                trainer: 'External',
                status: 'confirmed'
            }
        ];
    }

    private loadEmployeesNeedingRecyclage(): void {
        this.employeesNeedingRecyclage = [
            { Id_Emp: 55, Nom_Emp: 'BENALI', Prenom_Emp: 'AHMED', DateNaissance_Emp: new Date(), Genre_Emp: 'M', Categorie_Emp: 'Operator', DateEmbauche_Emp: new Date('2019-06-15'), Departement_Emp: 'Production', Picture: '', EmpStatus: 'Active' },
            { Id_Emp: 59, Nom_Emp: 'LAMBERT', Prenom_Emp: 'JEAN', DateNaissance_Emp: new Date(), Genre_Emp: 'M', Categorie_Emp: 'Operator', DateEmbauche_Emp: new Date('2018-07-20'), Departement_Emp: 'Production', Picture: '', EmpStatus: 'Active' },
            { Id_Emp: 62, Nom_Emp: 'MOREAU', Prenom_Emp: 'LUC', DateNaissance_Emp: new Date(), Genre_Emp: 'M', Categorie_Emp: 'Technician', DateEmbauche_Emp: new Date('2019-02-10'), Departement_Emp: 'Maintenance', Picture: '', EmpStatus: 'Active' }
        ];
    }

    private loadTopPerformers(): void {
        this.topPerformers = [
            { name: 'Sophie Martin', department: 'Production', score: 98, qualifications: 12 },
            { name: 'Ahmed Benali', department: 'Production', score: 95, qualifications: 10 },
            { name: 'Pierre Dubois', department: 'Quality', score: 92, qualifications: 9 },
            { name: 'Marie Leblanc', department: 'Maintenance', score: 90, qualifications: 8 }
        ];
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
            'confirmed': 'success',
            'pending': 'warn',
            'cancelled': 'danger'
        };
        return map[status] || 'info';
    }

    getDaysUntil(date: Date): number {
        const today = new Date();
        const diffTime = new Date(date).getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
