import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ProductionService } from '../../../core/services/production.service';
import { ExportService } from '../../../core/services/export.service';
import { forkJoin } from 'rxjs';

interface MHConfiguration {
    id?: number;
    part: number;
    part_number?: string;
    production_line?: number;
    mh_per_part: number;
    headcount_target: number;
    time_per_shift: number;
    target_per_head_shift: number;
    output_target_without_control: number;
    bottleneck_cycle_time?: number;
    shift_target: number;
    real_output?: number;
    total_efficiency?: number;
    target_60min: number;
    target_50min: number;
    target_45min: number;
    target_30min: number;
    new_shift_target: number;
    dms_shift_target: number;
    gap: number;
    status: string;
}

type ProductType = 'semi_finished' | 'finished_good';

interface Part {
    id?: number;
    part_number: string;
    project: number;
    project_name?: string;
    product_type: ProductType;
    product_type_display?: string;
    zone?: number;
    zone_name?: string;
    process?: number;
    process_name?: string;
    production_line?: number;
    production_line_name?: string;
    shift_target: number;
    headcount_target?: number;
    scrap_target?: number;
    efficiency?: number;
    mh_per_part?: number;
    time_per_shift?: number;
    bottleneck_cycle_time?: number;
    // Real target values (editable, bottleneck-based)
    real_hourly_target?: number;
    real_shift_target?: number;
    real_target_per_head?: number;
    description?: string;
    material_status?: string;
    is_active: boolean;
}

interface Project {
    id: number;
    name: string;
}

interface Zone {
    id: number;
    name: string;
    code: string;
    project?: number;
}

interface Process {
    id: number;
    name: string;
    code: string;
    project: number;
}

interface ProductionLine {
    id: number;
    name: string;
    project: number;
}

