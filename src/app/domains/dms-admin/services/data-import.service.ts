/**
 * Data Import Service
 * Domain: DMS-Admin
 *
 * Handles Excel data import operations
 * Endpoint: /api/import/
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@core/services/api.service';
import {
    ImportStatus,
    ImportMapping,
    PreviewData,
    ValidationResult,
    ImportResult,
    SequenceImportResult,
    ImportModule,
    getMappingsByModule,
    UploadResult,
    FileListResult,
    DeleteFileResult
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DataImportService {
    private readonly endpoint = 'import';

    constructor(private api: ApiService) {}

    // ==================== STATUS & DISCOVERY ====================

    /**
     * Get the current status of available import files and mappings
     */
    getStatus(): Observable<ImportStatus> {
        return this.api.get<ImportStatus>(`${this.endpoint}/status`);
    }

    /**
     * List all available import mappings with their configurations
     */
    getMappings(): Observable<ImportMapping[]> {
        return this.api.get<ImportMapping[]>(`${this.endpoint}/mappings`);
    }

    /**
     * Get detailed information about a specific mapping
     */
    getMappingDetails(name: string): Observable<ImportMapping> {
        return this.api.get<ImportMapping>(`${this.endpoint}/mappings/${name}`);
    }

    // ==================== PREVIEW ====================

    /**
     * Preview Excel file contents without importing
     * @param mappingName Name of the mapping to preview
     * @param limit Maximum number of rows to return (default: 10)
     */
    preview(mappingName: string, limit = 10): Observable<PreviewData> {
        return this.api.get<PreviewData>(`${this.endpoint}/preview`, {
            mapping_name: mappingName,
            limit
        });
    }

    // ==================== VALIDATION ====================

    /**
     * Validate import data without actually importing
     * @param mappingName Optional mapping name (validates all if not provided)
     */
    validate(mappingName?: string): Observable<ValidationResult> {
        const body: Record<string, unknown> = {};
        if (mappingName) {
            body['mapping_name'] = mappingName;
        }
        return this.api.post<ValidationResult>(`${this.endpoint}/validate`, body);
    }

    // ==================== IMPORT EXECUTION ====================

    /**
     * Execute the import process
     * @param mappingName Optional mapping name (imports all if not provided)
     * @param dryRun If true, validates only without committing to database
     */
    runImport(mappingName?: string, dryRun = false): Observable<ImportResult> {
        const body: Record<string, unknown> = { dry_run: dryRun };
        if (mappingName) {
            body['mapping_name'] = mappingName;
        }
        return this.api.post<ImportResult>(`${this.endpoint}/run`, body);
    }

    /**
     * Import data in correct order respecting foreign key dependencies
     * @param mappings Optional array of mapping names (uses default order if not provided)
     * @param stopOnError If true, stops on first error
     * @param dryRun If true, validates only without committing to database
     */
    runSequenceImport(
        mappings?: string[],
        stopOnError = false,
        dryRun = false
    ): Observable<SequenceImportResult> {
        const body: Record<string, unknown> = {
            stop_on_error: stopOnError,
            dry_run: dryRun
        };
        if (mappings && mappings.length > 0) {
            body['mappings'] = mappings;
        }
        return this.api.post<SequenceImportResult>(`${this.endpoint}/run/sequence`, body);
    }

    // ==================== MODULE-SPECIFIC HELPERS ====================

    /**
     * Get status filtered by module
     */
    getStatusByModule(module: ImportModule): Observable<ImportStatus> {
        return this.getStatus().pipe(
            map(status => {
                if (module === 'all') return status;

                const moduleMappings = getMappingsByModule(module);
                return {
                    available_files: status.available_files,
                    mappings: status.mappings.filter(
                        m => moduleMappings.includes(m.name)
                    )
                };
            })
        );
    }

    /**
     * Run import for a specific module
     */
    runModuleImport(module: ImportModule, dryRun = false): Observable<SequenceImportResult> {
        const mappings = getMappingsByModule(module);
        return this.runSequenceImport(mappings, false, dryRun);
    }

    /**
     * Validate all mappings for a specific module
     */
    validateModule(module: ImportModule): Observable<ValidationResult[]> {
        const mappings = getMappingsByModule(module);
        // Sequential validation of all mappings in the module
        return new Observable(subscriber => {
            const results: ValidationResult[] = [];
            let index = 0;

            const validateNext = () => {
                if (index >= mappings.length) {
                    subscriber.next(results);
                    subscriber.complete();
                    return;
                }

                this.validate(mappings[index]).subscribe({
                    next: result => {
                        results.push(result);
                        index++;
                        validateNext();
                    },
                    error: err => subscriber.error(err)
                });
            };

            validateNext();
        });
    }

    // ==================== FILE MANAGEMENT ====================

    /**
     * Upload an Excel file to the import directory
     * @param file The file to upload
     */
    uploadFile(file: File): Observable<UploadResult> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.postFormData<UploadResult>(`${this.endpoint}/upload/`, formData);
    }

    /**
     * List all Excel files in the import directory
     */
    listFiles(): Observable<FileListResult> {
        return this.api.get<FileListResult>(`${this.endpoint}/files/`);
    }

    /**
     * Delete a file from the import directory
     * @param filename Name of the file to delete
     */
    deleteFile(filename: string): Observable<DeleteFileResult> {
        return this.api.delete<DeleteFileResult>(`${this.endpoint}/files/${encodeURIComponent(filename)}/`);
    }
}
