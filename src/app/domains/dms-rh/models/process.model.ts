/**
 * DMS-RH Models - Process
 * Domain: Human Resources Management
 *
 * Manufacturing process model for formations
 */

export interface Process {
    id?: number;
    name: string;
    description?: string;
    is_active?: boolean;
}
