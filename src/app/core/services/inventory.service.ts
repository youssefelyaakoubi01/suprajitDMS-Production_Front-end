import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface InventoryItem {
    PN: string;
    PNDESC: string;
    UNIT: string;
    TOTALSTOCK: number;
    PRICE: number;
    MINSTOCK?: number;
    MAXSTOCK?: number;
}

export interface StockLocation {
    LocationID: number;
    LocationName: string;
    LocationType: string;
    Capacity?: number;
}

export interface DataEntry {
    EntryID?: number;
    SN: string;
    PN: string;
    BATCHNO: string;
    SUNO: string;
    QTY: number;
    COMMENT?: string;
    DATEENTRY: string;
    AREA: string;
    USERID: string;
}

export interface Supplier {
    SupplierID: number;
    SupplierName: string;
    ContactPerson?: string;
    Email?: string;
    Phone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly endpoint = 'inventory';

    constructor(private api: ApiService) {}

    // Inventory Items
    getItems(params?: { search?: string; lowStock?: boolean }): Observable<InventoryItem[]> {
        return this.api.get<InventoryItem[]>(`${this.endpoint}/items`, params);
    }

    getItem(pn: string): Observable<InventoryItem> {
        return this.api.get<InventoryItem>(`${this.endpoint}/items/${pn}`);
    }

    createItem(item: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.api.post<InventoryItem>(`${this.endpoint}/items`, item);
    }

    updateItem(pn: string, item: Partial<InventoryItem>): Observable<InventoryItem> {
        return this.api.put<InventoryItem>(`${this.endpoint}/items/${pn}`, item);
    }

    // Stock Locations
    getLocations(): Observable<StockLocation[]> {
        return this.api.get<StockLocation[]>(`${this.endpoint}/locations`);
    }

    // Data Entries (Stock movements)
    getEntries(params?: {
        startDate?: string;
        endDate?: string;
        pn?: string;
        area?: string
    }): Observable<DataEntry[]> {
        return this.api.get<DataEntry[]>(`${this.endpoint}/entries`, params);
    }

    getEntry(id: number): Observable<DataEntry> {
        return this.api.get<DataEntry>(`${this.endpoint}/entries/${id}`);
    }

    createEntry(entry: Partial<DataEntry>): Observable<DataEntry> {
        return this.api.post<DataEntry>(`${this.endpoint}/entries`, entry);
    }

    // Suppliers
    getSuppliers(): Observable<Supplier[]> {
        return this.api.get<Supplier[]>(`${this.endpoint}/suppliers`);
    }

    getSupplier(id: number): Observable<Supplier> {
        return this.api.get<Supplier>(`${this.endpoint}/suppliers/${id}`);
    }

    createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
        return this.api.post<Supplier>(`${this.endpoint}/suppliers`, supplier);
    }

    updateSupplier(id: number, supplier: Partial<Supplier>): Observable<Supplier> {
        return this.api.put<Supplier>(`${this.endpoint}/suppliers/${id}`, supplier);
    }
}
