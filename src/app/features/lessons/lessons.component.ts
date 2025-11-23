import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

interface Lesson {
    id: number;
    title: string;
    type: 'good' | 'bad';
    description: string;
    rootCause: string;
    actions: string;
    project: string;
    createdAt: Date;
    status: 'open' | 'closed';
}

@Component({
    selector: 'app-lessons',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, ToastModule, DialogModule, InputTextModule, TextareaModule, SelectModule],
    providers: [MessageService],
    templateUrl: './lessons.component.html',
    styleUrls: ['./lessons.component.scss']
})
export class LessonsComponent implements OnInit {
    lessons: Lesson[] = [];
    showLessonDialog = false;
    types = [{ label: 'Good Practice', value: 'good' }, { label: 'Issue/Problem', value: 'bad' }];

    ngOnInit(): void {
        this.loadLessons();
    }

    loadLessons(): void {
        this.lessons = [
            { id: 1, title: 'Improved Assembly Process', type: 'good', description: 'New fixture design reduced cycle time by 15%', rootCause: 'Previous design caused operator fatigue', actions: 'Implemented new ergonomic fixture', project: 'VW Handle', createdAt: new Date(), status: 'closed' },
            { id: 2, title: 'Quality Issue - Scratches', type: 'bad', description: 'Surface scratches on finished products', rootCause: 'Worn handling equipment', actions: 'Replace handling trays weekly', project: 'HÖRMANN', createdAt: new Date(), status: 'open' },
            { id: 3, title: 'Efficient Changeover', type: 'good', description: 'SMED implementation reduced changeover from 45 to 15 minutes', rootCause: 'Applied lean principles', actions: 'Document and train all shifts', project: 'WITTE', createdAt: new Date(), status: 'closed' }
        ];
    }

    getTypeSeverity(type: string): 'success' | 'danger' {
        return type === 'good' ? 'success' : 'danger';
    }

    getTypeLabel(type: string): string {
        return type === 'good' ? 'Good Practice' : 'Issue';
    }

    openLessonDialog(): void { this.showLessonDialog = true; }
    closeLessonDialog(): void { this.showLessonDialog = false; }
}
