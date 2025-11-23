import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InventoryItem, InventoryLocation } from '../../core/models';

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        TableModule,
        InputTextModule,
        ButtonModule,
        TagModule,
        ToastModule,
        DialogModule,
        InputNumberModule,
        SelectModule
    ],
    providers: [MessageService],
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
    inventoryItems: InventoryItem[] = [];
    locations: InventoryLocation[] = [];
    searchTerm = '';
    showEntryDialog = false;

    // Entry form
    newEntry = {
        PN: '',
        QTY: 0,
        BATCHNO: '',
        AREA: '',
        COMMENT: ''
    };

    constructor(private messageService: MessageService) {}

    ngOnInit(): void {
        this.loadInventoryData();
    }

    loadInventoryData(): void {
        // Mock data
        this.inventoryItems = [
            { PN: 'VW-HA-001', PNDESC: 'VW Handle Assembly Part A', UNIT: 'PCS', TOTALSTOCK: 1500, PRICE: 2.50, MinStock: 500, MaxStock: 3000 },
            { PN: 'VW-HA-002', PNDESC: 'VW Handle Assembly Part B', UNIT: 'PCS', TOTALSTOCK: 800, PRICE: 2.75, MinStock: 500, MaxStock: 2000 },
            { PN: 'HOR-001', PNDESC: 'HÖRMANN Component X', UNIT: 'PCS', TOTALSTOCK: 2200, PRICE: 3.00, MinStock: 1000, MaxStock: 5000 },
            { PN: 'WIT-001', PNDESC: 'WITTE Assembly Kit', UNIT: 'KIT', TOTALSTOCK: 350, PRICE: 15.00, MinStock: 200, MaxStock: 800 },
            { PN: 'GRM-001', PNDESC: 'Grammer Seat Cover', UNIT: 'PCS', TOTALSTOCK: 450, PRICE: 45.00, MinStock: 300, MaxStock: 1000 }
        ];

        this.locations = [
            { Id_Location: 1, Name_Location: 'Warehouse A', Code_Location: 'WH-A', Area: 'Main', Capacity: 10000 },
            { Id_Location: 2, Name_Location: 'Warehouse B', Code_Location: 'WH-B', Area: 'Secondary', Capacity: 5000 },
            { Id_Location: 3, Name_Location: 'Production Floor', Code_Location: 'PF-1', Area: 'Production', Capacity: 2000 }
        ];
    }

    get filteredItems(): InventoryItem[] {
        if (!this.searchTerm) return this.inventoryItems;
        const term = this.searchTerm.toLowerCase();
        return this.inventoryItems.filter(item =>
            item.PN.toLowerCase().includes(term) ||
            item.PNDESC.toLowerCase().includes(term)
        );
    }

    getStockStatus(item: InventoryItem): 'success' | 'warn' | 'danger' {
        if (!item.MinStock) return 'success';
        if (item.TOTALSTOCK <= item.MinStock) return 'danger';
        if (item.TOTALSTOCK <= item.MinStock * 1.5) return 'warn';
        return 'success';
    }

    getStockLabel(item: InventoryItem): string {
        const status = this.getStockStatus(item);
        if (status === 'danger') return 'Low Stock';
        if (status === 'warn') return 'Warning';
        return 'OK';
    }

    openEntryDialog(): void {
        this.showEntryDialog = true;
    }

    closeEntryDialog(): void {
        this.showEntryDialog = false;
        this.resetEntryForm();
    }

    saveEntry(): void {
        if (!this.newEntry.PN || this.newEntry.QTY <= 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill in required fields'
            });
            return;
        }

        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Stock entry saved successfully'
        });
        this.closeEntryDialog();
    }

    resetEntryForm(): void {
        this.newEntry = { PN: '', QTY: 0, BATCHNO: '', AREA: '', COMMENT: '' };
    }

    getTotalValue(): number {
        return this.inventoryItems.reduce((sum, item) => sum + (item.TOTALSTOCK * item.PRICE), 0);
    }

    getLowStockCount(): number {
        return this.inventoryItems.filter(item => item.TOTALSTOCK <= 500).length;
    }
}
