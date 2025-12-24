import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { LayoutService } from '../../layout/service/layout.service';

@Component({
    selector: 'app-user-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        ButtonModule,
        ToggleSwitchModule,
        SelectModule,
        DividerModule,
        ToastModule,
        InputTextModule,
        PasswordModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>

        <div class="settings-container p-4">
            <h1 class="text-3xl font-bold mb-4">Settings</h1>

            <div class="grid">
                <!-- Appearance Settings -->
                <div class="col-12 md:col-6">
                    <p-card header="Appearance">
                        <div class="flex flex-column gap-4">
                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Dark Mode</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Switch between light and dark themes</p>
                                </div>
                                <p-toggleswitch
                                    [(ngModel)]="darkMode"
                                    (onChange)="toggleDarkMode()">
                                </p-toggleswitch>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Language</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Select your preferred language</p>
                                </div>
                                <p-select
                                    [(ngModel)]="selectedLanguage"
                                    [options]="languages"
                                    optionLabel="label"
                                    optionValue="value"
                                    [style]="{width: '150px'}">
                                </p-select>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Primary Color</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Choose your preferred accent color</p>
                                </div>
                                <p-select
                                    [(ngModel)]="selectedColor"
                                    [options]="colors"
                                    optionLabel="label"
                                    optionValue="value"
                                    (onChange)="onColorChange()"
                                    [style]="{width: '150px'}">
                                </p-select>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Notification Settings -->
                <div class="col-12 md:col-6">
                    <p-card header="Notifications">
                        <div class="flex flex-column gap-4">
                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Email Notifications</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Receive email updates</p>
                                </div>
                                <p-toggleswitch [(ngModel)]="emailNotifications"></p-toggleswitch>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Production Alerts</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Get notified about production issues</p>
                                </div>
                                <p-toggleswitch [(ngModel)]="productionAlerts"></p-toggleswitch>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Downtime Alerts</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Get notified when machines go down</p>
                                </div>
                                <p-toggleswitch [(ngModel)]="downtimeAlerts"></p-toggleswitch>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Security Settings -->
                <div class="col-12">
                    <p-card header="Security">
                        <div class="flex flex-column gap-4">
                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Change Password</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Update your account password</p>
                                </div>
                                <p-button
                                    label="Change Password"
                                    icon="pi pi-key"
                                    [outlined]="true"
                                    (onClick)="showChangePassword()">
                                </p-button>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Two-Factor Authentication</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Add an extra layer of security</p>
                                </div>
                                <p-button
                                    label="Configure"
                                    icon="pi pi-shield"
                                    [outlined]="true"
                                    severity="secondary"
                                    (onClick)="showTwoFactor()">
                                </p-button>
                            </div>
                        </div>
                    </p-card>
                </div>

                <!-- Data & Privacy -->
                <div class="col-12">
                    <p-card header="Data & Privacy">
                        <div class="flex flex-column gap-4">
                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Export My Data</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Download a copy of your data</p>
                                </div>
                                <p-button
                                    label="Export"
                                    icon="pi pi-download"
                                    [outlined]="true"
                                    severity="secondary"
                                    (onClick)="exportData()">
                                </p-button>
                            </div>

                            <p-divider></p-divider>

                            <div class="flex justify-content-between align-items-center py-2">
                                <div>
                                    <span class="font-semibold">Reset Preferences</span>
                                    <p class="text-color-secondary text-sm mt-1 mb-0">Reset all settings to default</p>
                                </div>
                                <p-button
                                    label="Reset"
                                    icon="pi pi-refresh"
                                    [outlined]="true"
                                    severity="warn"
                                    (onClick)="resetPreferences()">
                                </p-button>
                            </div>
                        </div>
                    </p-card>
                </div>
            </div>
        </div>
    `
})
export class UserSettingsComponent implements OnInit {
    darkMode = false;
    selectedLanguage = 'en';
    selectedColor = 'emerald';
    emailNotifications = true;
    productionAlerts = true;
    downtimeAlerts = true;

    languages = [
        { label: 'English', value: 'en' },
        { label: 'French', value: 'fr' }
    ];

    colors = [
        { label: 'Emerald', value: 'emerald' },
        { label: 'Blue', value: 'blue' },
        { label: 'Purple', value: 'purple' },
        { label: 'Amber', value: 'amber' },
        { label: 'Rose', value: 'rose' }
    ];

    constructor(
        public layoutService: LayoutService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.darkMode = this.layoutService.isDarkTheme() ?? false;
        this.selectedColor = this.layoutService.getPrimary() || 'emerald';
    }

    toggleDarkMode(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: this.darkMode }));
        this.messageService.add({
            severity: 'success',
            summary: 'Theme Updated',
            detail: this.darkMode ? 'Dark mode enabled' : 'Light mode enabled',
            life: 2000
        });
    }

    onColorChange(): void {
        this.layoutService.layoutConfig.update((state) => ({ ...state, primary: this.selectedColor }));
        this.messageService.add({
            severity: 'success',
            summary: 'Color Updated',
            detail: `Primary color changed to ${this.selectedColor}`,
            life: 2000
        });
    }

    showChangePassword(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Coming Soon',
            detail: 'Password change functionality will be available soon'
        });
    }

    showTwoFactor(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Coming Soon',
            detail: 'Two-factor authentication will be available soon'
        });
    }

    exportData(): void {
        this.messageService.add({
            severity: 'info',
            summary: 'Coming Soon',
            detail: 'Data export functionality will be available soon'
        });
    }

    resetPreferences(): void {
        this.layoutService.resetConfig();
        this.darkMode = false;
        this.selectedColor = 'emerald';
        this.emailNotifications = true;
        this.productionAlerts = true;
        this.downtimeAlerts = true;
        this.selectedLanguage = 'en';

        this.messageService.add({
            severity: 'success',
            summary: 'Preferences Reset',
            detail: 'All settings have been reset to default',
            life: 2000
        });
    }
}
