// Tipos para o Modelo Eells de Formulação de Caso

export type EellsPhase =
    | 'assessment'
    | 'problemList'
    | 'mechanisms'
    | 'formulation'
    | 'treatment'
    | 'monitoring'
    | 'discharge';

export interface EellsProgress {
    assessment: number;      // 0-100
    problemList: number;     // 0-100
    mechanisms: number;      // 0-100
    formulation: number;     // 0-100
    treatment: number;       // 0-100
    monitoring: number;      // 0-100
    discharge: number;       // 0-100
    overall: number;         // 0-100 (média)
    currentPhase: EellsPhase;
}

export interface Problem {
    id: string;
    problem: string;
    frequency: string;
    severity: number;        // 0-10
    functionalImpairment: string;
    linkedPbtNodes: string[]; // IDs dos nodes PBT
    status: 'active' | 'resolved' | 'improved';
    createdAt: string;
}

export interface CoreBelief {
    id: string;
    belief: string;
    category: 'self' | 'others' | 'world';
    linkedNodes: string[];
}

export interface Goal {
    id: string;
    description: string;
    linkedProblems: string[];    // IDs dos problemas
    baseline: string;
    target: string;
    timeframe: string;
    measurableCriteria: string;
    currentProgress: number;     // 0-100
    status: 'pending' | 'in_progress' | 'almost_achieved' | 'achieved' | 'revised';
    history: GoalProgressEntry[];
    createdAt: string;
}

export interface GoalProgressEntry {
    date: string;
    progress: number;
    evidence: string;
    sessionId?: string;
}

// ============ GAS (Goal Attainment Scale) ============

export interface GASLevelDescriptions {
    minus2: string;  // Muito pior que o esperado
    minus1: string;  // Pior que o esperado
    zero: string;    // Meta esperada (baseline)
    plus1: string;   // Melhor que o esperado
    plus2: string;   // Muito melhor que o esperado
}

export interface GASEvaluation {
    id: string;
    date: string;
    level: number;           // -2 a +2
    sessionId?: string;      // Link com sessão
    notes: string;           // Observações/evidências
}

export interface GASMeta {
    id: string;
    title: string;                    // Ex: "Realizar contribuições nas reuniões"
    linkedProblems: string[];         // IDs da lista de problemas
    levels: GASLevelDescriptions;     // Descrições personalizadas
    evaluations: GASEvaluation[];     // Histórico de avaliações
    currentLevel: number;             // -2 a +2 (atual)
    status: 'active' | 'achieved' | 'revised' | 'archived';
    startDate: string;
    targetDate?: string;
    createdAt: string;
}

export interface GASPlan {
    id: string;
    title: string;                    // Ex: "Tratamento ansiedade social - 1º semestre"
    patientId: string;
    metas: GASMeta[];                 // Múltiplas metas por plano
    status: 'active' | 'completed' | 'archived';
    createdAt: string;
    updatedAt: string;
}

// ============ End GAS ============


export interface Intervention {
    id: string;
    name: string;
    type: string;               // "CBT", "Exposure", "ACT", etc
    rationale: string;
    targetNodes: string[];      // IDs dos nodes PBT
    targetGoals: string[];      // IDs das metas
    frequency: string;
    status: 'active' | 'paused' | 'completed';
    effectiveness: number;      // 0-100
    startDate: string;
    endDate?: string;
}

export interface PBTChange {
    nodeId: string;
    strengthBefore: number;
    strengthNow: number;
    change: number;
    status: 'aumentou' | 'diminuiu' | 'estavel';
}

export interface SessionWithEells {
    id: string;
    date: string;
    notes: string;
    soap: any;
    pbtNetwork: any;
    adaptation: any;

    // Novos campos Eells
    pbtChanges?: Record<string, PBTChange>;
    goalsReview?: {
        goalId: string;
        progressBefore: number;
        progressNow: number;
        evidence: string;
    }[];
}

export interface EellsFormulation {
    // Problem List Section
    problemList: {
        redFlags: string;
        chemicalDependence: boolean;
        suicidality: boolean;
        functioning: string;
    };

    // Diagnosis
    diagnosis: string;

    // Explanatory Hypothesis (Eells Core)
    explanatoryHypothesis: {
        precipitants: string;
        origins: string;
        resources: string;
        obstacles: string;
        coreHypothesis: string;
    };

    // Treatment Plan
    treatmentPlan: {
        goals: string;
        interventions: string;
    };

    // Narrative Summary
    narrative: string;

    // Metadata
    updatedAt?: string;
}

export interface EellsData {
    // 1. Assessment
    assessment: {
        anamnesisCompleted: boolean;
        anamnesisDate?: string;
        initialAssessments: {
            type: string;
            score: number;
            date: string;
        }[];
    };

    // 2. Problem List
    problemList: Problem[];

    // 3. Mechanisms
    mechanisms: {
        coreBeliefs: CoreBelief[];
        behavioralPatterns: string[];
    };

    // 4. Formulation
    formulation: EellsFormulation;

    // 5. Treatment Plan
    treatmentPlan: {
        goals: Goal[];
        interventions: Intervention[];
    };

    // 6. Progress
    progress: EellsProgress;

    // 7. PBT Network
    pbt?: {
        nodes: any[];
        edges: any[];
    };

    // 8. GAS (Goal Attainment Scale)
    gasPlans?: GASPlan[];
}
