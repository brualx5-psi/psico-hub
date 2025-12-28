/**
 * AlertCard - Componente de alertas de instrumentos vencidos
 * Mostra instrumentos que precisam ser aplicados (vencidos ou vencendo em breve)
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    AlertTriangle,
    Clock,
    CheckCircle,
    Calendar,
    ChevronDown,
    ChevronUp,
    Play,
    PauseCircle,
    X,
    Save,
    FileText
} from 'lucide-react';
import {
    ScheduledInstrumentStatus,
    InstrumentAlertStatus,
    AssessmentFrequency,
    FREQUENCY_DAYS,
    InstrumentRecord
} from '../types/eells';
import {
    calculateNextDueDate,
    calculateAlertStatus,
    getAlertStatusColor,
    formatAlertMessage
} from '../lib/monitoring-utils';

interface AlertCardProps {
    onOpenSession?: () => void;
    onApplyInstrument?: (instrumentId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ onOpenSession, onApplyInstrument }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [isExpanded, setIsExpanded] = useState(true);
    const [showPostponeModal, setShowPostponeModal] = useState<string | null>(null);
    const [postponeReason, setPostponeReason] = useState('');
    const [postponeDays, setPostponeDays] = useState(7);

    // Estados para modal de aplicação
    const [showApplyModal, setShowApplyModal] = useState<ScheduledInstrumentStatus | null>(null);
    const [applyScore, setApplyScore] = useState<string>('');
    const [applyInterpretation, setApplyInterpretation] = useState('');
    const [applyNotes, setApplyNotes] = useState('');

    // Calcular status de todos os instrumentos agendados
    const instrumentStatuses = useMemo((): ScheduledInstrumentStatus[] => {
        if (!currentPatient) return [];

        const eellsData = (currentPatient as any).eellsData;
        const schedule = eellsData?.anamnesis?.schedule;
        const monitoring = eellsData?.monitoring;

        if (!schedule?.instruments) return [];

        const startDate = eellsData?.anamnesis?.lastUpdated || new Date().toISOString().split('T')[0];

        return schedule.instruments.map((inst: any) => {
            // Buscar último registro deste instrumento
            const records = monitoring?.instrumentRecords?.filter(
                (r: any) => r.instrumentId === inst.instrumentId
            ) || [];
            const lastRecord = records.sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0];

            const lastCompletedDate = lastRecord?.date;
            const nextDueDate = calculateNextDueDate(
                inst.frequency as AssessmentFrequency,
                lastCompletedDate,
                inst.customDays,
                startDate
            );

            // Verificar se foi adiado
            const postponedUntil = inst.postponedUntil;
            const postponeReason = inst.postponeReason;

            const { status, daysUntilDue } = calculateAlertStatus(
                nextDueDate,
                inst.frequency as AssessmentFrequency,
                postponedUntil
            );

            return {
                instrumentId: inst.instrumentId || inst.id,
                instrumentName: inst.name,
                frequency: inst.frequency as AssessmentFrequency,
                customDays: inst.customDays,
                lastCompletedDate,
                nextDueDate,
                alertStatus: status,
                daysUntilDue,
                postponedUntil,
                postponeReason
            };
        });
    }, [currentPatient]);

    // Filtrar apenas os que precisam de atenção
    const alertItems = useMemo(() => {
        return instrumentStatuses.filter(inst =>
            inst.alertStatus === 'vencido' ||
            inst.alertStatus === 'vence_em_breve'
        );
    }, [instrumentStatuses]);

    const overdueCount = alertItems.filter(i => i.alertStatus === 'vencido').length;
    const soonCount = alertItems.filter(i => i.alertStatus === 'vence_em_breve').length;

    // Handler para adiar instrumento
    const handlePostpone = (instrumentId: string) => {
        if (!currentPatient || !postponeReason.trim()) return;

        const eellsData = (currentPatient as any).eellsData;
        const schedule = eellsData?.anamnesis?.schedule;

        if (!schedule?.instruments) return;

        const postponeDate = new Date();
        postponeDate.setDate(postponeDate.getDate() + postponeDays);

        const updatedInstruments = schedule.instruments.map((inst: any) => {
            if ((inst.instrumentId || inst.id) === instrumentId) {
                return {
                    ...inst,
                    postponedUntil: postponeDate.toISOString().split('T')[0],
                    postponeReason: postponeReason
                };
            }
            return inst;
        });

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                anamnesis: {
                    ...eellsData.anamnesis,
                    schedule: {
                        ...schedule,
                        instruments: updatedInstruments
                    }
                }
            }
        } as any);

        setShowPostponeModal(null);
        setPostponeReason('');
        setPostponeDays(7);
    };

    // Handler para aplicar instrumento
    const handleApplyInstrument = () => {
        if (!currentPatient || !showApplyModal) return;

        const eellsData = (currentPatient as any).eellsData || {};
        const monitoring = eellsData.monitoring || { instrumentRecords: [], decisionLogs: [] };

        const today = new Date().toISOString().split('T')[0];

        // Criar novo registro
        const newRecord: InstrumentRecord = {
            id: crypto.randomUUID(),
            instrumentId: showApplyModal.instrumentId,
            instrumentName: showApplyModal.instrumentName,
            date: today,
            score: applyScore ? parseFloat(applyScore) : null,
            interpretation: applyInterpretation || undefined,
            appliedBy: 'terapeuta',
            notes: applyNotes || undefined
        };

        // Limpar adiamento do instrumento se existir
        const schedule = eellsData?.anamnesis?.schedule;
        let updatedInstruments = schedule?.instruments;
        if (schedule?.instruments) {
            updatedInstruments = schedule.instruments.map((inst: any) => {
                if ((inst.instrumentId || inst.id) === showApplyModal.instrumentId) {
                    return {
                        ...inst,
                        postponedUntil: undefined,
                        postponeReason: undefined
                    };
                }
                return inst;
            });
        }

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                anamnesis: {
                    ...eellsData.anamnesis,
                    schedule: schedule ? {
                        ...schedule,
                        instruments: updatedInstruments
                    } : undefined
                },
                monitoring: {
                    ...monitoring,
                    instrumentRecords: [...(monitoring.instrumentRecords || []), newRecord],
                    lastUpdated: new Date().toISOString()
                }
            }
        } as any);

        // Reset modal
        setShowApplyModal(null);
        setApplyScore('');
        setApplyInterpretation('');
        setApplyNotes('');
    };

    // Abrir modal de aplicação
    const openApplyModal = (item: ScheduledInstrumentStatus) => {
        setShowApplyModal(item);
        setApplyScore('');
        setApplyInterpretation('');
        setApplyNotes('');
    };

    if (!currentPatient) {
        return null;
    }

    // Se não há instrumentos agendados
    if (instrumentStatuses.length === 0) {
        return (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">Nenhum instrumento agendado para monitoramento</span>
                </div>
            </div>
        );
    }

    // Se todos estão em dia
    if (alertItems.length === 0) {
        return (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Todos os instrumentos em dia!</span>
                    <span className="text-sm text-green-600">
                        ({instrumentStatuses.length} instrumentos monitorados)
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border-2 overflow-hidden ${overdueCount > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200'
            }`}>
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdueCount > 0 ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                        <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? 'text-red-600' : 'text-amber-600'
                            }`} />
                    </div>
                    <div className="text-left">
                        <h3 className={`font-bold ${overdueCount > 0 ? 'text-red-800' : 'text-amber-800'
                            }`}>
                            Alertas de Monitoramento
                        </h3>
                        <p className="text-sm text-gray-600">
                            {overdueCount > 0 && (
                                <span className="text-red-600 font-medium">{overdueCount} vencido(s)</span>
                            )}
                            {overdueCount > 0 && soonCount > 0 && ' • '}
                            {soonCount > 0 && (
                                <span className="text-amber-600">{soonCount} vencendo em breve</span>
                            )}
                        </p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-black/10 p-4 space-y-2">
                    {alertItems.map((item) => (
                        <div
                            key={item.instrumentId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${item.alertStatus === 'vencido'
                                ? 'bg-red-100 border-red-200'
                                : 'bg-amber-100 border-amber-200'
                                }`}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${item.alertStatus === 'vencido' ? 'text-red-800' : 'text-amber-800'
                                        }`}>
                                        {item.instrumentName}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAlertStatusColor(item.alertStatus)
                                        }`}>
                                        {item.alertStatus === 'vencido'
                                            ? `${Math.abs(item.daysUntilDue || 0)} dias atrás`
                                            : `em ${item.daysUntilDue} dias`
                                        }
                                    </span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                    {item.lastCompletedDate
                                        ? `Último: ${new Date(item.lastCompletedDate).toLocaleDateString('pt-BR')}`
                                        : 'Nunca aplicado'
                                    }
                                    {item.nextDueDate && (
                                        <span> • Vence: {new Date(item.nextDueDate).toLocaleDateString('pt-BR')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPostponeModal(item.instrumentId)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Adiar"
                                >
                                    <PauseCircle className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => openApplyModal(item)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${item.alertStatus === 'vencido'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                                        }`}
                                >
                                    <Play className="w-3 h-3" />
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Botão de ação geral */}
                    {onOpenSession && (
                        <button
                            onClick={onOpenSession}
                            className="w-full mt-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Abrir sessão e aplicar todos pendentes
                        </button>
                    )}
                </div>
            )}

            {/* Modal de Adiamento */}
            {showPostponeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Adiar Instrumento</h3>
                            <button
                                onClick={() => setShowPostponeModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Adiar por quantos dias?
                                </label>
                                <div className="flex gap-2">
                                    {[3, 7, 14, 30].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => setPostponeDays(days)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium ${postponeDays === days
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {days} dias
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Motivo do adiamento *
                                </label>
                                <input
                                    type="text"
                                    value={postponeReason}
                                    onChange={(e) => setPostponeReason(e.target.value)}
                                    placeholder="Ex: Paciente em crise, priorizar acolhimento"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowPostponeModal(null)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handlePostpone(showPostponeModal)}
                                    disabled={!postponeReason.trim()}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    Adiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Aplicação */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Registrar Aplicação</h3>
                                    <p className="text-sm text-gray-500">{showApplyModal.instrumentName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApplyModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Score (opcional)
                                </label>
                                <input
                                    type="number"
                                    value={applyScore}
                                    onChange={(e) => setApplyScore(e.target.value)}
                                    placeholder="Ex: 12"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Interpretação (opcional)
                                </label>
                                <select
                                    value={applyInterpretation}
                                    onChange={(e) => setApplyInterpretation(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="mínimo">Mínimo</option>
                                    <option value="leve">Leve</option>
                                    <option value="moderado">Moderado</option>
                                    <option value="grave">Grave</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações clínicas (opcional)
                                </label>
                                <textarea
                                    value={applyNotes}
                                    onChange={(e) => setApplyNotes(e.target.value)}
                                    placeholder="Ex: Paciente relatou dificuldade no item 5..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg min-h-[80px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowApplyModal(null)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleApplyInstrument}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