@Component({
    selector: 'app-parts',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        ToggleSwitchModule,
        CardModule,
        ToolbarModule,
        TooltipModule,
        DividerModule,
        MenuModule
    ],
    template: `
        <p-toast></p-toast>
        <p-confirmDialog></p-confirmDialog>

        <div class="card">
            <p-toolbar styleClass="mb-4">
                <ng-template pTemplate="left">
                    <h2 class="m-0">
                        <i class="pi pi-box mr-2"></i>Parts Management
                    </h2>
                </ng-template>
                <ng-template pTemplate="center">
                    <div class="flex align-items-center gap-3">
                        <div class="flex align-items-center gap-2">
                            <label for="projectFilter" class="font-medium">Project:</label>
                            <p-select
                                id="projectFilter"
                                [(ngModel)]="selectedProjectFilter"
                                [options]="projects"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="All Projects"
                                [filter]="true"
                                filterPlaceholder="Search projects..."
                                [showClear]="true"
                                [virtualScroll]="true"
                                [virtualScrollItemSize]="40"
                                styleClass="w-12rem"
                                (onChange)="filterParts()">
                            </p-select>
                        </div>
                        <div class="flex align-items-center gap-2">
                            <label for="typeFilter" class="font-medium">Type:</label>
                            <p-select
                                id="typeFilter"
                                [(ngModel)]="selectedProductType"
                                [options]="productTypeFilterOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="All Types"
                                [showClear]="true"
                                styleClass="w-12rem"
                                (onChange)="filterParts()">
                            </p-select>
                        </div>
                    </div>
                </ng-template>
                <ng-template pTemplate="right">
                    <p-menu #exportMenu [model]="exportMenuItems" [popup]="true"></p-menu>
                    <p-button
                        icon="pi pi-download"
                        label="Export"
                        styleClass="p-button-outlined mr-2"
                        (onClick)="exportMenu.toggle($event)">
                    </p-button>
                    <p-button
                        label="New Part"
                        icon="pi pi-plus"
                        styleClass="p-button-success mr-2"
                        (onClick)="openNew()">
                    </p-button>
                    <p-button
                        label="Refresh"
                        icon="pi pi-refresh"
                        styleClass="p-button-outlined"
                        (onClick)="loadData()">
                    </p-button>
                </ng-template>
            </p-toolbar>

            <p-table
                [value]="filteredParts"
                [loading]="loading"
                [rowHover]="true"
                [paginator]="true"
                [rows]="10"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parts"
                dataKey="id"
                styleClass="p-datatable-sm">

                <ng-template pTemplate="header">
                    <tr>
                        <th style="width: 80px">ID</th>
                        <th pSortableColumn="part_number">Part Number <p-sortIcon field="part_number"></p-sortIcon></th>
                        <th>Type</th>
                        <th>Project</th>
                        <th>Zone</th>
                        <th>Process/Line</th>
                        <th style="width: 120px">Hourly Target</th>
                        <th style="width: 120px">Headcount Target</th>
                        <th style="width: 100px">MH per Part</th>
                        <th style="width: 140px">Bottleneck (min)</th>
                        <th style="width: 100px">Status</th>
                        <th style="width: 150px">Actions</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-part>
                    <tr>
                        <td>{{ part.id }}</td>
                        <td><strong class="text-primary">{{ part.part_number }}</strong></td>
                        <td>
                            <p-tag
                                [value]="part.product_type_display || getProductTypeLabel(part.product_type)"
                                [severity]="part.product_type === 'semi_finished' ? 'warn' : 'success'"
                                [icon]="part.product_type === 'semi_finished' ? 'pi pi-cog' : 'pi pi-check-circle'">
                            </p-tag>
                        </td>
                        <td>
                            <p-tag [value]="part.project_name || getProjectName(part.project)" severity="info"></p-tag>
                        </td>
                        <td>
                            <span *ngIf="part.zone_name">{{ part.zone_name }}</span>
                            <span *ngIf="!part.zone_name" class="text-gray-400">-</span>
                        </td>
                        <td>
                            <span *ngIf="part.product_type === 'semi_finished' && part.process_name">{{ part.process_name }}</span>
                            <span *ngIf="part.product_type === 'finished_good' && part.production_line_name">{{ part.production_line_name }}</span>
                            <span *ngIf="!part.process_name && !part.production_line_name" class="text-gray-400">-</span>
                        </td>
                        <td class="text-center font-bold">{{ part.shift_target }}</td>
                        <td class="text-center font-bold">{{ part.headcount_target || 0 }}</td>
                        <td class="text-center">{{ part.mh_per_part || '-' }}</td>
                        <td class="text-center">{{ part.bottleneck_cycle_time || '-' }}</td>
                        <td>
                            <p-tag
                                [value]="part.is_active ? 'Active' : 'Inactive'"
                                [severity]="part.is_active ? 'success' : 'danger'">
                            </p-tag>
                        </td>
                        <td>
                            <p-button
                                icon="pi pi-pencil"
                                styleClass="p-button-rounded p-button-warning p-button-text mr-1"
                                pTooltip="Edit"
                                (onClick)="editPart(part)">
                            </p-button>
                            <p-button
                                icon="pi pi-trash"
                                styleClass="p-button-rounded p-button-danger p-button-text"
                                pTooltip="Delete"
                                (onClick)="confirmDelete(part)">
                            </p-button>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="12" class="text-center p-4">
                            <i class="pi pi-inbox text-4xl text-gray-400 mb-3 block"></i>
                            <span class="text-gray-500">No parts found.</span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Create/Edit Dialog -->
        <p-dialog
            [(visible)]="partDialog"
            [style]="{width: '650px'}"
            [header]="editMode ? 'Edit Part' : 'New Part'"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <div class="form-grid">
                    <!-- Product Type - First field -->
                    <div class="form-field">
                        <label for="productType">Product Type <span class="required">*</span></label>
                        <p-select
                            id="productType"
                            [(ngModel)]="part.product_type"
                            [options]="productTypeOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select Type"
                            (onChange)="onProductTypeChange()"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.product_type}">
                        </p-select>
                        <small class="help-text">
                            <i class="pi pi-info-circle mr-1"></i>
                            <span *ngIf="part.product_type === 'semi_finished'">Semi-Finished: Linked to a Process within a Zone</span>
                            <span *ngIf="part.product_type === 'finished_good'">Finished Good: Linked to a Production Line within a Zone</span>
                        </small>
                    </div>

                    <div class="form-field">
                        <label for="partNumber">Part Number <span class="required">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="partNumber"
                            [(ngModel)]="part.part_number"
                            required
                            placeholder="e.g., PN-12345"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.part_number}" />
                        <small class="error-message" *ngIf="submitted && !part.part_number">Part number is required.</small>
                    </div>

                    <div class="form-field">
                        <label for="project">Project <span class="required">*</span></label>
                        <p-select
                            id="project"
                            [(ngModel)]="part.project"
                            [options]="projects"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Project"
                            [filter]="true"
                            filterPlaceholder="Search projects..."
                            (onChange)="onProjectChange()"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && !part.project}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && !part.project">Project is required.</small>
                    </div>

                    <!-- Zone - Required for semi-finished, optional for finished goods -->
                    <div class="form-field">
                        <label for="zone">
                            Zone
                            <span class="required" *ngIf="part.product_type === 'semi_finished'">*</span>
                        </label>
                        <p-select
                            id="zone"
                            [(ngModel)]="part.zone"
                            [options]="filteredZones"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Zone"
                            [filter]="true"
                            filterPlaceholder="Search zones..."
                            [showClear]="part.product_type !== 'semi_finished'"
                            [ngClass]="{'ng-invalid ng-dirty': submitted && part.product_type === 'semi_finished' && !part.zone}">
                            <ng-template let-zone pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ zone.code }}</strong>
                                    <span class="text-gray-500">- {{ zone.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && part.product_type === 'semi_finished' && !part.zone">
                            Zone is required for semi-finished products.
                        </small>
                    </div>

                    <!-- Process - Only for semi-finished products -->
                    <div class="form-field" *ngIf="part.product_type === 'semi_finished'">
                        <label for="process">Process <span class="required">*</span></label>
                        <p-select
                            id="process"
                            [(ngModel)]="part.process"
                            [options]="filteredProcesses"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Process"
                            [filter]="true"
                            filterPlaceholder="Search processes..."
                            [ngClass]="{'ng-invalid ng-dirty': submitted && part.product_type === 'semi_finished' && !part.process}">
                            <ng-template let-process pTemplate="item">
                                <div class="flex align-items-center gap-2">
                                    <strong>{{ process.code }}</strong>
                                    <span class="text-gray-500">- {{ process.name }}</span>
                                </div>
                            </ng-template>
                        </p-select>
                        <small class="error-message" *ngIf="submitted && part.product_type === 'semi_finished' && !part.process">
                            Process is required for semi-finished products.
                        </small>
                    </div>

                    <!-- Production Line - Only for finished goods -->
                    <div class="form-field" *ngIf="part.product_type === 'finished_good'">
                        <label for="productionLine">Production Line <span class="required">*</span></label>
                        <p-select
                            id="productionLine"
                            [(ngModel)]="part.production_line"
                            [options]="filteredProductionLines"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select Production Line"
                            [filter]="true"
                            filterPlaceholder="Search lines..."
                            [ngClass]="{'ng-invalid ng-dirty': submitted && part.product_type === 'finished_good' && !part.production_line}">
                        </p-select>
                        <small class="error-message" *ngIf="submitted && part.product_type === 'finished_good' && !part.production_line">
                            Production Line is required for finished goods.
                        </small>
                    </div>

                    <div class="form-field toggle-field">
                        <label for="isActive">Active</label>
                        <p-toggleSwitch [(ngModel)]="part.is_active" inputId="isActive"></p-toggleSwitch>
                    </div>
                </div>

                <!-- MH Configuration Section -->
                <div class="mh-section mt-4">
                    <h4 class="section-header">
                        <i class="pi pi-cog mr-2"></i>MH Configuration (Auto-Calculate Targets)
                    </h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="mhPerPart">MH per Part</label>
                            <p-inputNumber
                                id="mhPerPart"
                                [ngModel]="partMhPerPart()"
                                (ngModelChange)="onPartMhPerPartChange($event)"
                                [min]="0"
                                [step]="0.01"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="4"
                                placeholder="e.g., 0.55">
                            </p-inputNumber>
                            <small class="help-text">Man-Hours per part</small>
                        </div>

                        <div class="form-field">
                            <label for="timePerShiftHours">Time/Shift (Hours)</label>
                            <p-inputNumber
                                id="timePerShiftHours"
                                [ngModel]="partTimePerShiftHours()"
                                (ngModelChange)="onPartTimePerShiftHoursChange($event)"
                                [min]="0.1"
                                [step]="0.05"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="2"
                                placeholder="e.g., 7.75">
                            </p-inputNumber>
                            <small class="help-text">Hours per shift (e.g., 7.75h = 465 min)</small>
                        </div>

                        <div class="form-field">
                            <label for="headcountTarget">Headcount Target</label>
                            <p-inputNumber
                                id="headcountTarget"
                                [ngModel]="partHeadcountTarget()"
                                (ngModelChange)="onPartHeadcountTargetChange($event)"
                                [min]="0"
                                [showButtons]="true"
                                placeholder="e.g., 2">
                            </p-inputNumber>
                            <small class="help-text">Number of operators</small>
                        </div>

                        <div class="form-field">
                            <label for="bottleneckCycleTime">Bottleneck Cycle Time (min)</label>
                            <p-inputNumber
                                id="bottleneckCycleTime"
                                [ngModel]="partBottleneckCycleTime()"
                                (ngModelChange)="onPartBottleneckCycleTimeChange($event)"
                                [min]="0"
                                [step]="0.01"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="2"
                                placeholder="e.g., 0.27">
                            </p-inputNumber>
                            <small class="help-text">Bottleneck station cycle time in minutes</small>
                        </div>

                    </div>
                </div>

                <!-- Calculated Targets (100% Efficiency) - Read-Only Display -->
                <div class="calculated-section mt-4" *ngIf="partHeadcountTarget() > 0 && partMhPerPart() > 0">
                    <h4 class="section-header">
                        <i class="pi pi-calculator mr-2"></i>Calculated Targets (100% Efficiency)
                        <span class="text-sm font-normal text-gray-500 ml-2">(Read-only)</span>
                    </h4>
                    <div class="calculated-grid">
                        <div class="calculated-item">
                            <span class="calculated-label">Target/Head/Shift</span>
                            <span class="calculated-value">{{ partTargetPerHeadShift() | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= {{ partTimePerShift() }} ÷ {{ partMhPerPart() }}</span>
                        </div>
                        <div class="calculated-item">
                            <span class="calculated-label">Shift Target</span>
                            <span class="calculated-value">{{ partShiftTarget() | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/Head × {{ partHeadcountTarget() }}</span>
                        </div>
                        <div class="calculated-item">
                            <span class="calculated-label">Hourly Target</span>
                            <span class="calculated-value">{{ partHourlyTarget() | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Shift ÷ {{ partTimePerShiftHours() | number:'1.2-2' }}h</span>
                        </div>
                        <div class="calculated-item">
                            <span class="calculated-label">Efficiency</span>
                            <span class="calculated-value text-green-500">100%</span>
                            <span class="calculated-formula">Theoretical max</span>
                        </div>
                    </div>
                </div>

                <!-- Target With Real% Efficiency Section -->
                <div class="calculated-section mt-4" *ngIf="partBottleneckCycleTime() > 0">
                    <h4 class="section-header">
                        <i class="pi pi-percentage mr-2"></i>Target With Real% Efficiency (Bottleneck-Based)
                        <p-button
                            icon="pi pi-refresh"
                            [text]="true"
                            severity="secondary"
                            pTooltip="Recalculer depuis Bottleneck"
                            tooltipPosition="top"
                            (onClick)="recalculateRealTargetsFromBottleneck()"
                            styleClass="ml-2">
                        </p-button>
                    </h4>

                    <div class="form-grid mb-3">
                        <!-- Hourly Target (Real) - EDITABLE -->
                        <div class="form-field">
                            <label for="realHourlyTarget">Hourly Target (Real)</label>
                            <p-inputNumber
                                id="realHourlyTarget"
                                [ngModel]="partRealHourlyTargetValue()"
                                (ngModelChange)="onPartRealHourlyTargetChange($event)"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                            <small class="help-text">Formule: 60 / {{ partBottleneckCycleTime() | number:'1.2-2' }} min</small>
                        </div>

                        <!-- Shift Target (Real) - EDITABLE -->
                        <div class="form-field">
                            <label for="realShiftTarget">Shift Target (Real)</label>
                            <p-inputNumber
                                id="realShiftTarget"
                                [ngModel]="partRealShiftTargetValue()"
                                (ngModelChange)="onPartRealShiftTargetChange($event)"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                            <small class="help-text">Formule: Hourly × {{ partTimePerShiftHours() | number:'1.2-2' }}h</small>
                        </div>

                        <!-- Target/Head/Shift (Real) - EDITABLE -->
                        <div class="form-field">
                            <label for="realTargetPerHead">Target/Head/Shift (Real)</label>
                            <p-inputNumber
                                id="realTargetPerHead"
                                [ngModel]="partRealTargetPerHeadShiftValue()"
                                (ngModelChange)="onPartRealTargetPerHeadChange($event)"
                                [min]="0"
                                [showButtons]="true">
                            </p-inputNumber>
                            <small class="help-text">Formule: Shift Target / {{ partHeadcountTarget() }}</small>
                        </div>

                        <!-- Total Real Efficiency - Calculated (read-only display) -->
                        <div class="form-field">
                            <label>Total Real Efficiency</label>
                            <div class="calculated-item" style="height: 42px; display: flex; align-items: center; justify-content: center;">
                                <span class="calculated-value" [ngClass]="{
                                    'text-green-500': partRealEfficiency() >= 85,
                                    'text-orange-500': partRealEfficiency() >= 70 && partRealEfficiency() < 85,
                                    'text-red-500': partRealEfficiency() < 70
                                }">
                                    {{ partRealEfficiency() | number:'1.0-0' }}%
                                </span>
                            </div>
                            <small class="help-text">= (ST × MH) / (HC × T)</small>
                        </div>
                    </div>
                </div>

                <div class="form-field" style="margin-top: 1rem;">
                    <label for="description">Description</label>
                    <textarea
                        pInputTextarea
                        id="description"
                        [(ngModel)]="part.description"
                        rows="2"
                        placeholder="Part description (optional)">
                    </textarea>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="savePart()"></p-button>
            </ng-template>
        </p-dialog>

        <!-- MH Configuration Dialog -->
        <p-dialog
            [(visible)]="mhConfigDialog"
            [style]="{width: '750px'}"
            [header]="'MH Configuration - ' + (selectedPartForMH?.part_number || '')"
            [modal]="true"
            styleClass="p-fluid form-dialog">

            <ng-template pTemplate="content">
                <!-- Input Section -->
                <div class="form-section mb-4">
                    <h4 class="text-lg font-semibold mb-3">
                        <i class="pi pi-pencil mr-2"></i>Input Parameters
                    </h4>
                    <div class="form-grid">
                        <div class="form-field">
                            <label for="mhPerPart">MH per Part <span class="required">*</span></label>
                            <p-inputNumber
                                id="mhPerPart"
                                [(ngModel)]="mhConfig.mh_per_part"
                                [min]="0.01"
                                [step]="0.01"
                                [minFractionDigits]="2"
                                [maxFractionDigits]="4"
                                placeholder="e.g., 0.55"
                                (ngModelChange)="calculateMHValues()"
                                [ngClass]="{'ng-invalid ng-dirty': mhSubmitted && !mhConfig.mh_per_part}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="mhSubmitted && !mhConfig.mh_per_part">MH per Part is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="headcountTarget">Headcount Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="headcountTarget"
                                [(ngModel)]="mhConfig.headcount_target"
                                [min]="1"
                                [showButtons]="true"
                                placeholder="e.g., 2"
                                (ngModelChange)="calculateMHValues()"
                                [ngClass]="{'ng-invalid ng-dirty': mhSubmitted && !mhConfig.headcount_target}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="mhSubmitted && !mhConfig.headcount_target">Headcount is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="timePerShift">Time/Shift (Min) <span class="required">*</span></label>
                            <p-inputNumber
                                id="timePerShift"
                                [(ngModel)]="mhConfig.time_per_shift"
                                [min]="1"
                                [showButtons]="true"
                                placeholder="e.g., 465"
                                (ngModelChange)="calculateMHValues()"
                                [ngClass]="{'ng-invalid ng-dirty': mhSubmitted && !mhConfig.time_per_shift}">
                            </p-inputNumber>
                            <small class="error-message" *ngIf="mhSubmitted && !mhConfig.time_per_shift">Time per shift is required.</small>
                        </div>

                        <div class="form-field">
                            <label for="bottleneckCycleTime">Bottleneck Cycle Time (Sec)</label>
                            <p-inputNumber
                                id="bottleneckCycleTime"
                                [(ngModel)]="mhConfig.bottleneck_cycle_time"
                                [min]="0"
                                placeholder="Optional">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="newShiftTarget">NEW Shift Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="newShiftTarget"
                                [(ngModel)]="mhConfig.new_shift_target"
                                [min]="0"
                                placeholder="e.g., 900"
                                (ngModelChange)="calculateMHValues()"
                                [ngClass]="{'ng-invalid ng-dirty': mhSubmitted && mhConfig.new_shift_target === null}">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="dmsShiftTarget">DMS Shift Target <span class="required">*</span></label>
                            <p-inputNumber
                                id="dmsShiftTarget"
                                [(ngModel)]="mhConfig.dms_shift_target"
                                [min]="0"
                                placeholder="e.g., 900"
                                [ngClass]="{'ng-invalid ng-dirty': mhSubmitted && mhConfig.dms_shift_target === null}">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="realOutput">Real Output</label>
                            <p-inputNumber
                                id="realOutput"
                                [(ngModel)]="mhConfig.real_output"
                                [min]="0"
                                placeholder="Optional"
                                (ngModelChange)="calculateMHValues()">
                            </p-inputNumber>
                        </div>

                        <div class="form-field">
                            <label for="mhStatus">Status</label>
                            <p-select
                                id="mhStatus"
                                [(ngModel)]="mhConfig.status"
                                [options]="mhStatusOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select Status">
                            </p-select>
                        </div>
                    </div>
                </div>

                <p-divider></p-divider>

                <!-- Calculated Values Section -->
                <div class="form-section">
                    <h4 class="text-lg font-semibold mb-3">
                        <i class="pi pi-calculator mr-2"></i>Calculated Values (Auto)
                    </h4>
                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Time/Shift ÷ MH per Part">
                            <span class="calculated-label">Target/Head/Shift</span>
                            <span class="calculated-value">{{ mhConfig.target_per_head_shift | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= {{ mhConfig.time_per_shift }} ÷ {{ mhConfig.mh_per_part }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/Head/Shift × Headcount">
                            <span class="calculated-label">Output Target</span>
                            <span class="calculated-value">{{ mhConfig.output_target_without_control | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= ({{ mhConfig.time_per_shift }} ÷ {{ mhConfig.mh_per_part }}) × {{ mhConfig.headcount_target }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="= Output Target">
                            <span class="calculated-label">Shift Target</span>
                            <span class="calculated-value font-bold text-primary">{{ mhConfig.shift_target | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Output Target</span>
                        </div>
                    </div>

                    <p-divider></p-divider>

                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Shift Target ÷ (Time/Shift ÷ 60)">
                            <span class="calculated-label">Target/60min</span>
                            <span class="calculated-value">{{ mhConfig.target_60min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= {{ mhConfig.shift_target }} ÷ {{ (mhConfig.time_per_shift || 0) / 60 | number:'1.2-2' }}h</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (50/60)">
                            <span class="calculated-label">Target/50min</span>
                            <span class="calculated-value">{{ mhConfig.target_50min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 50/60</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (45/60)">
                            <span class="calculated-label">Target/45min</span>
                            <span class="calculated-value">{{ mhConfig.target_45min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 45/60</span>
                        </div>
                        <div class="calculated-item" pTooltip="Target/60min × (30/60)">
                            <span class="calculated-label">Target/30min</span>
                            <span class="calculated-value">{{ mhConfig.target_30min | number:'1.0-0' }}</span>
                            <span class="calculated-formula">= Target/60min × 30/60</span>
                        </div>
                    </div>

                    <p-divider></p-divider>

                    <div class="calculated-grid">
                        <div class="calculated-item" pTooltip="Shift Target - NEW Shift Target">
                            <span class="calculated-label">GAP</span>
                            <span class="calculated-value" [ngClass]="{'text-red-500': (mhConfig.gap || 0) > 0, 'text-green-500': (mhConfig.gap || 0) < 0}">
                                {{ mhConfig.gap | number:'1.0-0' }}
                            </span>
                            <span class="calculated-formula">= {{ mhConfig.shift_target }} - {{ mhConfig.new_shift_target }}</span>
                        </div>
                        <div class="calculated-item" pTooltip="(Shift Target × MH/Part) ÷ (Headcount × Time/Shift) × 100">
                            <span class="calculated-label">Efficiency</span>
                            <span class="calculated-value">
                                <span *ngIf="mhConfig.total_efficiency !== null && mhConfig.total_efficiency !== undefined">
                                    {{ mhConfig.total_efficiency | number:'1.0-0' }}%
                                </span>
                                <span *ngIf="mhConfig.total_efficiency === null || mhConfig.total_efficiency === undefined">-</span>
                            </span>
                            <span class="calculated-formula">= (ST × MH) ÷ (HC × T) × 100</span>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button label="Cancel" icon="pi pi-times" styleClass="p-button-text" (onClick)="hideMHDialog()"></p-button>
                <p-button label="Save" icon="pi pi-check" (onClick)="saveMHConfig()"></p-button>
            </ng-template>
        </p-dialog>
    `,
    styles: [`
        :host ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-50);
        }

        .help-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
            font-size: 0.75rem;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
        }

        .form-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .form-field label {
            font-weight: 500;
            color: var(--text-color);
        }

        .required {
            color: var(--red-500);
        }

        .error-message {
            color: var(--red-500);
            font-size: 0.75rem;
        }

        .form-section {
            background: var(--surface-50);
            padding: 1rem;
            border-radius: 8px;
        }

        .calculated-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
        }

        .calculated-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.75rem;
            background: var(--surface-0);
            border-radius: 6px;
            border: 1px solid var(--surface-200);
        }

        .calculated-label {
            font-size: 0.75rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.25rem;
        }

        .calculated-value {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-color);
        }

        .calculated-formula {
            font-size: 0.65rem;
            color: var(--text-color-secondary);
            margin-top: 0.25rem;
            font-style: italic;
            opacity: 0.8;
        }

        .mh-section,
        .calculated-section {
            background: var(--surface-50);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid var(--surface-200);
        }

        .section-header {
            font-size: 0.95rem;
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
        }

        .mh-section .help-text {
            font-size: 0.7rem;
            color: var(--text-color-secondary);
            margin-top: 0.25rem;
        }

        .mt-4 {
            margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }

            .calculated-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    `]
})
export class PartsComponent implements OnInit {
    parts: Part[] = [];
    filteredParts: Part[] = [];
    projects: Project[] = [];
    exportMenuItems: MenuItem[] = [];
    private projectsMap = new Map<number, string>();
    zones: Zone[] = [];
    processes: Process[] = [];
    productionLines: ProductionLine[] = [];
    filteredZones: Zone[] = [];
    filteredProcesses: Process[] = [];
    filteredProductionLines: ProductionLine[] = [];
    part: Partial<Part> = {};

