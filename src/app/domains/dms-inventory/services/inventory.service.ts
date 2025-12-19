/**
 * DMS-Inventory Service
 * Domain: Inventory & Stock Management
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    InventoryItem,
    DataEntry,
    InventoryLocation,
    StockMovement,
    InventoryStats,
    InventoryAlert
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsInventoryService {
    private readonly endpoint = 'inventory';

    constructor(private api: ApiService) {}

    // ==================== INVENTORY ITEMS ====================
    getItems(params?: {
        category?: string;
        search?: string;
        lowStock?: boolean;
    }): Observable<InventoryItem[]> {
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

    deleteItem(pn: string): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/items/${pn}`);
    }

    // ==================== DATA ENTRIES ====================
    getEntries(params?: {
        pn?: string;
        startDate?: string;
        endDate?: string;
        area?: string;
    }): Observable<DataEntry[]> {
        return this.api.get<DataEntry[]>(`${this.endpoint}/entries`, params);
    }

    getEntry(sn: string): Observable<DataEntry> {
        return this.api.get<DataEntry>(`${this.endpoint}/entries/${sn}`);
    }

    createEntry(entry: Partial<DataEntry>): Observable<DataEntry> {
        return this.api.post<DataEntry>(`${this.endpoint}/entries`, entry);
    }

    updateEntry(sn: string, entry: Partial<DataEntry>): Observable<DataEntry> {
        return this.api.put<DataEntry>(`${this.endpoint}/entries/${sn}`, entry);
    }

    // ==================== LOCATIONS ====================
    getLocations(area?: string): Observable<InventoryLocation[]> {
        const params = area ? { area } : undefined;
        return this.api.get<InventoryLocation[]>(`${this.endpoint}/locations`, params);
    }

    getLocation(id: number): Observable<InventoryLocation> {
        return this.api.get<InventoryLocation>(`${this.endpoint}/locations/${id}`);
    }

    createLocation(location: Partial<InventoryLocation>): Observable<InventoryLocation> {
        return this.api.post<InventoryLocation>(`${this.endpoint}/locations`, location);
    }

    updateLocation(id: number, location: Partial<InventoryLocation>): Observable<InventoryLocation> {
        return this.api.put<InventoryLocation>(`${this.endpoint}/locations/${id}`, location);
    }

    deleteLocation(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/locations/${id}`);
    }

    // ==================== STOCK MOVEMENTS ====================
    getMovements(params?: {
        pn?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<StockMovement[]> {
        return this.api.get<StockMovement[]>(`${this.endpoint}/movements`, params);
    }

    createMovement(movement: Partial<StockMovement>): Observable<StockMovement> {
        return this.api.post<StockMovement>(`${this.endpoint}/movements`, movement);
    }

    // ==================== STOCK OPERATIONS ====================
    stockIn(pn: string, quantity: number, location: string, reference?: string): Observable<StockMovement> {
        return this.api.post<StockMovement>(`${this.endpoint}/stock-in`, {
            pn,
            quantity,
            to_location: location,
            reference
        });
    }

    stockOut(pn: string, quantity: number, location: string, reference?: string): Observable<StockMovement> {
        return this.api.post<StockMovement>(`${this.endpoint}/stock-out`, {
            pn,
            quantity,
            from_location: location,
            reference
        });
    }

    transfer(pn: string, quantity: number, fromLocation: string, toLocation: string): Observable<StockMovement> {
        return this.api.post<StockMovement>(`${this.endpoint}/transfer`, {
            pn,
            quantity,
            from_location: fromLocation,
            to_location: toLocation
        });
    }

    // ==================== STATS & ALERTS ====================
    getStats(): Observable<InventoryStats> {
        return this.api.get<InventoryStats>(`${this.endpoint}/stats`);
    }

    getAlerts(): Observable<InventoryAlert[]> {
        return this.api.get<InventoryAlert[]>(`${this.endpoint}/alerts`);
    }

    acknowledgeAlert(id: number): Observable<InventoryAlert> {
        return this.api.put<InventoryAlert>(`${this.endpoint}/alerts/${id}`, { isAcknowledged: true });
    }

    getLowStockItems(): Observable<InventoryItem[]> {
        return this.api.get<InventoryItem[]>(`${this.endpoint}/items/low-stock`);
    }
}
