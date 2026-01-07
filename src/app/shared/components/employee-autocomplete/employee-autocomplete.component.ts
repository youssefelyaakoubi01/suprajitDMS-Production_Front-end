import { Component, Input, Output, EventEmitter, forwardRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { EmployeeSearchService, EmployeeSearchResult } from '../../../core/services/employee-search.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-employee-autocomplete',
    standalone: true,
    imports: [CommonModule, FormsModule, AutoCompleteModule, AvatarModule, ChipModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => EmployeeAutocompleteComponent),
            multi: true
        }
    ],
    template: `
        <p-autoComplete
            [(ngModel)]="selectedEmployee"
            [suggestions]="suggestions"
            (completeMethod)="search($event)"
            (onSelect)="onSelect($event)"
            (onClear)="onClear()"
            (onFocus)="onFocus()"
            [virtualScroll]="virtualScroll"
            [virtualScrollItemSize]="48"
            [delay]="300"
            [minLength]="minLength"
            [forceSelection]="forceSelection"
            [optionLabel]="displayField"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [inputStyleClass]="inputStyleClass"
            [styleClass]="styleClass"
            [panelStyleClass]="'employee-autocomplete-panel'"
            [showClear]="showClear"
            [appendTo]="appendTo"
            [inputId]="inputId"
            [dropdown]="showDropdown"
            [dropdownIcon]="'pi pi-chevron-down'">

            <ng-template let-emp pTemplate="item">
                <div class="employee-item">
                    <p-avatar
                        *ngIf="emp.Picture; else initialsAvatar"
                        [image]="getImageUrl(emp.Picture)"
                        shape="circle"
                        size="normal">
                    </p-avatar>
                    <ng-template #initialsAvatar>
                        <p-avatar
                            [label]="emp.initials"
                            shape="circle"
                            size="normal"
                            [style]="{'background-color': '#3B82F6', 'color': 'white'}">
                        </p-avatar>
                    </ng-template>
                    <div class="employee-details">
                        <div class="employee-name">{{ emp.fullName }}</div>
                        <div class="employee-meta">
                            <span *ngIf="emp.BadgeNumber" class="badge-number">{{ emp.BadgeNumber }}</span>
                            <span *ngIf="emp.Departement_Emp" class="department">{{ emp.Departement_Emp }}</span>
                        </div>
                    </div>
                </div>
            </ng-template>

            <ng-template pTemplate="selectedItem" let-emp>
                <div class="selected-employee" *ngIf="emp">
                    <p-avatar
                        *ngIf="emp.Picture; else selectedInitials"
                        [image]="getImageUrl(emp.Picture)"
                        shape="circle"
                        size="normal">
                    </p-avatar>
                    <ng-template #selectedInitials>
                        <p-avatar
                            [label]="emp.initials"
                            shape="circle"
                            size="normal"
                            [style]="{'background-color': '#3B82F6', 'color': 'white'}">
                        </p-avatar>
                    </ng-template>
                    <span class="selected-name">{{ emp.fullName }}</span>
                </div>
            </ng-template>

            <ng-template pTemplate="header" *ngIf="showRecentHeader">
                <div class="autocomplete-header" *ngIf="isShowingRecent">
                    <i class="pi pi-clock"></i>
                    <span>Recent</span>
                </div>
            </ng-template>

            <ng-template pTemplate="empty">
                <div class="no-results">
                    <i class="pi pi-search"></i>
                    <span>{{ emptyMessage }}</span>
                </div>
            </ng-template>
        </p-autoComplete>
    `,
    styles: [`
        :host {
            display: block;
            width: 100%;
        }

        :host ::ng-deep .p-autocomplete {
            width: 100%;
        }

        :host ::ng-deep .p-autocomplete-input {
            width: 100%;
        }

        .employee-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px 0;
        }

        .employee-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .employee-name {
            font-weight: 500;
            color: var(--text-color);
        }

        .employee-meta {
            display: flex;
            gap: 8px;
            font-size: 0.85rem;
            color: var(--text-color-secondary);
        }

        .badge-number {
            font-family: monospace;
            background: var(--surface-100);
            padding: 0 4px;
            border-radius: 4px;
        }

        .selected-employee {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .selected-name {
            font-weight: 500;
        }

        .autocomplete-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            color: var(--text-color-secondary);
            font-size: 0.85rem;
            border-bottom: 1px solid var(--surface-border);
        }

        .no-results {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px;
            color: var(--text-color-secondary);
        }
    `]
})
export class EmployeeAutocompleteComponent implements OnInit, OnDestroy, ControlValueAccessor {
    private searchService = inject(EmployeeSearchService);
    private destroy$ = new Subject<void>();

