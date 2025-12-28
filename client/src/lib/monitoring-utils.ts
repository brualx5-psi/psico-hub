/**
 * Monitoring Utils - Etapa 6 Eells
 * Funções para calcular alertas, checklist e comparativos
 */

import {
    ScheduledInstrumentStatus,
    InstrumentAlertStatus,
    AssessmentFrequency,
    FREQUENCY_DAYS,
    InstrumentRecord,
    SessionInstrumentChecklist,
    TemporalComparison
} from '../types/eells';

// Calcular próxima data de vencimento
export function calculateNextDueDate(
    frequency: AssessmentFrequency,
    lastCompletedDate: string | undefined,
    customDays?: number,
    startDate?: string // Data de início do tratamento
): string | undefined {
    // "quando_indicado" não tem vencimento automático
    if (frequency === 'quando_indicado') return undefined;

    // "sessao" é a cada sessão, não baseado em dias
    if (frequency === 'sessao') return undefined;

    const intervalDays = frequency === 'personalizado'
        ? (customDays || 14)
        : FREQUENCY_DAYS[frequency];

    if (intervalDays === 0) return undefined;

    // Se nunca foi aplicado, vence a partir do início do tratamento
    const baseDate = lastCompletedDate
        ? new Date(lastCompletedDate)
        : (startDate ? new Date(startDate) : new Date());

    const nextDue = new Date(baseDate);
    nextDue.setDate(nextDue.getDate() + intervalDays);

    return nextDue.toISOString().split('T')[0];
}

// Calcular status de alerta
export function calculateAlertStatus(
    nextDueDate: string | undefined,
    frequency: AssessmentFrequency,
    postponedUntil?: string
): { status: InstrumentAlertStatus; daysUntilDue?: number } {
    // "quando_indicado" nunca está vencido
    if (frequency === 'quando_indicado') {
        return { status: 'nao_aplicavel' };
    }

    // "sessao" precisa de lógica diferente (baseada em sessão, não dias)
    if (frequency === 'sessao') {
        return { status: 'em_dia' }; // Será tratado no checklist da sessão
    }

    // Se foi adiado
    if (postponedUntil) {
        const postponeDate = new Date(postponedUntil);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (postponeDate >= today) {
            return { status: 'adiado', daysUntilDue: Math.ceil((postponeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) };
        }
    }

    if (!nextDueDate) {
        return { status: 'em_dia' };
    }

    const dueDate = new Date(nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'vencido', daysUntilDue: diffDays };
    } else if (diffDays <= 2) {
        return { status: 'vence_em_breve', daysUntilDue: diffDays };
    } else {
        return { status: 'em_dia', daysUntilDue: diffDays };
    }
}

// Gerar checklist para a sessão atual
export function generateSessionChecklist(
    scheduledInstruments: ScheduledInstrumentStatus[],
    completedToday: string[],
    sessionId: string
): SessionInstrumentChecklist {
    const today = new Date().toISOString().split('T')[0];

    const dueToday = scheduledInstruments.filter(inst => {
        if (completedToday.includes(inst.instrumentId)) return false;
        if (inst.alertStatus === 'vencido' || inst.alertStatus === 'vence_em_breve') return true;
        if (inst.frequency === 'sessao') return true;
        return false;
    });

    const optional = scheduledInstruments.filter(inst => {
        if (completedToday.includes(inst.instrumentId)) return false;
        if (inst.frequency === 'quando_indicado') return true;
        if (inst.alertStatus === 'em_dia' && inst.frequency !== 'sessao') return true;
        return false;
    });

    return {
        sessionId,
        date: today,
        dueToday,
        optional,
        completed: completedToday
    };
}

// Calcular comparativo temporal
export function calculateTemporalComparison(
    instrumentRecords: InstrumentRecord[],
    instrumentId: string,
    windowSessions: number = 4
): TemporalComparison | null {
    const records = instrumentRecords
        .filter(r => r.instrumentId === instrumentId && r.score !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (records.length < 2) return null;

    const currentScore = records[0].score!;
    const previousIndex = Math.min(windowSessions, records.length - 1);
    const previousScore = records[previousIndex].score!;

    const deltaAbsolute = currentScore - previousScore;
    const deltaPercent = previousScore !== 0
        ? ((currentScore - previousScore) / previousScore) * 100
        : 0;

    // Determinar tendência (para a maioria dos instrumentos, menor score = melhor)
    let trend: 'melhorando' | 'estavel' | 'piorando';
    if (deltaAbsolute < -2) {
        trend = 'melhorando';
    } else if (deltaAbsolute > 2) {
        trend = 'piorando';
    } else {
        trend = 'estavel';
    }

    // Média móvel dos últimos 3 pontos
    const last3 = records.slice(0, 3);
    const movingAverage = last3.length > 0
        ? last3.reduce((sum, r) => sum + (r.score || 0), 0) / last3.length
        : undefined;

    return {
        instrumentId,
        instrumentName: records[0].instrumentName,
        windowSessions,
        currentScore,
        previousScore,
        deltaAbsolute,
        deltaPercent: Math.round(deltaPercent * 10) / 10,
        trend,
        movingAverage: movingAverage ? Math.round(movingAverage * 10) / 10 : undefined
    };
}

// Helper: formatar alerta para exibição
export function formatAlertMessage(status: ScheduledInstrumentStatus): string {
    switch (status.alertStatus) {
        case 'vencido':
            return `⚠️ ${status.instrumentName} vencido há ${Math.abs(status.daysUntilDue || 0)} dias`;
        case 'vence_em_breve':
            return `⏰ ${status.instrumentName} vence em ${status.daysUntilDue} dias`;
        case 'adiado':
            return `🔄 ${status.instrumentName} adiado até ${status.postponedUntil}`;
        case 'em_dia':
            return `✅ ${status.instrumentName} em dia`;
        case 'nao_aplicavel':
            return `📋 ${status.instrumentName} (quando indicado)`;
        default:
            return status.instrumentName;
    }
}

// Helper: obter cor do badge por status
export function getAlertStatusColor(status: InstrumentAlertStatus): string {
    switch (status) {
        case 'vencido': return 'bg-red-100 text-red-700 border-red-200';
        case 'vence_em_breve': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'adiado': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'em_dia': return 'bg-green-100 text-green-700 border-green-200';
        case 'nao_aplicavel': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100 text-gray-600';
    }
}