    productTypeOptions = [
        { label: 'Semi-Finished', value: 'semi_finished' },
        { label: 'Finished Good', value: 'finished_good' }
    ];

    productTypeFilterOptions = [
        { label: 'Semi-Finished', value: 'semi_finished' },
        { label: 'Finished Good', value: 'finished_good' }
    ];

    selectedProductType: string | null = null;
    selectedProjectFilter: number | null = null;

    partDialog = false;
    editMode = false;
    submitted = false;
    loading = false;

    // MH Configuration
    mhConfigDialog = false;
    mhSubmitted = false;
    mhEditMode = false;
    selectedPartForMH: Part | null = null;
    mhConfig: Partial<MHConfiguration> = {};
    mhStatusOptions = [
        { label: 'No change', value: 'No change' },
        { label: 'Updated', value: 'Updated' },
        { label: 'New', value: 'New' },
        { label: 'Pending', value: 'Pending' }
    ];

    // Signals for Part Edit MH Configuration (reactive auto-calculation)
    // Same logic as MH Configuration dialog
    partMhPerPart = signal<number>(0.55);
    partTimePerShift = signal<number>(465);  // Stocké en minutes pour le backend
    partTimePerShiftHours = signal<number>(7.75);  // Affichage en heures pour l'utilisateur
    partHeadcountTarget = signal<number>(0);

