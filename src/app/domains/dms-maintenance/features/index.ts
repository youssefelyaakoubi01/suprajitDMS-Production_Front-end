/**
 * DMS-Maintenance Features - Barrel Export
 * Domain: Maintenance Management
 *
 * Export all standalone components for the Maintenance module
 */

// Dashboard
export * from './dashboard';

// Tickets
export * from './tickets';

// Alerts
export * from './alerts';

// Data
export { MaintenanceDataComponent } from './data/maintenance-data.component';

// Weekly Follow-up
export { WeeklyFollowupComponent } from './weekly-followup/weekly-followup.component';

// Production KPI
export { ProductionKpiComponent } from './production-kpi/production-kpi.component';
