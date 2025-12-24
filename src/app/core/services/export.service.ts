import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExportService {

    /**
     * Export data to Excel (.xlsx) file
     * @param data Array of objects to export
     * @param filename Name of the file (without extension)
     * @param sheetName Name of the Excel sheet
     */
    exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
        const workbook: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Auto-size columns based on content
        const maxWidth = 50;
        const colWidths: number[] = [];
        const headers = Object.keys(data[0]);

        // Initialize with header widths
        headers.forEach((header, i) => {
            colWidths[i] = header.length;
        });

        // Check all data for max widths
        data.forEach(row => {
            headers.forEach((header, i) => {
                const value = String(row[header] ?? '');
                colWidths[i] = Math.min(maxWidth, Math.max(colWidths[i] || 0, value.length));
            });
        });

        worksheet['!cols'] = colWidths.map(w => ({ wch: w + 2 }));

        // Generate and download file
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    /**
     * Export data to CSV file
     * @param data Array of objects to export
     * @param filename Name of the file (without extension)
     */
    exportToCsv(data: any[], filename: string): void {
        if (!data || data.length === 0) {
            console.warn('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            // Header row
            headers.join(','),
            // Data rows
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header] ?? '';
                    const stringValue = String(value);
                    // Escape quotes and wrap in quotes if contains comma, quote, or newline
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /**
     * Format a date for export
     * @param date Date to format
     * @returns Formatted date string (YYYY-MM-DD)
     */
    formatDate(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * Format a datetime for export
     * @param date Date to format
     * @returns Formatted datetime string (YYYY-MM-DD HH:mm)
     */
    formatDateTime(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return `${d.toISOString().split('T')[0]} ${d.toTimeString().slice(0, 5)}`;
    }
}
