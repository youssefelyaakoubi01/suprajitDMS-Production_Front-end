import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface LessonCategory {
    CategoryID: number;
    CategoryName: string;
    Description?: string;
}

export interface Lesson {
    LessonID: number;
    Title: string;
    CategoryID: number;
    Description: string;
    Problem: string;
    Solution: string;
    Impact: string;
    CreatedBy: string;
    CreatedDate: string;
    Status: string;
    Priority: string;
    Tags?: string;
}

export interface LessonAttachment {
    AttachmentID: number;
    LessonID: number;
    FileName: string;
    FileType: string;
    FileSize: number;
    FileURL: string;
    UploadedDate: string;
}

export interface LessonAction {
    ActionID: number;
    LessonID: number;
    ActionDescription: string;
    Owner: string;
    DueDate: string;
    Status: string;
    CompletionDate?: string;
    Comments?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LessonsService {
    private readonly endpoint = 'lessons';

    constructor(private api: ApiService) {}

    // Lesson Categories
    getCategories(): Observable<LessonCategory[]> {
        return this.api.get<LessonCategory[]>(`${this.endpoint}/categories`);
    }

    // Lessons
    getLessons(params?: {
        categoryId?: number;
        status?: string;
        priority?: string;
        search?: string
    }): Observable<Lesson[]> {
        return this.api.get<Lesson[]>(`${this.endpoint}/lessons`, params);
    }

    getLesson(id: number): Observable<Lesson> {
        return this.api.get<Lesson>(`${this.endpoint}/lessons/${id}`);
    }

    createLesson(lesson: Partial<Lesson>): Observable<Lesson> {
        return this.api.post<Lesson>(`${this.endpoint}/lessons`, lesson);
    }

    updateLesson(id: number, lesson: Partial<Lesson>): Observable<Lesson> {
        return this.api.put<Lesson>(`${this.endpoint}/lessons/${id}`, lesson);
    }

    deleteLesson(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/lessons/${id}`);
    }

    // Attachments
    getAttachments(lessonId: number): Observable<LessonAttachment[]> {
        return this.api.get<LessonAttachment[]>(`${this.endpoint}/attachments`, { lessonId });
    }

    uploadAttachment(lessonId: number, file: File): Observable<LessonAttachment> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('lessonId', lessonId.toString());
        return this.api.post<LessonAttachment>(`${this.endpoint}/attachments`, formData);
    }

    deleteAttachment(id: number): Observable<void> {
        return this.api.delete<void>(`${this.endpoint}/attachments/${id}`);
    }

    // Actions
    getActions(lessonId?: number): Observable<LessonAction[]> {
        const params = lessonId ? { lessonId } : undefined;
        return this.api.get<LessonAction[]>(`${this.endpoint}/actions`, params);
    }

    getAction(id: number): Observable<LessonAction> {
        return this.api.get<LessonAction>(`${this.endpoint}/actions/${id}`);
    }

    createAction(action: Partial<LessonAction>): Observable<LessonAction> {
        return this.api.post<LessonAction>(`${this.endpoint}/actions`, action);
    }

    updateAction(id: number, action: Partial<LessonAction>): Observable<LessonAction> {
        return this.api.put<LessonAction>(`${this.endpoint}/actions/${id}`, action);
    }
}
