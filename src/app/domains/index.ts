/**
 * DMS Domains - Master Barrel Export
 *
 * This file provides a single entry point for all domain exports.
 *
 * Usage examples:
 *   // Import from specific domain (recommended)
 *   import { DmsProductionService } from '@domains/dms-production';
 *   import { Employee, Team } from '@domains/dms-rh';
 *
 *   // Import from domains root (for cross-domain usage)
 *   import { DmsProductionService, Employee } from '@domains';
 */

// DMS-Production
export * from './dms-production';

// DMS-RH (Human Resources)
export * from './dms-rh';

// DMS-Quality
export * from './dms-quality';

// DMS-Maintenance
export * from './dms-maintenance';

// DMS-Inventory
export * from './dms-inventory';

// DMS-Analytics
export * from './dms-analytics';

// DMS-Tech (Configuration)
export * from './dms-tech';