    // Computed signals for 100% Efficiency (read-only display, not saved)
    partTargetPerHeadShift = computed(() => {
        const mhPerPart = this.partMhPerPart();
        const timePerShift = this.partTimePerShift();
        if (mhPerPart > 0) {
            return timePerShift / mhPerPart;
        }
        return 0;
    });

    partShiftTarget = computed(() => {
        const targetPerHeadShift = this.partTargetPerHeadShift();
        const headcount = this.partHeadcountTarget();
        return Math.round(targetPerHeadShift * headcount);
    });

    partHourlyTarget = computed(() => {
        const shiftTarget = this.partShiftTarget();
        const timePerShift = this.partTimePerShift();
        const hoursPerShift = timePerShift / 60;
        if (hoursPerShift > 0) {
            return Math.round(shiftTarget / hoursPerShift);
        }
        return 0;
    });

    // Signal for Bottleneck Cycle Time (in minutes)
    partBottleneckCycleTime = signal<number>(0);

    // Editable signals for Real targets (instead of computed)
    partRealHourlyTargetValue = signal<number>(0);
    partRealShiftTargetValue = signal<number>(0);
    partRealTargetPerHeadShiftValue = signal<number>(0);

    // Computed: Total Real Efficiency = (Shift Target × MH per part) / (HeadCount × Time per Shift) × 100
    // This remains computed as it should always reflect the current values
    partRealEfficiency = computed(() => {
        const shiftTarget = this.partRealShiftTargetValue();
        const mhPerPart = this.partMhPerPart();
        const headcount = this.partHeadcountTarget();
        const timePerShift = this.partTimePerShift(); // in minutes

        if (shiftTarget > 0 && headcount > 0 && timePerShift > 0) {
            const efficiency = ((shiftTarget * mhPerPart) / (headcount * timePerShift)) * 100;
            return Math.round(efficiency);
        }
        return 0;
    });

