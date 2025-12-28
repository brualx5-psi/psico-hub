import { Patient } from '../types/patient';
import { EellsProgress, EellsPhase } from '../types/eells';

/**
 * Calcula o progresso de cada fase do modelo Eells
 */
export function calculateEellsProgress(patient: Patient): EellsProgress {
    const progress: EellsProgress = {
        assessment: 0,
        problemList: 0,
        mechanisms: 0,
        formulation: 0,
        treatment: 0,
        monitoring: 0,
        discharge: 0,
        overall: 0,
        currentPhase: 'assessment'
    };

    // 1. ASSESSMENT (0-100%) - Nova lógica com N/A
    let assessmentScore = 0;
    const eellsAssessment = (patient as any).eellsData?.assessment;

    // 30% - Anamnese preenchida
    if (patient.clinicalRecords.anamnesis.content) {
        assessmentScore += 30;
    }

    // 20% - Fontes externas (ou N/A)
    if (eellsAssessment?.externalSourcesNA ||
        (eellsAssessment?.externalSources?.length > 0)) {
        assessmentScore += 20;
    }

    // 30% - Avaliação inicial
    if (patient.clinicalRecords.assessments.length > 0) {
        assessmentScore += 30;
    }

    // 20% - Cronograma definido com frequência (ou N/A)
    const hasValidSchedule = eellsAssessment?.schedule?.core?.instruments?.length > 0
        && eellsAssessment?.schedule?.core?.frequency;
    if (eellsAssessment?.scheduleNA || hasValidSchedule) {
        assessmentScore += 20;
    }

    progress.assessment = assessmentScore;

    // 2. PROBLEM LIST (0-100%) - Nova lógica com prioridade e acordo
    let problemListScore = 0;
    const eellsData = (patient as any).eellsData;
    const problems = eellsData?.problemList || [];
    const activeProblems = problems.filter((p: any) => p.status === 'active');

    // 40% - Ter problemas ativos identificados
    if (activeProblems.length > 0) {
        problemListScore += 40;
    }

    // 30% - Ter prioridades coerentes:
    // - pelo menos 1 problema com priorityRank
    // - sem ranks duplicados entre problemas ativos
    // - pelo menos 1 isFocus OU menor rank é automaticamente foco
    const rankedProblems = activeProblems.filter((p: any) => p.priorityRank != null);
    const ranks = rankedProblems.map((p: any) => p.priorityRank);
    const uniqueRanks = new Set(ranks);
    const noDuplicateRanks = ranks.length === uniqueRanks.size;
    const hasFocus = activeProblems.some((p: any) => p.isFocus);

    const hasValidPriorities = rankedProblems.length > 0 && noDuplicateRanks && (hasFocus || rankedProblems.length > 0);
    if (hasValidPriorities) {
        problemListScore += 30;
    }

    // 30% - Acordo terapeuta-cliente revisado
    const agreement = eellsData?.problemListAgreement?.sharedUnderstanding;
    if (agreement?.reviewed && agreement?.agreement) {
        problemListScore += 30;
    }

    progress.problemList = problemListScore;

    // 3. MECHANISMS (0-100%) - Nova lógica com 4 quadrantes + processos + evidência
    let mechanismsScore = 0;
    const mechanisms = eellsData?.mechanisms;

    // 40% - Quadrantes com pelo menos 1 item cada OU N/A justificado (min 10 chars)
    const checkQuadrant = (items: any[], na?: boolean, reason?: string) => {
        if (items?.length > 0) return true;
        if (na && reason?.trim()?.length >= 10) return true;
        return false;
    };

    const precipitantsOk = checkQuadrant(mechanisms?.precipitants, mechanisms?.precipitantsNA, mechanisms?.precipitantsNAReason);
    const originsOk = checkQuadrant(mechanisms?.origins, mechanisms?.originsNA, mechanisms?.originsNAReason);
    const resourcesOk = checkQuadrant(mechanisms?.resources, mechanisms?.resourcesNA, mechanisms?.resourcesNAReason);
    const obstaclesOk = checkQuadrant(mechanisms?.obstacles, mechanisms?.obstaclesNA, mechanisms?.obstaclesNAReason);

    if (precipitantsOk && originsOk && resourcesOk && obstaclesOk) {
        mechanismsScore += 40;
    }

    // 30% - maintainingProcesses.length > 0 E (coreBeliefs.length > 0 OU observablePatterns.length > 0)
    const hasProcesses = mechanisms?.maintainingProcesses?.length > 0;
    const hasBeliefsOrPatterns = (mechanisms?.coreBeliefs?.length > 0) || (mechanisms?.observablePatterns?.length > 0);
    if (hasProcesses && hasBeliefsOrPatterns) {
        mechanismsScore += 30;
    }

    // 30% - Qualquer evidência vinculada (PBT OU notas OU instrumentos OU fontes externas)
    const hasPBT = patient.clinicalRecords.sessions.some(s => s.pbtNetwork?.nodes?.length > 0);
    const evidenceLinks = mechanisms?.evidenceLinks;
    const hasAnyEvidence = hasPBT || evidenceLinks?.hasPbtNetwork || evidenceLinks?.hasClinicalNotes ||
        evidenceLinks?.hasInstruments || evidenceLinks?.hasExternalSources;
    if (hasAnyEvidence) {
        mechanismsScore += 30;
    }

    progress.mechanisms = mechanismsScore;

    // 4. FORMULATION (0-100%) - Narrativa + Diagnóstico
    let formulationScore = 0;
    const formulationV2 = eellsData?.formulationV2;

    // 50% - explanatoryNarrative com trim().length > 100
    if (formulationV2?.explanatoryNarrative?.trim()?.length > 100) {
        formulationScore += 50;
    }

    // 50% - Diagnóstico preenchido OU N/A justificado (min 10 chars)
    const hasDiagnosis = formulationV2?.primaryDiagnosis?.trim()?.length > 0;
    const diagnosisNAValid = formulationV2?.diagnosisNA && formulationV2?.diagnosisNAReason?.trim()?.length >= 10;
    if (hasDiagnosis || diagnosisNAValid) {
        formulationScore += 50;
    }

    progress.formulation = formulationScore;

    // 5. TREATMENT (0-100%)
    let treatmentScore = 0;
    const goals = eellsData?.treatmentPlan?.goals || [];
    const interventions = eellsData?.treatmentPlan?.interventions || [];

    if (goals.length > 0) treatmentScore += 30;
    if (interventions.length > 0) treatmentScore += 30;

    const goalsWithProgress = goals.filter((g: any) => g.currentProgress > 0);
    if (goalsWithProgress.length > 0) {
        treatmentScore += 40;
    }
    progress.treatment = treatmentScore;

    // 6. MONITORING (0-100%)
    let monitoringScore = 0;
    const sessions = patient.clinicalRecords.sessions.length;
    if (sessions >= 3) monitoringScore += 50;

    // Reavaliações periódicas
    const hasReassessments = patient.clinicalRecords.assessments.length > 1;
    if (hasReassessments) monitoringScore += 50;
    progress.monitoring = monitoringScore;

    // 7. DISCHARGE (0-100%)
    let dischargeScore = 0;
    const goalsAchieved = goals.filter((g: any) => g.currentProgress >= 80);
    if (goals.length > 0 && goalsAchieved.length === goals.length) {
        dischargeScore += 40;
    }

    const dischargeCriteria = patient.clinicalRecords.dischargeCriteria || [];
    const criteriaAchieved = dischargeCriteria.filter(c => c.status === 'achieved');
    if (dischargeCriteria.length > 0 && criteriaAchieved.length === dischargeCriteria.length) {
        dischargeScore += 40;
    }

    // Plano de prevenção de recaída (hipotético por enquanto)
    if (dischargeScore >= 80) dischargeScore += 20;

    progress.discharge = dischargeScore;

    // OVERALL (média)
    const phases = [
        progress.assessment,
        progress.problemList,
        progress.mechanisms,
        progress.formulation,
        progress.treatment,
        progress.monitoring,
        progress.discharge
    ];
    progress.overall = Math.round(phases.reduce((a, b) => a + b, 0) / 7);

    // Determina fase atual (primeira não completa)
    if (progress.assessment < 100) progress.currentPhase = 'assessment';
    else if (progress.problemList < 100) progress.currentPhase = 'problemList';
    else if (progress.mechanisms < 100) progress.currentPhase = 'mechanisms';
    else if (progress.formulation < 100) progress.currentPhase = 'formulation';
    else if (progress.treatment < 100) progress.currentPhase = 'treatment';
    else if (progress.monitoring < 100) progress.currentPhase = 'monitoring';
    else progress.currentPhase = 'discharge';

    return progress;
}

