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

// ============ Problem List (Expandido) ============

export type ProblemDomain = 'trabalho' | 'relacionamento' | 'familia' | 'saude' | 'estudo' | 'financeiro' | 'social' | 'outro';
export type AgreementLevel = 'sim' | 'parcial' | 'nao';

export interface SharedUnderstanding {
    reviewed: boolean;              // Formulação revisada com paciente?
    agreement: AgreementLevel;      // Concordância com problemas prioritários
    notes?: string;                 // Notas de divergência (curto)
    lastReviewedAt?: string;        // ISO: YYYY-MM-DD
}

export interface Problem {
    id: string;
    problem: string;                // Descrição do problema

    // Prioridade e Foco
    priorityRank?: number;          // 1, 2, 3... (ranking de prioridade)
    isFocus?: boolean;              // É o alvo atual do tratamento?

    // Contexto (ancoragem em vida real) - todos opcionais para não criar atrito
    domains?: ProblemDomain[];      // Onde afeta: trabalho, relacionamento, etc. (default: ['outro'] na UI)
    functionalImpact?: number;      // 0-10 (impacto funcional) - clamped na UI
    triggerContext?: string;        // Quando/piora/onde (opcional)

    // Campos existentes
    frequency: string;
    severity: number;               // 0-10
    functionalImpairment: string;   // Descrição legada (manter compatibilidade)
    linkedPbtNodes: string[];       // IDs dos nodes PBT
    status: 'active' | 'resolved' | 'improved';
    createdAt: string;              // ISO: YYYY-MM-DD
    updatedAt?: string;             // ISO: YYYY-MM-DD (para rastrear edições)
}

// Acordo global da lista de problemas (vive no eellsData)
export interface ProblemListAgreement {
    sharedUnderstanding: SharedUnderstanding;
    priorityProblems: string[];     // IDs dos 2-3 problemas prioritários
    lastUpdated: string;            // ISO: YYYY-MM-DD
}

// ============ End Problem List ============

export interface CoreBelief {
    id: string;
    belief: string;
    category: 'self' | 'others' | 'world';
    linkedNodes: string[];
}

// ============ Mechanisms (Reestruturado - Eells) ============

// Item estruturado para quadrantes (cresce depois)
export interface MechanismItem {
    id: string;
    text: string;
    date?: string;       // ISO: YYYY-MM-DD (quando identificado)
    evidence?: string[]; // IDs de notas, instrumentos, etc.
}

// Links de evidência (opcional - não quebra casos antigos)
export interface EvidenceLinks {
    hasPbtNetwork?: boolean;
    hasClinicalNotes?: boolean;
    hasInstruments?: boolean;
    hasExternalSources?: boolean;
    notes?: string;
}

// Nova estrutura de Mecanismos
export interface EellsMechanisms {
    // 4 Quadrantes (estruturados + N/A com reason obrigatório)
    precipitants: MechanismItem[];
    precipitantsNA?: boolean;
    precipitantsNAReason?: string;  // Obrigatório se NA = true (min 10 chars)

    origins: MechanismItem[];
    originsNA?: boolean;
    originsNAReason?: string;

    resources: MechanismItem[];
    resourcesNA?: boolean;
    resourcesNAReason?: string;

    obstacles: MechanismItem[];
    obstaclesNA?: boolean;
    obstaclesNAReason?: string;

    // Padrões observáveis (O QUÊ a pessoa faz)
    observablePatterns: string[];   // Ex: "falta no trabalho", "evita reunião"

    // Processos mantenedores (POR QUÊ mantém o problema)
    maintainingProcesses: string[]; // Ex: "evitação experiencial", "reforço negativo"

    // Crenças nucleares
    coreBeliefs: CoreBelief[];

    // Evidências flexíveis (opcional - qualquer uma conta)
    evidenceLinks?: EvidenceLinks;

    lastUpdated?: string; // ISO: YYYY-MM-DD
}

// ============ Formulation (Reestruturado - Eells) ============

export interface EellsFormulationV2 {
    // Narrativa integradora (principal)
    explanatoryNarrative: string;   // >100 chars após trim() para contar
    caseSummary?: string;           // Resumo de 1-2 frases

    // Predições e implicações (avançado)
    testablePredictions?: string[]; // "Se X, então Y"
    treatmentImplications?: string;

    // Diagnóstico (com N/A para prudência clínica)
    primaryDiagnosis?: string;
    differentialDiagnosis?: string[];
    diagnosisNA?: boolean;
    diagnosisNAReason?: string;     // Obrigatório se NA = true (min 10 chars)

    // Flags de alerta (movido de EellsFormulation antigo)
    redFlags?: string;
    chemicalDependence?: boolean;
    suicidality?: boolean;
    functioning?: string;

    // Histórico de versões (versionamento simples)
    history?: FormulationHistoryEntry[];

