/**
 * DMS-Analytics Lessons Learned Service
 * Domain: Analytics & Reporting
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import {
    LessonLearned,
    LessonAction,
    LessonAttachment,
    LessonsStats,
    LessonCategory,
    LessonStatus
} from '../models';

@Injectable({
    providedIn: 'root'
})
export class DmsLessonsService {
    private readonly endpoint = 'analytics';

    constructor(private api: ApiService) {}

    // ==================== LESSONS ====================
    getLessons(params?: {
        category?: LessonCategory;
        status?: LessonStatus;
        department?: string;
        search?: string;
    }): Observable<LessonLearned[]> {
        return this.api.get<LessonLearned[]>(`${this.endpoint}/lessons`, params);
    }

    getLesson(id: number): Observable<LessonLearned> {
        return this.api.get<LessonLearned>(`${this.endpoint}/lessons/${id}`);
    }

    createLesson(lesson: Partial<LessonLearned>): Observable<LessonLearned> {
        return this.api.post<LessonLearned>(`${this.endpoint}/lessons`, lesson);
    }

    updateLesson(id: number, lesson: Partial<LessonLearned>): Observable<LessonLearned> {
        return this.api.put<LessonLearned>(`${this.endpoint}/lessons/${id}`, lesson);
    }

    deleteLesson(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/lessons/${id}`);
    }

    submitForReview(id: number): Observable<LessonLearned> {
        return this.api.post<LessonLearned>(`${this.endpoint}/lessons/${id}/submit`, {});
    }

    approveLesson(id: number): Observable<LessonLearned> {
        return this.api.post<LessonLearned>(`${this.endpoint}/lessons/${id}/approve`, {});
    }

    archiveLesson(id: number): Observable<LessonLearned> {
        return this.api.post<LessonLearned>(`${this.endpoint}/lessons/${id}/archive`, {});
    }

    // ==================== ACTIONS ====================
    getLessonActions(lessonId: number): Observable<LessonAction[]> {
        return this.api.get<LessonAction[]>(`${this.endpoint}/lessons/${lessonId}/actions`);
    }

    createLessonAction(lessonId: number, action: Partial<LessonAction>): Observable<LessonAction> {
        return this.api.post<LessonAction>(`${this.endpoint}/lessons/${lessonId}/actions`, action);
    }

    updateLessonAction(lessonId: number, actionId: number, action: Partial<LessonAction>): Observable<LessonAction> {
        return this.api.put<LessonAction>(`${this.endpoint}/lessons/${lessonId}/actions/${actionId}`, action);
    }

    completeLessonAction(lessonId: number, actionId: number, notes?: string): Observable<LessonAction> {
        return this.api.post<LessonAction>(`${this.endpoint}/lessons/${lessonId}/actions/${actionId}/complete`, { notes });
    }

    deleteLessonAction(lessonId: number, actionId: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/lessons/${lessonId}/actions/${actionId}`);
    }

    // ==================== ATTACHMENTS ====================
    getLessonAttachments(lessonId: number): Observable<LessonAttachment[]> {
        return this.api.get<LessonAttachment[]>(`${this.endpoint}/lessons/${lessonId}/attachments`);
    }

    uploadAttachment(lessonId: number, file: File): Observable<LessonAttachment> {
        const formData = new FormData();
        formData.append('file', file);
        return this.api.post<LessonAttachment>(`${this.endpoint}/lessons/${lessonId}/attachments`, formData);
    }

    deleteAttachment(lessonId: number, attachmentId: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/lessons/${lessonId}/attachments/${attachmentId}`);
    }

    // ==================== STATS ====================
    getStats(): Observable<LessonsStats> {
        return this.api.get<LessonsStats>(`${this.endpoint}/lessons/stats`);
    }

    // ==================== PENDING ACTIONS ====================
    getPendingActions(responsibleId?: number): Observable<LessonAction[]> {
        const params = responsibleId ? { responsible: responsibleId } : undefined;
        return this.api.get<LessonAction[]>(`${this.endpoint}/lessons/pending-actions`, params);
    }
}