    /**
     * Recalculate Real targets from Bottleneck Cycle Time
     * Called when user clicks the refresh button or when bottleneck changes
     */
    recalculateRealTargetsFromBottleneck(): void {
        const bottleneck = this.partBottleneckCycleTime();
        if (bottleneck > 0) {
            // Hourly = 60 / Bottleneck
            const hourly = Math.round(60 / bottleneck);
            this.partRealHourlyTargetValue.set(hourly);

            // Shift = Hourly × TimePerShiftHours
            const shift = Math.round(hourly * this.partTimePerShiftHours());
            this.partRealShiftTargetValue.set(shift);

            // Target/Head = Shift / Headcount
            const headcount = this.partHeadcountTarget();
            if (headcount > 0) {
                this.partRealTargetPerHeadShiftValue.set(Math.round(shift / headcount));
            } else {
                this.partRealTargetPerHeadShiftValue.set(0);
            }
        }
    }

    /**
     * Handler for manual change of Real Hourly Target
     * Auto-recalculates Shift Target and Target/Head
     */
    onPartRealHourlyTargetChange(value: number | null): void {
        const hourly = value ?? 0;
        this.partRealHourlyTargetValue.set(hourly);
        // Auto-recalcul du Shift Target
        const shift = Math.round(hourly * this.partTimePerShiftHours());
        this.partRealShiftTargetValue.set(shift);
        // Auto-recalcul du Target/Head
        const headcount = this.partHeadcountTarget();
        if (headcount > 0) {
            this.partRealTargetPerHeadShiftValue.set(Math.round(shift / headcount));
        }
    }

    /**
     * Handler for manual change of Real Shift Target
     * Auto-recalculates Target/Head
     */
    onPartRealShiftTargetChange(value: number | null): void {
        const shift = value ?? 0;
        this.partRealShiftTargetValue.set(shift);
        // Auto-recalcul du Target/Head
        const headcount = this.partHeadcountTarget();
        if (headcount > 0) {
            this.partRealTargetPerHeadShiftValue.set(Math.round(shift / headcount));
        }
    }

    /**
     * Handler for manual change of Real Target per Head
     */
    onPartRealTargetPerHeadChange(value: number | null): void {
        this.partRealTargetPerHeadShiftValue.set(value ?? 0);
    }

    // Handler methods for signal updates (fix for PrimeNG InputNumber binding)
    onPartMhPerPartChange(value: number | null): void {
        this.partMhPerPart.set(value ?? 0.55);
    }

    onPartTimePerShiftChange(value: number | null): void {
        this.partTimePerShift.set(value ?? 465);
    }

    // Handler pour la conversion heures → minutes
    onPartTimePerShiftHoursChange(value: number | null): void {
        const hours = value ?? 7.75;
        this.partTimePerShiftHours.set(hours);
        this.partTimePerShift.set(Math.round(hours * 60)); // Conversion en minutes pour le backend
        this.recalculateRealTargetsFromBottleneck();
    }

