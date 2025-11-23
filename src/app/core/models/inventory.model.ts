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

export interface InventoryLocation {
    Id_Location: number;
    Name_Location: string;
    Code_Location: string;
    Area: string;
    Capacity: number;
}

export interface StockMovement {
    Id_Movement: number;
    PN: string;
    MovementType: 'IN' | 'OUT' | 'TRANSFER';
    Quantity: number;
    FromLocation?: string;
    ToLocation?: string;
    Date: Date;
    UserId: string;
    Reference?: string;
}
