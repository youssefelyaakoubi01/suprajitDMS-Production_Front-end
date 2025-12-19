/**
 * DMS-Inventory Models
 * Domain: Inventory & Stock Management
 */

// ==================== INVENTORY ITEM ====================
export interface InventoryItem {
    PN: string;
    PNDESC: string;
    UNIT: string;
    TOTALSTOCK: number;
    PRICE: number;
    Category?: string;
    MinStock?: number;
    MaxStock?: number;
}

// ==================== DATA ENTRY ====================
export interface DataEntry {
    SN: string;
    PN: string;
    BATCHNO: string;
    SUNO: string;
    QTY: number;
    COMMENT: string;
    DATEENTRY: Date;
    AREA: string;
    USERID: string;
}

// ==================== INVENTORY LOCATION ====================
export interface InventoryLocation {
    Id_Location: number;
    Name_Location: string;
    Code_Location: string;
    Area: string;
    Capacity: number;
}

// ==================== STOCK MOVEMENT ====================
export interface StockMovement {
    Id_Movement: number;
    PN: string;
    MovementType: MovementType;
    Quantity: number;
    FromLocation?: string;
    ToLocation?: string;
    Date: Date;
    UserId: string;
    Reference?: string;
}

// ==================== ENUMS & TYPES ====================
export type MovementType = 'IN' | 'OUT' | 'TRANSFER';

export const MovementTypeLabels: Record<MovementType, string> = {
    IN: 'Entrée',
    OUT: 'Sortie',
    TRANSFER: 'Transfert'
};

export const MovementTypeColors: Record<MovementType, string> = {
    IN: '#10B981',
    OUT: '#EF4444',
    TRANSFER: '#3B82F6'
};

// ==================== STOCK STATUS ====================
export type StockStatus = 'normal' | 'low' | 'critical' | 'overstock';

export const StockStatusLabels: Record<StockStatus, string> = {
    normal: 'Normal',
    low: 'Bas',
    critical: 'Critique',
    overstock: 'Surstock'
};

// ==================== INVENTORY STATS ====================
export interface InventoryStats {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    criticalStockItems: number;
    itemsByCategory: { category: string; count: number; value: number }[];
    recentMovements: StockMovement[];
}

// ==================== INVENTORY ALERT ====================
export interface InventoryAlert {
    id: number;
    type: 'low_stock' | 'critical_stock' | 'overstock' | 'expiring';
    partNumber: string;
    partDescription: string;
    currentStock: number;
    threshold: number;
    createdAt: Date;
    isAcknowledged: boolean;
}

// ==================== TYPE ALIASES ====================
export type StockAlert = InventoryAlert;
export type Location = InventoryLocation;
