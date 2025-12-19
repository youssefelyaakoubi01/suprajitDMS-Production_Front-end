/**
 * DMS-Analytics Models - Lessons Learned
 * Domain: Analytics & Reporting
 */

// ==================== LESSON LEARNED ====================
export interface LessonLearned {
    id: number;
    title: string;
    description: string;
    category: LessonCategory;
    department: string;
    project?: string;
    impact: LessonImpact;
    rootCause: string;
    lessonsLearned: string;
    recommendations: string;
    createdBy: number;
    createdByName?: string;
    createdAt: Date;
    updatedAt?: Date;
    status: LessonStatus;
    tags?: string[];
    attachments?: LessonAttachment[];
}

// ==================== LESSON ACTION ====================
export interface LessonAction {
    id: number;
    lessonId: number;
    action: string;
    responsibleId: number;
    responsibleName?: string;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'completed';
    completedDate?: Date;
    notes?: string;
}

// ==================== LESSON ATTACHMENT ====================
export interface LessonAttachment {
    id: number;
    lessonId: number;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: Date;
}

// ==================== ENUMS & TYPES ====================
export type LessonCategory = 'quality' | 'safety' | 'production' | 'maintenance' | 'process' | 'other';
export type LessonImpact = 'low' | 'medium' | 'high' | 'critical';
export type LessonStatus = 'draft' | 'pending_review' | 'approved' | 'archived';

export const LessonCategoryLabels: Record<LessonCategory, string> = {
    quality: 'Qualité',
    safety: 'Sécurité',
    production: 'Production',
    maintenance: 'Maintenance',
    process: 'Processus',
    other: 'Autre'
};

export const LessonCategoryColors: Record<LessonCategory, string> = {
    quality: '#EF4444',
    safety: '#F59E0B',
    production: '#10B981',
    maintenance: '#06B6D4',
    process: '#8B5CF6',
    other: '#6B7280'
};

export const LessonImpactLabels: Record<LessonImpact, string> = {
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    critical: 'Critique'
};

export const LessonStatusLabels: Record<LessonStatus, string> = {
    draft: 'Brouillon',
    pending_review: 'En revue',
    approved: 'Approuvé',
    archived: 'Archivé'
};

// ==================== LESSONS STATS ====================
export interface LessonsStats {
    totalLessons: number;
    lessonsByCategory: { category: LessonCategory; count: number }[];
    lessonsByImpact: { impact: LessonImpact; count: number }[];
    recentLessons: LessonLearned[];
    pendingActions: LessonAction[];
}
