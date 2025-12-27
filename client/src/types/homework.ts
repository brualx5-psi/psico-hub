// Tipos para Sistema de Lições de Casa / Tarefas Terapêuticas

export type HomeworkCategory =
    | 'registro_pensamentos'
    | 'relaxamento'
    | 'exposicao'
    | 'ativacao_comportamental'
    | 'habilidades_sociais'
    | 'escrita_terapeutica'
    | 'outro';

export type HomeworkStatus = 'pending' | 'completed' | 'partial' | 'not_done';

export interface HomeworkTemplate {
    id: string;
    category: HomeworkCategory;
    name: string;
    description: string;
    instructions: string;
    suggestedFrequency: string;
    targetDisorders?: string[];  // panic, depression, gad, ocd, etc
}

export interface HomeworkTask {
    id: string;
    patientId: string;
    templateId?: string;          // Se veio de um template
    name: string;
    description: string;
    instructions: string;
    category: HomeworkCategory;

    // Vinculação
    linkedGASMetaId?: string;     // Meta GAS vinculada
    linkedProblemIds?: string[];  // Problemas vinculados

    // Timing
    assignedAt: string;           // Data de prescrição
    dueDate?: string;             // Prazo
    frequency?: string;           // Diário, semanal, etc
    assignedInSessionId?: string; // Sessão em que foi prescrita

    // Revisão
    status: HomeworkStatus;
    reviewedAt?: string;
    reviewedInSessionId?: string;
    completionNotes?: string;     // Observações do terapeuta
    patientFeedback?: string;     // Feedback do paciente

    // AI
    wasAISuggested?: boolean;
}

export interface HomeworkSuggestion {
    templateId?: string;
    name: string;
    description: string;
    category: HomeworkCategory;
    rationale: string;            // Por que a IA sugeriu
    linkedGASMetaId?: string;
}

// Extensão do Patient para incluir tarefas
export interface PatientHomework {
    activeTasks: HomeworkTask[];
    completedTasks: HomeworkTask[];
}