    onPartHeadcountTargetChange(value: number | null): void {
        this.partHeadcountTarget.set(value ?? 0);
        this.recalculateRealTargetsFromBottleneck();
    }

    onPartBottleneckCycleTimeChange(value: number | null): void {
        this.partBottleneckCycleTime.set(value ?? 0);
        // Auto-recalculate Real targets when bottleneck changes
        this.recalculateRealTargetsFromBottleneck();
    }

    constructor(
        private productionService: ProductionService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private exportService: ExportService
    ) {}

    ngOnInit(): void {
        this.loadData();
        this.initExportMenu();
    }

    private initExportMenu(): void {
        this.exportMenuItems = [
            {
                label: 'Export Excel',
                icon: 'pi pi-file-excel',
                command: () => this.exportToExcel()
            },
            {
                label: 'Export CSV',
                icon: 'pi pi-file',
                command: () => this.exportToCsv()
            }
        ];
    }

    exportToExcel(): void {
        const data = this.filteredParts.map(p => ({
            ID: p.id,
            'Part Number': p.part_number,
            Type: p.product_type_display || this.getProductTypeLabel(p.product_type),
            Project: p.project_name || this.getProjectName(p.project),
            Zone: p.zone_name || '',
            'Process/Line': p.process_name || p.production_line_name || '',
            'Hourly Target': p.shift_target,
            Headcount: p.headcount_target || 0,
            'MH/Part': p.mh_per_part || '',
            'Bottleneck Cycle Time (min)': p.bottleneck_cycle_time || '',
            Status: p.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToExcel(data, `parts-export-${timestamp}`, 'Parts');
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    exportToCsv(): void {
        const data = this.filteredParts.map(p => ({
            ID: p.id,
            'Part Number': p.part_number,
            Type: p.product_type_display || this.getProductTypeLabel(p.product_type),
            Project: p.project_name || this.getProjectName(p.project),
            Zone: p.zone_name || '',
            'Process/Line': p.process_name || p.production_line_name || '',
            'Hourly Target': p.shift_target,
            Headcount: p.headcount_target || 0,
            'MH/Part': p.mh_per_part || '',
            'Bottleneck Cycle Time (min)': p.bottleneck_cycle_time || '',
            Status: p.is_active ? 'Active' : 'Inactive'
        }));
        const timestamp = new Date().toISOString().split('T')[0];
        this.exportService.exportToCsv(data, `parts-export-${timestamp}`);
        this.messageService.add({
            severity: 'success',
            summary: 'Export',
            detail: `${data.length} enregistrements exportés`
        });
    }

    loadData(): void {
        this.loading = true;

        forkJoin({
            parts: this.productionService.getParts(),
            projects: this.productionService.getProjects(),
            zones: this.productionService.getZones(),
            processes: this.productionService.getProcesses(),
            productionLines: this.productionService.getProductionLines()
        }).subscribe({
            next: (data: any) => {
                this.parts = (data.parts.results || data.parts).map((p: any) => ({
                    ...p,
                    is_active: p.material_status === 'active'
                }));
                this.projects = (data.projects.results || data.projects).map((p: any) => ({
                    id: p.id,
                    name: p.name
                }));
                // Build lookup map for O(1) access
                this.projectsMap.clear();
                this.projects.forEach(p => this.projectsMap.set(p.id, p.name));
                this.zones = (data.zones.results || data.zones).map((z: any) => ({
                    id: z.id,
                    name: z.name,
                    code: z.code,
                    project: z.project
                }));
                this.processes = (data.processes.results || data.processes).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code,
                    project: p.project
                }));
                this.productionLines = (data.productionLines.results || data.productionLines).map((pl: any) => ({
                    id: pl.id,
                    name: pl.name,
                    project: pl.project
                }));
                this.filterParts();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load parts' });
                this.loading = false;
            }
        });
    }

    filterParts(): void {
        let result = [...this.parts];

        // Filter by project
        if (this.selectedProjectFilter) {
            result = result.filter(p => p.project === this.selectedProjectFilter);
        }

        // Filter by product type
        if (this.selectedProductType) {
            result = result.filter(p => p.product_type === this.selectedProductType);
        }

        this.filteredParts = result;
    }

    getProjectName(projectId: number): string {
        return this.projectsMap.get(projectId) || 'Unknown';
    }

    getProductTypeLabel(type: string): string {
        return type === 'semi_finished' ? 'Semi-Finished' : 'Finished Good';
    }

    onProductTypeChange(): void {
        // Clear zone and process/production_line when switching product type
        if (this.part.product_type === 'finished_good') {
            this.part.process = undefined;
        } else if (this.part.product_type === 'semi_finished') {
            this.part.production_line = undefined;
        }
        this.updateFilteredOptions();
    }

    onProjectChange(): void {
        this.updateFilteredOptions();
        // Reset zone, process, and production_line when project changes
        this.part.zone = undefined;
        this.part.process = undefined;
        this.part.production_line = undefined;
    }

    updateFilteredOptions(): void {
        if (this.part.project) {
            // Filter zones by project (or show all if project not set on zone)
            this.filteredZones = this.zones.filter(z => !z.project || z.project === this.part.project);
            // Filter processes by project
            this.filteredProcesses = this.processes.filter(p => p.project === this.part.project);
            // Filter production lines by project
            this.filteredProductionLines = this.productionLines.filter(pl => pl.project === this.part.project);
        } else {
            this.filteredZones = [...this.zones];
            this.filteredProcesses = [...this.processes];
            this.filteredProductionLines = [...this.productionLines];
        }
    }

    openNew(): void {
        this.part = {
            part_number: '',
            project: undefined,
            product_type: 'finished_good',
            zone: undefined,
            process: undefined,
            production_line: undefined,
            shift_target: 0,
            headcount_target: 0,
            scrap_target: 0,
            efficiency: 100,
            mh_per_part: 0.55,
            time_per_shift: 465,
            is_active: true
        };
        // Initialize signals with default values
        this.partMhPerPart.set(0.55);
        this.partTimePerShift.set(465);
        this.partTimePerShiftHours.set(7.75);  // 465 min = 7.75h
        this.partHeadcountTarget.set(0);
        this.partBottleneckCycleTime.set(0);

        // Initialize Real target signals with 0 (no bottleneck yet)
        this.partRealHourlyTargetValue.set(0);
        this.partRealShiftTargetValue.set(0);
        this.partRealTargetPerHeadShiftValue.set(0);

        this.filteredZones = [...this.zones];
        this.filteredProcesses = [...this.processes];
        this.filteredProductionLines = [...this.productionLines];
        this.editMode = false;
        this.submitted = false;
        this.partDialog = true;
    }

    editPart(part: Part): void {
        this.part = { ...part };

        // Set default values for MH fields if not set or zero
        const mhValue = parseFloat(String(part.mh_per_part || 0));
        const timeValue = parseInt(String(part.time_per_shift || 0), 10);
        const headcountValue = parseInt(String(part.headcount_target || 0), 10);

        // Initialize signals from part data
        this.partMhPerPart.set(isNaN(mhValue) || mhValue < 0.01 ? 0.55 : mhValue);
        const minutes = isNaN(timeValue) || timeValue < 1 ? 465 : timeValue;
        this.partTimePerShift.set(minutes);
        // Convertir minutes → heures pour l'affichage (ex: 465 min → 7.75h)
        this.partTimePerShiftHours.set(parseFloat((minutes / 60).toFixed(2)));
        this.partHeadcountTarget.set(isNaN(headcountValue) ? 0 : headcountValue);

        // Initialize bottleneck cycle time from part data
        const bottleneckValue = parseFloat(String(part.bottleneck_cycle_time || 0));
        this.partBottleneckCycleTime.set(isNaN(bottleneckValue) ? 0 : bottleneckValue);

        // Initialize Real target values from saved data or recalculate from bottleneck
        const realHourly = parseFloat(String(part.real_hourly_target || 0));
        const realShift = parseFloat(String(part.real_shift_target || 0));
        const realTargetPerHead = parseFloat(String(part.real_target_per_head || 0));

        if (realHourly > 0 || realShift > 0 || realTargetPerHead > 0) {
            // Use saved values if they exist
            this.partRealHourlyTargetValue.set(isNaN(realHourly) ? 0 : realHourly);
            this.partRealShiftTargetValue.set(isNaN(realShift) ? 0 : realShift);
            this.partRealTargetPerHeadShiftValue.set(isNaN(realTargetPerHead) ? 0 : realTargetPerHead);
        } else {
            // Recalculate from bottleneck if no saved values
            this.recalculateRealTargetsFromBottleneck();
        }

        this.updateFilteredOptions();
        this.editMode = true;
        this.submitted = false;
        this.partDialog = true;
    }

    /**
     * Handle manual change of Hourly Target (when user overrides the calculated value)
     * This is kept for backward compatibility but the computed signal handles auto-calculation
     */
    onHourlyTargetManualChange(value: number): void {
        // Manual override - the user wants to set a specific value
        // Note: This won't affect the computed signal, but we store it in part for saving
        this.part.shift_target = value;
    }

    hideDialog(): void {
        this.partDialog = false;
        this.submitted = false;
    }

    savePart(): void {
        this.submitted = true;

        // Get values from Real signals (not 100% efficiency values)
        const hourlyTarget = this.partRealHourlyTargetValue();
        const efficiency = this.partRealEfficiency();

        // Basic validation
        if (!this.part.part_number || !this.part.project || hourlyTarget === 0) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        // Validate semi-finished product requirements
        if (this.part.product_type === 'semi_finished') {
            if (!this.part.zone) {
                this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Zone is required for semi-finished products' });
                return;
            }
            if (!this.part.process) {
                this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Process is required for semi-finished products' });
                return;
            }
        }

        // Validate finished goods requirements
        if (this.part.product_type === 'finished_good') {
            if (!this.part.production_line) {
                this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Production Line is required for finished goods' });
                return;
            }
        }

        // Prepare data for API with values from signals
        const partData: any = {
            ...this.part,
            material_status: this.part.is_active ? 'active' : 'inactive',
            // Use signal values for MH configuration
            mh_per_part: this.partMhPerPart(),
            time_per_shift: this.partTimePerShift(),
            headcount_target: this.partHeadcountTarget(),
            shift_target: hourlyTarget,
            efficiency: efficiency,
            bottleneck_cycle_time: this.partBottleneckCycleTime() || null,
            // Real target values (editable by user)
            real_hourly_target: this.partRealHourlyTargetValue() || null,
            real_shift_target: this.partRealShiftTargetValue() || null,
            real_target_per_head: this.partRealTargetPerHeadShiftValue() || null
        };

        // Clear unused fields before sending
        if (this.part.product_type === 'finished_good') {
            partData.process = null;
        } else if (this.part.product_type === 'semi_finished') {
            partData.production_line = null;
        }

        if (this.editMode && this.part.id) {
            this.productionService.updatePart(this.part.id, partData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part updated successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update part' });
                }
            });
        } else {
            this.productionService.createPart(partData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part created successfully' });
                    this.loadData();
                    this.hideDialog();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create part';
                    if (error.error) {
                        if (typeof error.error === 'object') {
                            const messages = Object.entries(error.error)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('; ');
                            errorMsg = messages || errorMsg;
                        } else if (error.error.detail) {
                            errorMsg = error.error.detail;
                        }
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    confirmDelete(part: Part): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${part.part_number}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.deletePart(part)
        });
    }