/**
 * Retorna a próxima ação recomendada baseada no progresso
 */
export function getNextRecommendedAction(patient: Patient): string {
    const progress = calculateEellsProgress(patient);

    if (progress.assessment < 100) {
        const eellsAssessment = (patient as any).eellsData?.assessment;

        if (!patient.clinicalRecords.anamnesis.content) {
            return 'Preencher Anamnese estruturada';
        }

        const hasExternalSources = eellsAssessment?.externalSourcesNA ||
            (eellsAssessment?.externalSources?.length > 0);
        if (!hasExternalSources) {
            return 'Registrar fontes externas (ou marcar N/A)';
        }

        if (patient.clinicalRecords.assessments.length === 0) {
            return 'Aplicar avaliação inicial (GAD-7, PHQ-9, etc)';
        }

        const hasValidSchedule = eellsAssessment?.schedule?.core?.instruments?.length > 0
            && eellsAssessment?.schedule?.core?.frequency;
        if (!eellsAssessment?.scheduleNA && !hasValidSchedule) {
            return 'Definir cronograma de reavaliações (ou marcar N/A)';
        }
    }

    if (progress.problemList < 100) {
        const problems = (patient as any).eellsData?.problemList || [];
        const agreement = (patient as any).eellsData?.problemListAgreement?.sharedUnderstanding;

        if (problems.length === 0) {
            return 'Criar Lista de Problemas a partir das sessões';
        }

        const hasPriorities = problems.some((p: any) => p.priorityRank || p.isFocus);
        if (!hasPriorities) {
            return 'Definir prioridades na Lista de Problemas';
        }

        if (!agreement?.reviewed || !agreement?.agreement) {
            return 'Revisar Lista de Problemas com o paciente';
        }
    }

    if (progress.mechanisms < 100) {
        const mechanisms = (patient as any).eellsData?.mechanisms;

        // Verificar quadrantes
        const checkQ = (items: any[], na?: boolean, reason?: string) =>
            items?.length > 0 || (na && reason?.trim()?.length >= 10);

        if (!checkQ(mechanisms?.precipitants, mechanisms?.precipitantsNA, mechanisms?.precipitantsNAReason)) {
            return 'Preencher Precipitantes (ou marcar N/A com justificativa)';
        }
        if (!checkQ(mechanisms?.origins, mechanisms?.originsNA, mechanisms?.originsNAReason)) {
            return 'Preencher Origens (ou marcar N/A com justificativa)';
        }
        if (!checkQ(mechanisms?.resources, mechanisms?.resourcesNA, mechanisms?.resourcesNAReason)) {
            return 'Identificar Recursos/Forças (ou marcar N/A)';
        }
        if (!checkQ(mechanisms?.obstacles, mechanisms?.obstaclesNA, mechanisms?.obstaclesNAReason)) {
            return 'Identificar Obstáculos (ou marcar N/A)';
        }

        // Verificar processos + crenças
        const hasProcesses = mechanisms?.maintainingProcesses?.length > 0;
        const hasBeliefsOrPatterns = mechanisms?.coreBeliefs?.length > 0 || mechanisms?.observablePatterns?.length > 0;
        if (!hasProcesses) {
            return 'Identificar Processos Mantenedores';
        }
        if (!hasBeliefsOrPatterns) {
            return 'Identificar Crenças ou Padrões Observáveis';
        }

        // Verificar evidência
        return 'Vincular evidências (PBT, notas, instrumentos)';
    }

    if (progress.formulation < 100) {
        const formulationV2 = (patient as any).eellsData?.formulationV2;

        if (!formulationV2?.explanatoryNarrative?.trim() || formulationV2.explanatoryNarrative.trim().length <= 100) {
            return 'Escrever Narrativa Explicativa (síntese causal)';
        }

        const hasDiagnosis = formulationV2?.primaryDiagnosis?.trim()?.length > 0;
        const diagnosisNAValid = formulationV2?.diagnosisNA && formulationV2?.diagnosisNAReason?.trim()?.length >= 10;
        if (!hasDiagnosis && !diagnosisNAValid) {
            return 'Registrar Diagnóstico (ou marcar N/A com justificativa)';
        }
    }

    if (progress.treatment < 100) {
        const eellsData = (patient as any).eellsData;
        if (!eellsData?.treatmentPlan?.goals?.length) {
            return 'Definir Metas Terapêuticas';
        }
        if (!eellsData?.treatmentPlan?.interventions?.length) {
            return 'Planejar Intervenções';
        }
        return 'Executar intervenções e monitorar progresso';
    }

    if (progress.monitoring < 100) {
        if (patient.clinicalRecords.sessions.length < 3) {
            return 'Continuar sessões (mínimo 3 para monitoramento)';
        }
        return 'Reavaliar com instrumentos (GAD-7, PHQ-9)';
    }

    if (progress.discharge < 100) {
        return 'Preparar critérios de alta e plano de prevenção';
    }

    return 'Processo completo! Considerar alta terapêutica';
}

