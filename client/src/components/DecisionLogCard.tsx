/**
 * DecisionLogCard - Registrar e visualizar decisões clínicas
 * O "cérebro" do monitoramento: hipótese → teste → ajuste
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    Brain,
    Plus,
    X,
    Save,
    ChevronDown,
    ChevronUp,
    Calendar,
    Target,
    TrendingUp,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Clock
} from 'lucide-react';
import { DecisionLog, InstrumentRecord } from '../types/eells';

export const DecisionLogCard: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isExpanded, setIsExpanded] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);

    // Form states
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [interpretation, setInterpretation] = useState('');
    const [decision, setDecision] = useState('');
    const [rationale, setRationale] = useState('');
    const [outcomeToCheck, setOutcomeToCheck] = useState('');
    const [followUpWeeks, setFollowUpWeeks] = useState(4);

    // Obter dados
    const { decisionLogs, recentInstruments } = useMemo(() => {
        if (!currentPatient) return { decisionLogs: [], recentInstruments: [] };

        const eellsData = (currentPatient as any).eellsData;
        const logs: DecisionLog[] = eellsData?.monitoring?.decisionLogs || [];
        const records: InstrumentRecord[] = eellsData?.monitoring?.instrumentRecords || [];

        // Últimos 30 dias de registros
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentInstruments = records
            .filter(r => new Date(r.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return { decisionLogs: logs, recentInstruments };
    }, [currentPatient]);

    // Handler para criar nova decisão
    const handleCreateDecision = () => {
        if (!currentPatient || !interpretation.trim() || !decision.trim()) return;

        const eellsData = (currentPatient as any).eellsData || {};
        const monitoring = eellsData.monitoring || { instrumentRecords: [], decisionLogs: [] };

        // Calcular data de follow-up
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + (followUpWeeks * 7));

        // Criar resumo dos instrumentos selecionados
        const instrumentSummary = selectedInstruments.map(id => {
            const record = recentInstruments.find(r => r.id === id);
            if (!record) return '';
            return `${record.instrumentName}: ${record.score}${record.interpretation ? ` (${record.interpretation})` : ''}`;
        }).filter(Boolean);

        const newLog: DecisionLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            basedOn: {
                instrumentRecordIds: selectedInstruments,
                instrumentSummary
            },
            interpretation,
            decision,
            rationale,
            outcomeToCheck,
            followUpDate: followUpDate.toISOString().split('T')[0],
            createdBy: 'terapeuta'
        };

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                monitoring: {
                    ...monitoring,
                    decisionLogs: [newLog, ...(monitoring.decisionLogs || [])],
                    lastUpdated: new Date().toISOString()
                }
            }
        } as any);

        // Reset
        setShowNewModal(false);
        setSelectedInstruments([]);
        setInterpretation('');
        setDecision('');
        setRationale('');
        setOutcomeToCheck('');
        setFollowUpWeeks(4);
    };

    // Toggle seleção de instrumento
    const toggleInstrument = (id: string) => {
        setSelectedInstruments(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    if (!currentPatient) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900">Decisões Clínicas</h3>
                        <p className="text-sm text-gray-500">
                            {decisionLogs.length} decisão(ões) registrada(s)
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Decisão
                    </button>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="p-4">
                    {decisionLogs.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Brain className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Nenhuma decisão registrada ainda.</p>
                            <p className="text-sm">Clique em "Nova Decisão" para começar.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {decisionLogs.map((log) => {
                                const isPastFollowUp = log.followUpDate && new Date(log.followUpDate) < new Date();

                                return (
                                    <div
                                        key={log.id}
                                        className={`border rounded-lg p-4 ${isPastFollowUp ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
                                            }`}
                                    >
                                        {/* Header da decisão */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-500">
                                                    {new Date(log.date).toLocaleDateString('pt-BR')}
                                                </span>
                                                {isPastFollowUp && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Revisão pendente
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Baseado em */}
                                        {log.basedOn.instrumentSummary.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Baseado em</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {log.basedOn.instrumentSummary.map((summary, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-700">
                                                            {summary}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Interpretação */}
                                        <div className="mb-3">
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Interpretação</p>
                                            <p className="text-gray-700">{log.interpretation}</p>
                                        </div>

                                        {/* Decisão */}
                                        <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target className="w-4 h-4 text-purple-600" />
                                                <p className="text-xs text-purple-600 uppercase font-bold">Decisão</p>
                                            </div>
                                            <p className="text-purple-900 font-medium">{log.decision}</p>
                                            {log.rationale && (
                                                <p className="text-sm text-purple-700 mt-1 italic">Motivo: {log.rationale}</p>
                                            )}
                                        </div>

                                        {/* Resultado esperado */}
                                        {log.outcomeToCheck && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <div>
                                                    <span className="text-gray-500">Espero ver: </span>
                                                    <span className="text-gray-700">{log.outcomeToCheck}</span>
                                                    {log.followUpDate && (
                                                        <span className="text-gray-400 ml-1">
                                                            (até {new Date(log.followUpDate).toLocaleDateString('pt-BR')})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Nova Decisão */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Nova Decisão Clínica</h3>
                                    <p className="text-sm text-gray-500">Registre uma decisão baseada em dados</p>
                                </div>
                            </div>
                            <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Selecionar instrumentos base */}
                            {recentInstruments.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Baseado em quais instrumentos? (opcional)
                                    </label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {recentInstruments.slice(0, 10).map(record => (
                                            <button
                                                key={record.id}
                                                onClick={() => toggleInstrument(record.id)}
                                                className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedInstruments.includes(record.id)
                                                    ? 'border-purple-300 bg-purple-50'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{record.instrumentName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500">Score: {record.score}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(record.date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                        {selectedInstruments.includes(record.id) && (
                                                            <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interpretação */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Interpretação dos dados *
                                </label>
                                <textarea
                                    value={interpretation}
                                    onChange={(e) => setInterpretation(e.target.value)}
                                    placeholder="Ex: Ansiedade aumentou de leve para moderado, mas humor estável..."
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg min-h-[80px]"
                                />
                            </div>

                            {/* Decisão */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Decisão clínica *
                                </label>
                                <input
                                    type="text"
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
                                    placeholder="Ex: Intensificar exposição situacional"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                                />
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Motivo/Racional (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={rationale}
                                    onChange={(e) => setRationale(e.target.value)}
                                    placeholder="Ex: Evitação mantendo o ciclo ansioso"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                                />
                            </div>

                            {/* Resultado esperado */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    O que espero ver? (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={outcomeToCheck}
                                    onChange={(e) => setOutcomeToCheck(e.target.value)}
                                    placeholder="Ex: GAD-7 < 10 em 4 semanas"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                                />
                            </div>

                            {/* Follow-up */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Revisar em quanto tempo?
                                </label>
                                <div className="flex gap-2">
                                    {[2, 4, 6, 8].map(weeks => (
                                        <button
                                            key={weeks}
                                            onClick={() => setFollowUpWeeks(weeks)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium ${followUpWeeks === weeks
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {weeks} semanas
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateDecision}
                                disabled={!interpretation.trim() || !decision.trim()}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Registrar Decisão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