    deletePart(part: Part): void {
        if (!part.id) return;
        this.productionService.deletePart(part.id).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Part deleted successfully' });
                this.loadData();
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to delete' });
            }
        });
    }

    // MH Configuration Methods
    openMHConfig(part: Part): void {
        this.selectedPartForMH = part;
        this.mhSubmitted = false;

        // Try to load existing MH configuration for this part
        this.productionService.getMHConfigurations().subscribe({
            next: (data: any) => {
                const configs = data.results || data || [];
                const existingConfig = configs.find((c: any) => c.part === part.id);

                if (existingConfig) {
                    // Edit existing configuration
                    this.mhEditMode = true;
                    this.mhConfig = { ...existingConfig };
                } else {
                    // Create new configuration with defaults
                    this.mhEditMode = false;
                    this.mhConfig = {
                        part: part.id,
                        mh_per_part: 0.55,
                        headcount_target: 2,
                        time_per_shift: 465,
                        target_per_head_shift: 0,
                        output_target_without_control: 0,
                        bottleneck_cycle_time: undefined,
                        shift_target: 0,
                        real_output: undefined,
                        total_efficiency: undefined,
                        target_60min: 0,
                        target_50min: 0,
                        target_45min: 0,
                        target_30min: 0,
                        new_shift_target: 0,
                        dms_shift_target: 0,
                        gap: 0,
                        status: 'New'
                    };
                }
                this.calculateMHValues();
                this.mhConfigDialog = true;
            },
            error: () => {
                // If loading fails, create new configuration
                this.mhEditMode = false;
                this.mhConfig = {
                    part: part.id,
                    mh_per_part: 0.55,
                    headcount_target: 2,
                    time_per_shift: 465,
                    target_per_head_shift: 0,
                    output_target_without_control: 0,
                    bottleneck_cycle_time: undefined,
                    shift_target: 0,
                    real_output: undefined,
                    total_efficiency: undefined,
                    target_60min: 0,
                    target_50min: 0,
                    target_45min: 0,
                    target_30min: 0,
                    new_shift_target: 0,
                    dms_shift_target: 0,
                    gap: 0,
                    status: 'New'
                };
                this.calculateMHValues();
                this.mhConfigDialog = true;
            }
        });
    }

    hideMHDialog(): void {
        this.mhConfigDialog = false;
        this.mhSubmitted = false;
        this.selectedPartForMH = null;
    }

    calculateMHValues(): void {
        const mhPerPart = this.mhConfig.mh_per_part || 0;
        const headcount = this.mhConfig.headcount_target || 0;
        const timePerShift = this.mhConfig.time_per_shift || 0;
        const realOutput = this.mhConfig.real_output;
        const newShiftTarget = this.mhConfig.new_shift_target || 0;

        // Calculate target per head per shift (keep as float for precision)
        // Formula: time_per_shift / mh_per_part
        // Example: 465 min / 0.55 MH = 845.45 parts per head per shift
        let targetPerHeadShift = 0;
        if (mhPerPart > 0) {
            targetPerHeadShift = timePerShift / mhPerPart;
        }
        this.mhConfig.target_per_head_shift = Math.round(targetPerHeadShift);

        // Calculate output target without control (round only at final result)
        // Formula: (time_per_shift / mh_per_part) * headcount
        // Example: 465 / 0.55 * 2 = 1690.909 → 1691
        this.mhConfig.output_target_without_control = Math.round(targetPerHeadShift * headcount);

        // Shift target equals output target
        this.mhConfig.shift_target = this.mhConfig.output_target_without_control;

        // Calculate hourly targets based on shift target and time per shift
        const hoursPerShift = timePerShift / 60;
        if (hoursPerShift > 0) {
            const hourlyRate = (this.mhConfig.shift_target || 0) / hoursPerShift;
            this.mhConfig.target_60min = Math.round(hourlyRate);
            this.mhConfig.target_50min = Math.round(hourlyRate * (50 / 60));
            this.mhConfig.target_45min = Math.round(hourlyRate * (45 / 60));
            this.mhConfig.target_30min = Math.round(hourlyRate * (30 / 60));
        } else {
            this.mhConfig.target_60min = 0;
            this.mhConfig.target_50min = 0;
            this.mhConfig.target_45min = 0;
            this.mhConfig.target_30min = 0;
        }

        // Calculate efficiency
        // Formula: (shift_target * mh_per_part) / (headcount * time_per_shift) × 100
        // Round to integer for cleaner display
        if (this.mhConfig.shift_target && headcount > 0 && timePerShift > 0) {
            const efficiency = ((this.mhConfig.shift_target * mhPerPart) / (headcount * timePerShift)) * 100;
            this.mhConfig.total_efficiency = Math.round(efficiency);
        } else {
            this.mhConfig.total_efficiency = undefined;
        }

        // Calculate GAP
        this.mhConfig.gap = (this.mhConfig.shift_target || 0) - newShiftTarget;
    }

    saveMHConfig(): void {
        this.mhSubmitted = true;

        // Validation
        if (!this.mhConfig.mh_per_part || !this.mhConfig.headcount_target || !this.mhConfig.time_per_shift) {
            this.messageService.add({ severity: 'warn', summary: 'Validation Error', detail: 'Please fill all required fields' });
            return;
        }

        // Recalculate before saving
        this.calculateMHValues();

        // Prepare data
        const configData: any = {
            part: this.mhConfig.part,
            production_line: null,
            mh_per_part: this.mhConfig.mh_per_part,
            headcount_target: this.mhConfig.headcount_target,
            time_per_shift: this.mhConfig.time_per_shift,
            target_per_head_shift: this.mhConfig.target_per_head_shift,
            output_target_without_control: this.mhConfig.output_target_without_control,
            bottleneck_cycle_time: this.mhConfig.bottleneck_cycle_time || null,
            shift_target: this.mhConfig.shift_target,
            real_output: this.mhConfig.real_output || null,
            total_efficiency: this.mhConfig.total_efficiency || null,
            target_60min: this.mhConfig.target_60min,
            target_50min: this.mhConfig.target_50min,
            target_45min: this.mhConfig.target_45min,
            target_30min: this.mhConfig.target_30min,
            new_shift_target: this.mhConfig.new_shift_target || 0,
            dms_shift_target: this.mhConfig.dms_shift_target || 0,
            gap: this.mhConfig.gap,
            status: this.mhConfig.status || 'New'
        };

        if (this.mhEditMode && this.mhConfig.id) {
            this.productionService.updateMHConfiguration(this.mhConfig.id, configData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'MH Configuration updated successfully' });
                    // Sync MH values to Part
                    this.syncMHConfigToPart();
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.detail || 'Failed to update MH configuration' });
                }
            });
        } else {
            this.productionService.createMHConfiguration(configData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'MH Configuration created successfully' });
                    // Sync MH values to Part
                    this.syncMHConfigToPart();
                },
                error: (error) => {
                    let errorMsg = 'Failed to create MH configuration';
                    if (error.error) {
                        if (typeof error.error === 'object') {
                            const messages = Object.entries(error.error)
                                .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                                .join('; ');
                            errorMsg = messages || errorMsg;
                        } else if (error.error.detail) {
                            errorMsg = error.error.detail;
                        }
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                }
            });
        }
    }

    /**
     * Synchronize MH Configuration values to the Part.
     * Updates the Part with:
     * - shift_target = target_60min (Hourly Target)
     * - efficiency = total_efficiency
     * - headcount_target = headcount_target
     * - mh_per_part = mh_per_part
     * - time_per_shift = time_per_shift
     */
    private syncMHConfigToPart(): void {
        if (!this.selectedPartForMH?.id) {
            this.hideMHDialog();
            return;
        }

        const partUpdateData: any = {
            shift_target: this.mhConfig.target_60min,           // Hourly Target (e.g., 218)
            efficiency: this.mhConfig.total_efficiency ?? 100,  // Efficiency % (e.g., 100%)
            headcount_target: this.mhConfig.headcount_target,   // Headcount (e.g., 2)
            mh_per_part: this.mhConfig.mh_per_part,             // MH per Part (e.g., 0.55)
            time_per_shift: this.mhConfig.time_per_shift        // Time per Shift (e.g., 465)
        };

        this.productionService.updatePart(this.selectedPartForMH.id, partUpdateData).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Part Synchronized',
                    detail: `Part ${this.selectedPartForMH?.part_number} updated with Hourly Target: ${this.mhConfig.target_60min}, Efficiency: ${Math.round((this.mhConfig.total_efficiency ?? 100) * 100) / 100}%`
                });
                this.hideMHDialog();
                this.loadData(); // Refresh parts list to show updated values
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Part Sync Warning',
                    detail: 'MH Configuration saved but Part update failed: ' + (error.error?.detail || 'Unknown error')
                });
                this.hideMHDialog();
            }
        });
    }
}