    // Inputs
    @Input() placeholder = 'Search employee by name or badge...';
    @Input() minLength = 2;
    @Input() forceSelection = true;
    @Input() showClear = true;
    @Input() disabled = false;
    @Input() appendTo = 'body';
    @Input() inputId = '';
    @Input() displayField = 'searchLabel';
    @Input() inputStyleClass = '';
    @Input() styleClass = '';
    @Input() emptyMessage = 'No employees found';
    @Input() showRecentHeader = true;
    @Input() showDropdown = false;
    @Input() virtualScroll = true;
    @Input() returnFullObject = false; // If true, emit full object; if false, emit Id_Emp only

    // Outputs
    @Output() employeeSelected = new EventEmitter<EmployeeSearchResult>();
    @Output() employeeCleared = new EventEmitter<void>();

    // Internal state
    suggestions: EmployeeSearchResult[] = [];
    selectedEmployee: EmployeeSearchResult | null = null;
    isShowingRecent = false;

    // ControlValueAccessor
    private onChange: (value: number | EmployeeSearchResult | null) => void = () => {};
    private onTouched: () => void = () => {};

    ngOnInit(): void {
        // Pre-load recent selections for better UX
        this.suggestions = this.searchService.getRecentlySelected();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    search(event: AutoCompleteCompleteEvent): void {
        const query = event.query?.trim() || '';

        if (query.length < this.minLength) {
            // Show recent selections when query is too short
            this.suggestions = this.searchService.getRecentlySelected();
            this.isShowingRecent = true;
            return;
        }

        this.isShowingRecent = false;
        this.searchService.searchEmployees(query)
            .pipe(takeUntil(this.destroy$))
            .subscribe(results => {
                this.suggestions = results;
            });
    }

    onFocus(): void {
        // Show recent selections on focus if no selection
        if (!this.selectedEmployee) {
            this.suggestions = this.searchService.getRecentlySelected();
            this.isShowingRecent = true;
        }
    }

    onSelect(event: AutoCompleteSelectEvent): void {
        const employee = event.value as EmployeeSearchResult;
        this.selectedEmployee = employee;

        // Add to recent selections
        this.searchService.addToRecentlySelected(employee);

        // Emit event
        this.employeeSelected.emit(employee);

        // Update form value
        const value = this.returnFullObject ? employee : employee.Id_Emp;
        this.onChange(value);
        this.onTouched();
    }

    onClear(): void {
        this.selectedEmployee = null;
        this.employeeCleared.emit();
        this.onChange(null);
        this.onTouched();
    }

    getImageUrl(picture: string): string {
        if (!picture) return '';
        if (picture.startsWith('http') || picture.startsWith('assets/')) {
            return picture;
        }
        return `${environment.mediaUrl}/${picture}`;
    }

    // ControlValueAccessor implementation
    writeValue(value: number | EmployeeSearchResult | null): void {
        if (value === null || value === undefined) {
            this.selectedEmployee = null;
            return;
        }

        if (typeof value === 'object') {
            // Full object passed
            this.selectedEmployee = value;
        } else if (typeof value === 'number') {
            // Only ID passed - need to fetch or find in suggestions
            const found = this.suggestions.find(e => e.Id_Emp === value);
            if (found) {
                this.selectedEmployee = found;
            } else {
                // Fetch employee by ID
                this.searchService.getEmployeeById(value)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe(emp => {
                        if (emp) {
                            this.selectedEmployee = {
                                Id_Emp: emp.Id_Emp,
                                Nom_Emp: emp.Nom_Emp,
                                Prenom_Emp: emp.Prenom_Emp,
                                BadgeNumber: emp.BadgeNumber,
                                Picture: emp.Picture,
                                Departement_Emp: emp.Departement_Emp,
                                Categorie_Emp: emp.Categorie_Emp,
                                fullName: `${emp.Prenom_Emp} ${emp.Nom_Emp}`.trim(),
                                searchLabel: emp.BadgeNumber
                                    ? `${emp.BadgeNumber} - ${emp.Prenom_Emp} ${emp.Nom_Emp}`
                                    : `${emp.Prenom_Emp} ${emp.Nom_Emp}`,
                                initials: `${emp.Prenom_Emp?.charAt(0) || ''}${emp.Nom_Emp?.charAt(0) || ''}`.toUpperCase()
                            };
                        }
                    });
            }
        }
    }

    registerOnChange(fn: (value: number | EmployeeSearchResult | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
