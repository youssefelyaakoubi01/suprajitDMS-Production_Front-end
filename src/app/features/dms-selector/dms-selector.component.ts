import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

interface DMSModule {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    color: string;
    gradient: string;
    route: string;
    features: string[];
    isActive: boolean;
}

@Component({
    selector: 'app-dms-selector',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        ButtonModule,
        CardModule,
        RippleModule,
        TooltipModule
    ],
    templateUrl: './dms-selector.component.html',
    styleUrls: ['./dms-selector.component.scss']
})
export class DmsSelectorComponent {
    currentYear = new Date().getFullYear();

    dmsModules: DMSModule[] = [
        {
            id: 'production',
            title: 'DMS Production',
            subtitle: 'Manufacturing Excellence',
            description: 'Real-time production monitoring, output tracking, downtime management and shift operations.',
            icon: 'pi pi-bolt',
            color: '#3B82F6',
            gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            route: '/dms-production/dashboard',
            features: ['Production Tracking', 'Downtime Analysis', 'Output Metrics', 'Shift Management'],
            isActive: true
        },
        {
            id: 'hr',
            title: 'DMS HR',
            subtitle: 'Human Resources',
            description: 'Employee management, training programs, qualifications matrix and team organization.',
            icon: 'pi pi-users',
            color: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            route: '/dms-hr/dashboard',
            features: ['Employee Management', 'Formations', 'Versatility Matrix', 'Recyclage'],
            isActive: true
        },
        {
            id: 'maintenance',
            title: 'DMS Maintenance',
            subtitle: 'Equipment Care',
            description: 'Preventive and corrective maintenance, equipment tracking and intervention management.',
            icon: 'pi pi-wrench',
            color: '#06B6D4',
            gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            route: '/dms-maintenance/dashboard',
            features: ['Work Orders', 'Preventive Maintenance', 'Spare Parts', 'Equipment History'],
            isActive: true
        },
        {
            id: 'inventory',
            title: 'DMS Inventory',
            subtitle: 'Stock Control',
            description: 'Inventory management, stock levels, parts tracking and warehouse operations.',
            icon: 'pi pi-box',
            color: '#F59E0B',
            gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            route: '/dms-inventory/dashboard',
            features: ['Stock Management', 'Parts Catalog', 'Location Tracking', 'Inventory Reports'],
            isActive: true
        },
        {
            id: 'quality',
            title: 'DMS Quality',
            subtitle: 'Quality Assurance',
            description: 'Defect tracking, quality control inspections, non-conformity reports and corrective actions.',
            icon: 'pi pi-shield',
            color: '#10B981',
            gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            route: '/dms-quality/dashboard',
            features: ['Defect Tracking', 'Quality Inspections', 'NCR Management', '8D Reports'],
            isActive: true
        },
        {
            id: 'analytics',
            title: 'DMS Analytics',
            subtitle: 'Business Intelligence',
            description: 'KPI dashboards, performance indicators, lessons learned and continuous improvement.',
            icon: 'pi pi-chart-bar',
            color: '#EC4899',
            gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
            route: '/analytics/kpi',
            features: ['KPI Dashboards', 'Performance Reports', 'Lessons Learned', 'Trend Analysis'],
            isActive: true
        },
        {
            id: 'tech',
            title: 'DMS Tech',
            subtitle: 'Configuration',
            description: 'Configure and manage master data: Projects, Production Lines, Parts, Machines, Zones and Targets.',
            icon: 'pi pi-cog',
            color: '#6366F1',
            gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            route: '/dms-tech/dashboard',
            features: ['Projects', 'Production Lines', 'Parts & Machines', 'Targets & Headcount'],
            isActive: true
        },
        {
            id: 'admin',
            title: 'DMS Admin',
            subtitle: 'User Management',
            description: 'Manage user accounts, permissions, module access and activity logs. Administrator access only.',
            icon: 'pi pi-shield',
            color: '#DC2626',
            gradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
            route: '/dms-admin/dashboard',
            features: ['User Accounts', 'Permissions', 'Module Access', 'Activity Logs'],
            isActive: true
        }
    ];

    constructor(private router: Router) {}

    navigateToModule(module: DMSModule): void {
        if (module.isActive) {
            this.router.navigate([module.route]);
        }
    }

    getModuleStatus(module: DMSModule): string {
        return module.isActive ? 'Active' : 'Coming Soon';
    }
}