    lastUpdated?: string; // ISO: YYYY-MM-DD
}

// Histórico de alterações na formulação
export interface FormulationHistoryEntry {
    id: string;
    date: string;                   // ISO: YYYY-MM-DDTHH:mm:ss
    narrative: string;              // Snapshot da narrativa
    diagnosis?: string;             // Snapshot do diagnóstico
    changeReason?: string;          // Tipo auto-detectado ou motivo manual
    changeType?: 'diagnosis_added' | 'diagnosis_removed' | 'diagnosis_modified' |
    'hypothesis_major' | 'hypothesis_minor' | 'combined' | 'update';
    optionalNote?: string;          // Nota adicional opcional para mudanças pesadas
    changedBy?: 'terapeuta' | 'ia' | 'revisao';  // Quem fez a alteração
}

// ============ End Mechanisms/Formulation ============

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

// ============ Assessment/Coleta (Expandido) ============

export type ExternalSourceType = 'prontuario' | 'familiar' | 'laudo' | 'exame' | 'escola' | 'outro';
export type ExternalSourceStatus = 'nao_aplicavel' | 'solicitado' | 'recebido' | 'revisado';
export type SourceReliability = 'alta' | 'media' | 'baixa';

export interface ExternalSource {
    id: string; // UUID gerado no front
    type: ExternalSourceType;
    who: string;                    // "Dr. João (psiquiatra)", "Mãe do paciente"
    date: string;                   // ISO: YYYY-MM-DD
    summary: string;                // Resumo do conteúdo
    consent: boolean;               // Consentimento obtido?
    reliability: SourceReliability;
    status: ExternalSourceStatus;
}

export type AssessmentFrequency = 'sessao' | 'semanal' | 'quinzenal' | 'mensal' | 'trimestral' | 'quando_indicado' | 'personalizado';

export interface AssessmentSchedule {
    // Núcleo (sempre) - instrumentos sintomáticos principais
    core: {
        instruments: string[];           // ["GAD-7", "PHQ-9"]
        frequency: AssessmentFrequency;
    };
    // Complementares (quando necessário) - aliança, funcionamento
    complementary?: {
        instruments: string[];           // ["WAI", "ORS", "SRS"]
        frequency: AssessmentFrequency;
    };
    // Tracking auxiliar para UI (não é fonte da verdade)
    tracking?: Record<string, {
        lastCompletedDate?: string;      // ISO: YYYY-MM-DD
        nextDueDate?: string;            // ISO: YYYY-MM-DD
    }>;
}

// ============ End Assessment ============

export interface EellsData {
    // 1. Assessment (Coleta)
    assessment: {
        anamnesisCompleted: boolean;
        anamnesisDate?: string; // ISO: YYYY-MM-DD

        // Fontes Externas (estruturado)
        externalSources: ExternalSource[];
        externalSourcesNA: boolean; // Não aplicável

        // Avaliações iniciais
        initialAssessments: {
            type: string;
            score: number;
            date: string; // ISO: YYYY-MM-DD
        }[];

        // Cronograma MBC
        schedule?: AssessmentSchedule;
        scheduleNA: boolean; // Não aplicável

        // Frescor da coleta
        lastUpdated?: string; // ISO: YYYY-MM-DD
    };

    // 2. Problem List
    problemList: Problem[];
    problemListAgreement?: ProblemListAgreement; // Acordo terapeuta-cliente

    // 3. Mechanisms (Nova estrutura Eells)
    mechanisms: EellsMechanisms;

    // Legado: manter para retrocompatibilidade
    mechanismsLegacy?: {
        coreBeliefs: CoreBelief[];
        behavioralPatterns: string[];
    };

    // 4. Formulation (Nova estrutura Eells)
    formulationV2: EellsFormulationV2;

    // Legado: manter para retrocompatibilidade
    formulation?: EellsFormulation;

    // 5. Treatment Plan
    treatmentPlan: {
        goals: Goal[];
        interventions: Intervention[];
        history?: TreatmentPlanHistoryEntry[];
        reviewedAt?: string;  // Última revisão formal (mesmo sem versão nova)
        lastUpdated?: string;
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

    // 9. Monitoramento Proativo (Etapa 6 Eells)
    monitoring?: MonitoringData;
}

// Histórico de revisões do Plano de Tratamento
export interface TreatmentPlanHistoryEntry {
    id: string;
    date: string;                   // ISO: YYYY-MM-DDTHH:mm:ss

    // Snapshot inteligente
    snapshot: {
        goalsCount: number;
        goalsDescriptions: string[];  // Só descrições, não o objeto inteiro
        goalsStatuses: string[];      // Status de cada meta
        interventionsCount: number;
        interventionNames: string[];
        targetNodes?: string[];       // IDs dos nodes PBT alvo
    };

