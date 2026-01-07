import { Injectable, inject } from '@angular/core';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, shareReplay, tap, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Employee } from '../models/employee.model';

export interface EmployeeSearchResult {
    Id_Emp: number;
    Nom_Emp: string;
    Prenom_Emp: string;
    BadgeNumber?: string;
    Picture?: string;
    Departement_Emp?: string;
    Categorie_Emp?: string;
    fullName?: string;
    searchLabel?: string;
    initials?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeSearchService {
    private readonly RECENT_KEY = 'dms_recent_employees';
    private readonly MAX_RECENT = 10;
    private readonly CACHE_TTL = 60000; // 1 minute cache

    private api = inject(ApiService);

    // Cache for search queries
    private searchCache = new Map<string, { data: Observable<EmployeeSearchResult[]>; timestamp: number }>();

    // Subject for debounced search
    private searchSubject = new Subject<string>();
    private searchResults$ = new BehaviorSubject<EmployeeSearchResult[]>([]);

    constructor() {
        // Setup debounced search pipeline
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(query => this.executeSearch(query))
        ).subscribe(results => this.searchResults$.next(results));
    }

    /**
     * Search employees with server-side filtering
     * Uses caching and returns formatted results
     */
    searchEmployees(query: string, limit = 20): Observable<EmployeeSearchResult[]> {
        if (!query || query.length < 2) {
            return of(this.getRecentlySelected());
        }

        const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
        const cached = this.searchCache.get(cacheKey);

        // Return cached if still valid
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }

        // Make API call with search and pagination
        const request$ = this.api.get<PaginatedResponse<Employee> | Employee[]>('employees', {
            search: query.trim(),
            page_size: limit
        }).pipe(
            map(response => {
                // Handle both paginated and array responses
                const employees = Array.isArray(response) ? response : response.results || [];
                return this.formatEmployees(employees);
            }),
            catchError(() => of([])),
            shareReplay({ bufferSize: 1, refCount: true })
        );

        this.searchCache.set(cacheKey, { data: request$, timestamp: Date.now() });
        return request$;
    }

    /**
     * Trigger a debounced search (use with input fields)
     */
    triggerSearch(query: string): void {
        this.searchSubject.next(query);
    }

    /**
     * Get the debounced search results observable
     */
    getSearchResults(): Observable<EmployeeSearchResult[]> {
        return this.searchResults$.asObservable();
    }

    /**
     * Execute search immediately (internal use)
     */
    private executeSearch(query: string): Observable<EmployeeSearchResult[]> {
        if (!query || query.length < 2) {
            return of(this.getRecentlySelected());
        }
        return this.searchEmployees(query);
    }

    /**
     * Get recently selected employees from localStorage
     */
    getRecentlySelected(): EmployeeSearchResult[] {
        try {
            const stored = localStorage.getItem(this.RECENT_KEY);
            if (!stored) return [];
            return JSON.parse(stored).slice(0, this.MAX_RECENT);
        } catch {
            return [];
        }
    }

    /**
     * Add an employee to recently selected list
     */
    addToRecentlySelected(employee: Employee | EmployeeSearchResult): void {
        try {
            const formatted = this.formatEmployee(employee as Employee);
            const recent = this.getRecentlySelected().filter(e => e.Id_Emp !== formatted.Id_Emp);
            recent.unshift(formatted);
            localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent.slice(0, this.MAX_RECENT)));
        } catch {
            // Silently fail if localStorage is not available
        }
    }

    /**
     * Clear recent selections
     */
    clearRecentlySelected(): void {
        try {
            localStorage.removeItem(this.RECENT_KEY);
        } catch {
            // Silently fail
        }
    }

    /**
     * Format a single employee for display
     */
    private formatEmployee(emp: Employee): EmployeeSearchResult {
        const firstName = emp.Prenom_Emp || '';
        const lastName = emp.Nom_Emp || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const badge = emp.BadgeNumber || '';

        return {
            Id_Emp: emp.Id_Emp,
            Nom_Emp: lastName,
            Prenom_Emp: firstName,
            BadgeNumber: badge,
            Picture: emp.Picture,
            Departement_Emp: emp.Departement_Emp,
            Categorie_Emp: emp.Categorie_Emp,
            fullName,
            searchLabel: badge ? `${badge} - ${fullName}` : fullName,
            initials: this.getInitials(firstName, lastName)
        };
    }

    /**
     * Format multiple employees for display
     */
    private formatEmployees(employees: Employee[]): EmployeeSearchResult[] {
        return employees.map(emp => this.formatEmployee(emp));
    }

    /**
     * Get initials from name
     */
    private getInitials(firstName: string, lastName: string): string {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}` || '?';
    }

    /**
     * Clear the search cache
     */
    clearCache(): void {
        this.searchCache.clear();
    }

    /**
     * Get employee by ID (single fetch)
     */
    getEmployeeById(id: number): Observable<Employee | null> {
        return this.api.get<Employee>(`employees/${id}`).pipe(
            catchError(() => of(null))
        );
    }
}
