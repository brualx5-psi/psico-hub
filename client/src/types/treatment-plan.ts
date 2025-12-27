// Tipos para Sistema de Plano de Tratamento em Fases

export interface TreatmentSession {
    number: number;
    objectives: string[];
    strategies: string;
    homeworkIds?: string[]; // IDs de tarefas vinculadas
}

export interface TreatmentPhase {
    id: string;
    name: string;
    sessionRange: { start: number; end: number };
    sessions: TreatmentSession[];
}

export interface TreatmentPlan {
    id: string;
    createdAt: string;
    updatedAt: string;
    protocol: string;
    totalSessions: number;
    frequency: string;
    phases: TreatmentPhase[];
    notes?: string;
}

// Tipos para Análise Clínica gerada por IA

export interface SessionAdjustment {
    sessionNumber: number;
    focusPrincipal: string;
    objetivos: string[];
    estrategias: string[];
}

export interface ClinicalAnalysis {
    id: string;
    generatedAt: string;
    pbeTriadAnalysis?: {
        evidenceUsed: string;
        expertiseApplied: string;
        patientContextIntegration: string;
    };
    introduction: string;
    synthesis: string;
    protectionFactors: string[];
    riskFactors: string[];
    recommendation: 'maintain' | 'partial_adjust' | 'major_reformulation' | string;
    recommendationText: string;
    sessionAdjustments?: SessionAdjustment[];
    phaseAdjustments?: string;
    conclusion: string;
    references: Reference[];
}

export interface Reference {
    citation: string;
    description: string;
}

// Extensão do Patient para incluir plano de tratamento
export interface PatientTreatmentPlan {
    currentPlan?: TreatmentPlan;
    analysisHistory: ClinicalAnalysis[];
}
