import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    constructor(private messageService: MessageService) {}

    success(summary: string, detail?: string): void {
        this.messageService.add({
            severity: 'success',
            summary,
            detail,
            life: 3000
        });
    }

    info(summary: string, detail?: string): void {
        this.messageService.add({
            severity: 'info',
            summary,
            detail,
            life: 3000
        });
    }

    warning(summary: string, detail?: string): void {
        this.messageService.add({
            severity: 'warn',
            summary,
            detail,
            life: 5000
        });
    }

    error(summary: string, detail?: string): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
            life: 5000
        });
    }

    clear(): void {
        this.messageService.clear();
    }
}
