/**
 * DMS-RH Models - Barrel Export
 * Domain: Human Resources Management
 */

// Core entities
export * from './employee.model';
export * from './team.model';
export * from './transport.model';

// Qualification & Formation
export * from './qualification.model';
export * from './formation.model';
export * from './process.model';
export * from './workstation.model';

// Administration
export * from './license.model';
export * from './user.model';

// Dashboard & Stats
export * from './dashboard.model';

// Presence & Working Hours (synced from Production)
export * from './presence.model';

// Non-Qualified Assignments (Traceability)
export * from './non-qualified-assignment.model';