/**
 * Retorna a próxima ação recomendada com a aba alvo para navegação
 */
export function getNextRecommendedActionWithTab(patient: Patient): { action: string; targetTab: string | null } {
    const progress = calculateEellsProgress(patient);

    if (progress.assessment < 100) {
        const eellsAssessment = (patient as any).eellsData?.assessment;

        if (!patient.clinicalRecords.anamnesis.content) {
            return { action: 'Preencher Anamnese estruturada', targetTab: 'anamnesis' };
        }

        // Verificar fontes externas
        const hasExternalSources = eellsAssessment?.externalSourcesNA ||
            (eellsAssessment?.externalSources?.length > 0);
        if (!hasExternalSources) {
            return { action: 'Registrar fontes externas (ou marcar N/A)', targetTab: 'anamnesis' };
        }

        if (patient.clinicalRecords.assessments.length === 0) {
            return { action: 'Aplicar avaliação inicial (GAD-7, PHQ-9, etc)', targetTab: 'forms' };
        }

        // Verificar cronograma
        const hasValidSchedule = eellsAssessment?.schedule?.core?.instruments?.length > 0
            && eellsAssessment?.schedule?.core?.frequency;
        if (!eellsAssessment?.scheduleNA && !hasValidSchedule) {
            return { action: 'Definir cronograma de reavaliações (ou marcar N/A)', targetTab: 'forms' };
        }
    }

    if (progress.problemList < 100) {
        const problems = (patient as any).eellsData?.problemList || [];
        const agreement = (patient as any).eellsData?.problemListAgreement?.sharedUnderstanding;

        if (problems.length === 0) {
            return { action: 'Criar Lista de Problemas a partir das sessões', targetTab: 'eells' };
        }

        const hasPriorities = problems.some((p: any) => p.priorityRank || p.isFocus);
        if (!hasPriorities) {
            return { action: 'Definir prioridades na Lista de Problemas', targetTab: 'eells' };
        }

        if (!agreement?.reviewed || !agreement?.agreement) {
            return { action: 'Revisar Lista de Problemas com o paciente', targetTab: 'eells' };
        }
    }

    if (progress.mechanisms < 100) {
        const mechanisms = (patient as any).eellsData?.mechanisms;

        const checkQ = (items: any[], na?: boolean, reason?: string) =>
            items?.length > 0 || (na && reason?.trim()?.length >= 10);

        if (!checkQ(mechanisms?.precipitants, mechanisms?.precipitantsNA, mechanisms?.precipitantsNAReason)) {
            return { action: 'Preencher Precipitantes', targetTab: 'formulation' };
        }
        if (!checkQ(mechanisms?.origins, mechanisms?.originsNA, mechanisms?.originsNAReason)) {
            return { action: 'Preencher Origens', targetTab: 'formulation' };
        }
        if (!checkQ(mechanisms?.resources, mechanisms?.resourcesNA, mechanisms?.resourcesNAReason)) {
            return { action: 'Identificar Recursos/Forças', targetTab: 'formulation' };
        }
        if (!checkQ(mechanisms?.obstacles, mechanisms?.obstaclesNA, mechanisms?.obstaclesNAReason)) {
            return { action: 'Identificar Obstáculos', targetTab: 'formulation' };
        }

        if (!mechanisms?.maintainingProcesses?.length) {
            return { action: 'Identificar Processos Mantenedores', targetTab: 'formulation' };
        }
        if (!(mechanisms?.coreBeliefs?.length > 0 || mechanisms?.observablePatterns?.length > 0)) {
            return { action: 'Identificar Crenças ou Padrões', targetTab: 'formulation' };
        }

        return { action: 'Vincular evidências (PBT, notas)', targetTab: 'formulation' };
    }

    if (progress.formulation < 100) {
        const formulationV2 = (patient as any).eellsData?.formulationV2;

        if (!formulationV2?.explanatoryNarrative?.trim() || formulationV2.explanatoryNarrative.trim().length <= 100) {
            return { action: 'Escrever Narrativa Explicativa', targetTab: 'formulation' };
        }

        return { action: 'Registrar Diagnóstico', targetTab: 'formulation' };
    }

    if (progress.treatment < 100) {
        const eellsData = (patient as any).eellsData;
        if (!eellsData?.treatmentPlan?.goals?.length) {
            return { action: 'Definir Metas Terapêuticas', targetTab: 'eells' };
        }
        if (!eellsData?.treatmentPlan?.interventions?.length) {
            return { action: 'Planejar Intervenções', targetTab: 'eells' };
        }
        return { action: 'Executar intervenções e monitorar progresso', targetTab: 'copilot' };
    }

    if (progress.monitoring < 100) {
        if (patient.clinicalRecords.sessions.length < 3) {
            return { action: 'Continuar sessões (mínimo 3 para monitoramento)', targetTab: 'copilot' };
        }
        return { action: 'Reavaliar com instrumentos (GAD-7, PHQ-9)', targetTab: 'forms' };
    }

    if (progress.discharge < 100) {
        return { action: 'Preparar critérios de alta e plano de prevenção', targetTab: 'evolution' };
    }

    return { action: 'Processo completo! Considerar alta terapêutica', targetTab: null };
}

/**
 * Verifica se o paciente está pronto para alta
 */
export function checkDischargeReadiness(patient: Patient): boolean {
    const progress = calculateEellsProgress(patient);
    return progress.discharge >= 80;
}
