/**
 * SessionChecklist - Lista de instrumentos pendentes para a sessão
 * Mostra o que precisa ser aplicado hoje baseado no cronograma
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    ClipboardCheck,
    CheckCircle2,
    Circle,
    AlertTriangle,
    Clock,
    ChevronDown,
    ChevronUp,
    Play,
    X,
    Save,
    FileText
} from 'lucide-react';
import {
    ScheduledInstrumentStatus,
    AssessmentFrequency,
    InstrumentRecord
} from '../types/eells';
import {
    calculateNextDueDate,
    calculateAlertStatus
} from '../lib/monitoring-utils';

export const SessionChecklist: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isExpanded, setIsExpanded] = useState(true);
    const [showApplyModal, setShowApplyModal] = useState<ScheduledInstrumentStatus | null>(null);
    const [applyScore, setApplyScore] = useState<string>('');
    const [applyInterpretation, setApplyInterpretation] = useState('');
    const [applyNotes, setApplyNotes] = useState('');
    const [completedIds, setCompletedIds] = useState<string[]>([]);

    // Calcular instrumentos para hoje
    const { dueToday, optional } = useMemo(() => {
        if (!currentPatient) return { dueToday: [], optional: [] };

        const eellsData = (currentPatient as any).eellsData;
        const schedule = eellsData?.anamnesis?.schedule;
        const monitoring = eellsData?.monitoring;

        if (!schedule?.instruments) return { dueToday: [], optional: [] };

        const startDate = eellsData?.anamnesis?.lastUpdated || new Date().toISOString().split('T')[0];

        const allStatuses: ScheduledInstrumentStatus[] = schedule.instruments.map((inst: any) => {
            const records = monitoring?.instrumentRecords?.filter(
                (r: any) => r.instrumentId === (inst.instrumentId || inst.id)
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

            const { status, daysUntilDue } = calculateAlertStatus(
                nextDueDate,
                inst.frequency as AssessmentFrequency,
                inst.postponedUntil
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
                postponedUntil: inst.postponedUntil,
                postponeReason: inst.postponeReason
            };
        });

        // Separar em "devido hoje" e "opcional"
        const dueToday = allStatuses.filter(inst =>
            !completedIds.includes(inst.instrumentId) && (
                inst.alertStatus === 'vencido' ||
                inst.alertStatus === 'vence_em_breve' ||
                inst.frequency === 'sessao'
            )
        );

        const optional = allStatuses.filter(inst =>
            !completedIds.includes(inst.instrumentId) &&
            inst.frequency === 'quando_indicado'
        );

        return { dueToday, optional };
    }, [currentPatient, completedIds]);

    // Handler para aplicar instrumento
    const handleApplyInstrument = () => {
        if (!currentPatient || !showApplyModal) return;

        const eellsData = (currentPatient as any).eellsData || {};
        const monitoring = eellsData.monitoring || { instrumentRecords: [], decisionLogs: [] };

        const today = new Date().toISOString().split('T')[0];

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

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                monitoring: {
                    ...monitoring,
                    instrumentRecords: [...(monitoring.instrumentRecords || []), newRecord],
                    lastUpdated: new Date().toISOString()
                }
            }
        } as any);

        // Marcar como completado na sessão
        setCompletedIds(prev => [...prev, showApplyModal.instrumentId]);

        // Reset modal
        setShowApplyModal(null);
        setApplyScore('');
        setApplyInterpretation('');
        setApplyNotes('');
    };

    if (!currentPatient) return null;

    const totalDue = dueToday.length;
    const totalCompleted = completedIds.length;

    if (totalDue === 0 && optional.length === 0) {
        return null; // Não mostrar se não há nada
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${totalDue > 0 ? 'bg-amber-100' : 'bg-green-100'
                        }`}>
                        <ClipboardCheck className={`w-5 h-5 ${totalDue > 0 ? 'text-amber-600' : 'text-green-600'
                            }`} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900">Instrumentos para Hoje</h3>
                        <p className="text-sm text-gray-500">
                            {totalDue > 0 ? (
                                <><span className="font-medium text-amber-600">{totalDue} pendente(s)</span></>
                            ) : (
                                <span className="text-green-600">Todos aplicados!</span>
                            )}
                            {totalCompleted > 0 && (
                                <span className="ml-2 text-green-600">• {totalCompleted} aplicado(s)</span>
                            )}
                        </p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-3">
                    {/* Instrumentos Pendentes */}
                    {dueToday.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Aplicar nesta sessão</h4>
                            {dueToday.map((item) => (
                                <div
                                    key={item.instrumentId}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Circle className="w-5 h-5 text-gray-300" />
                                        <div>
                                            <span className="font-medium text-gray-900">{item.instrumentName}</span>
                                            {item.alertStatus === 'vencido' && (
                                                <span className="ml-2 text-xs text-red-600">
                                                    (vencido há {Math.abs(item.daysUntilDue || 0)} dias)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowApplyModal(item);
                                            setApplyScore('');
                                            setApplyInterpretation('');
                                            setApplyNotes('');
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Play className="w-3 h-3" />
                                        Aplicar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Instrumentos Completados */}
                    {completedIds.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-green-600 uppercase">Aplicados</h4>
                            {completedIds.map((id) => {
                                const inst = (currentPatient as any).eellsData?.anamnesis?.schedule?.instruments?.find(
                                    (i: any) => (i.instrumentId || i.id) === id
                                );
                                return inst && (
                                    <div
                                        key={id}
                                        className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="font-medium text-green-800">{inst.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Instrumentos Opcionais */}
                    {optional.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase">Quando indicado (opcional)</h4>
                            {optional.map((item) => (
                                <div
                                    key={item.instrumentId}
                                    className="flex items-center justify-between p-2 bg-gray-50/50 rounded-lg"
                                >
                                    <span className="text-sm text-gray-600">{item.instrumentName}</span>
                                    <button
                                        onClick={() => {
                                            setShowApplyModal(item);
                                            setApplyScore('');
                                            setApplyInterpretation('');
                                            setApplyNotes('');
                                        }}
                                        className="text-xs text-gray-500 hover:text-indigo-600"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
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
                            <button onClick={() => setShowApplyModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score (opcional)</label>
                                <input
                                    type="number"
                                    value={applyScore}
                                    onChange={(e) => setApplyScore(e.target.value)}
                                    placeholder="Ex: 12"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Interpretação</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    value={applyNotes}
                                    onChange={(e) => setApplyNotes(e.target.value)}
                                    placeholder="Observações clínicas..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg min-h-[60px]"
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