    // Metadados da mudança
    changeReason: string;            // Obrigatório (min 10 chars)
    changeType: 'goal' | 'intervention' | 'both' | 'review' | 'other';
    changedBy: 'terapeuta' | 'ia' | 'revisao';
    linkedMechanismsChanged?: boolean;
}

// Motivos rápidos sugeridos para changeReason
export const TREATMENT_CHANGE_REASONS = [
    'Melhora clínica',
    'Piora clínica',
    'Nova informação',
    'Mudança de prioridade',
    'Baixa adesão',
    'Evento de vida',
    'Revisão periódica',
    'Outro'
] as const;

// ============ Monitoramento Proativo (Etapa 6) ============

// Registro de aplicação de instrumento (entidade própria)
export interface InstrumentRecord {
    id: string;
    instrumentId: string;           // ID do instrumento na INSTRUMENTS_LIBRARY
    instrumentName: string;         // Sigla: "GAD-7", "PHQ-9"
    sessionId?: string;             // Link com a sessão (se aplicado em sessão)
    date: string;                   // ISO: YYYY-MM-DD
    score: number | null;           // Score numérico (null se qualitativo)
    rawResponses?: Record<string, any>;  // Respostas brutas (opcional)
    interpretation?: string;        // Interpretação automática ou manual
    appliedBy: 'terapeuta' | 'paciente' | 'ia';
    notes?: string;                 // Observações clínicas
}

// Status de alerta para cada instrumento agendado
export type InstrumentAlertStatus = 'em_dia' | 'vence_em_breve' | 'vencido' | 'adiado' | 'nao_aplicavel';

export interface ScheduledInstrumentStatus {
    instrumentId: string;
    instrumentName: string;
    frequency: AssessmentFrequency;
    customDays?: number;            // Se frequency = 'personalizado'
    lastCompletedDate?: string;     // ISO: YYYY-MM-DD
    nextDueDate?: string;           // ISO: YYYY-MM-DD (calculado)
    alertStatus: InstrumentAlertStatus;
    daysUntilDue?: number;          // Positivo = faltam X dias, Negativo = vencido há X dias
    postponedUntil?: string;        // Se adiado, até quando
    postponeReason?: string;        // Motivo do adiamento
}

// Checklist de instrumentos para a sessão
export interface SessionInstrumentChecklist {
    sessionId: string;
    date: string;
    dueToday: ScheduledInstrumentStatus[];      // Vencidos ou vencem hoje
    optional: ScheduledInstrumentStatus[];      // "quando_indicado" ou complementares
    completed: string[];                        // IDs dos já aplicados nesta sessão
}

// Log de decisão clínica (o "cérebro" do monitoramento)
export interface DecisionLog {
    id: string;
    date: string;                   // ISO: YYYY-MM-DDTHH:mm:ss
    sessionId?: string;             // Link com a sessão

    // Dados que embasaram a decisão
    basedOn: {
        instrumentRecordIds: string[];   // IDs dos InstrumentRecord usados
        instrumentSummary: string[];     // "GAD-7: 15 (moderado)", "PHQ-9: 8 (leve)"
    };

    // Interpretação e decisão
    interpretation: string;         // "Ansiedade aumentou mas depressão estável"
    decision: string;               // "Aumentar exposição", "Adicionar técnica X"
    rationale: string;              // Motivo clínico

    // Expectativa de resultado
    outcomeToCheck: string;         // "Espero ver GAD-7 < 10 em 4 sessões"
    followUpDate?: string;          // Quando verificar

    // Rastreabilidade
    linkedProblems?: string[];      // IDs dos problemas relacionados
    linkedInterventions?: string[]; // IDs das intervenções afetadas
    createdBy: 'terapeuta' | 'ia';
}

// Comparativo temporal
export interface TemporalComparison {
    instrumentId: string;
    instrumentName: string;
    windowSessions: number;         // 2, 4, 8 sessões

    currentScore: number;
    previousScore: number;
    deltaAbsolute: number;
    deltaPercent: number;

    trend: 'melhorando' | 'estavel' | 'piorando';
    movingAverage?: number;         // Média móvel de 3 pontos
}

// Extensão do EellsData para Monitoramento
export interface MonitoringData {
    instrumentRecords: InstrumentRecord[];
    decisionLogs: DecisionLog[];
    lastChecklist?: SessionInstrumentChecklist;
    lastUpdated?: string;
}

// Helper: calcular intervalo em dias por frequência
export const FREQUENCY_DAYS: Record<AssessmentFrequency, number> = {
    'sessao': 0,           // A cada sessão (não baseado em dias)
    'semanal': 7,
    'quinzenal': 14,
    'mensal': 30,
    'trimestral': 90,
    'quando_indicado': 0,  // Não gera alerta automático
    'personalizado': 0     // Usa customDays
};

