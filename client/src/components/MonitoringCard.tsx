import React, { useState, useMemo } from 'react';
import { Activity, Lightbulb, X, TrendingUp, Calendar, Target, FileText, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { GASPlan, GASMeta } from '../types/eells';

interface MonitoringCardProps {
    currentPatient: any;
}

export const MonitoringCard: React.FC<MonitoringCardProps> = ({ currentPatient }) => {
    const [showRecommendations, setShowRecommendations] = useState(false);

    // Calculate instrument status
    const instrumentStatus = useMemo(() => {
        const activeInstruments = currentPatient?.clinicalRecords?.activeInstruments || [];
        if (activeInstruments.length === 0) {
            return { status: 'pending', label: 'Pendente', color: 'amber', message: 'Nenhum instrumento ativo' };
        }

        let overdueCount = 0;
        let dueCount = 0;

        activeInstruments.forEach((inst: any) => {
            if (!inst.lastApplied) {
                dueCount++;
                return;
            }

            const lastDate = new Date(inst.lastApplied);
            const now = new Date();
            const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            const frequencyDays: Record<string, number> = {
                'Toda sessão': 7,
                'Semanal': 7,
                'Quinzenal': 14,
                'Mensal': 30,
                'Sob demanda': 999
            };

            const expected = frequencyDays[inst.frequency] || 7;
            if (daysSince > expected + 3) overdueCount++;
            else if (daysSince >= expected - 2) dueCount++;
        });

        if (overdueCount > 0) {
            return { status: 'overdue', label: 'Atrasado', color: 'red', message: `${overdueCount} instrumento(s) atrasado(s)` };
        } else if (dueCount > 0) {
            return { status: 'due', label: 'Pendente', color: 'amber', message: `${dueCount} para aplicar hoje` };
        }
        return { status: 'ok', label: 'Em dia', color: 'green', message: 'Todos instrumentos em dia' };
    }, [currentPatient]);

    // Get last session info
    const lastSession = useMemo(() => {
        const sessions = currentPatient?.clinicalRecords?.sessions || [];
        if (sessions.length === 0) return null;
        const session = sessions[0];
        return {
            date: session.date,
            number: sessions.length,
            summary: session.soap?.avaliacao || session.notes?.slice(0, 100) || 'Sem resumo'
        };
    }, [currentPatient]);

    // Get last assessment scores
    const lastAssessments = useMemo(() => {
        const assessments = currentPatient?.clinicalRecords?.assessments || [];
        const recent: Record<string, any> = {};
        assessments.forEach((a: any) => {
            if (!recent[a.type]) recent[a.type] = a;
        });
        return Object.values(recent).slice(0, 2);
    }, [currentPatient]);

    // Get GAS summary
    const gasSummary = useMemo(() => {
        const gasPlans: GASPlan[] = currentPatient?.eellsData?.gasPlans || [];
        const activePlan = gasPlans.find(p => p.status === 'active');
        if (!activePlan) return null;

        const activeMetas = activePlan.metas.filter((m: GASMeta) => m.status === 'active');
        if (activeMetas.length === 0) return null;

        const avgLevel = activeMetas.reduce((sum: number, m: GASMeta) => sum + m.currentLevel, 0) / activeMetas.length;
        return {
            count: activeMetas.length,
            avgLevel: avgLevel.toFixed(1)
        };
    }, [currentPatient]);

    const getRecommendations = () => {
        const disorder = currentPatient?.primaryDisorder || 'other';

        const recommendations: Record<string, any> = {
            panic: {
                specific: [
                    { name: 'PDSS-SR', desc: 'Panic Disorder Severity Scale', freq: 'Semanal' },
                    { name: 'Panic Appraisal Inventory', desc: 'Avaliação de catastrofização', freq: 'Quinzenal' }
                ],
                general: [
                    { name: 'BAI', desc: 'Beck Anxiety Inventory', freq: 'Toda sessão' },
                    { name: 'GAD-7', desc: 'Ansiedade geral', freq: 'Toda sessão' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            depression: {
                specific: [
                    { name: 'PHQ-9', desc: 'Patient Health Questionnaire', freq: 'Toda sessão' },
                    { name: 'BDI-II', desc: 'Beck Depression Inventory', freq: 'Semanal' }
                ],
                general: [
                    { name: 'BAI', desc: 'Ansiedade comórbida', freq: 'Quinzenal' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            },
            other: {
                specific: [],
                general: [
                    { name: 'PHQ-9', desc: 'Depressão', freq: 'Toda sessão' },
                    { name: 'GAD-7', desc: 'Ansiedade', freq: 'Toda sessão' }
                ],
                functionality: [
                    { name: 'WHODAS 2.0', desc: 'Funcionalidade', freq: 'Mensal' }
                ]
            }
        };

        return recommendations[disorder] || recommendations.other;
    };

    const recs = getRecommendations();

    const statusColors = {
        green: 'bg-green-100 text-green-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700'
    };

    const statusIcons = {
        green: <CheckCircle2 className="w-4 h-4" />,
        amber: <Clock className="w-4 h-4" />,
        red: <AlertTriangle className="w-4 h-4" />
    };

    return (
        <>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 p-6 hover:border-blue-200 transition-all">
                {/* Header with dynamic status */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Monitoramento Clínico</h3>
                            <p className="text-sm text-gray-500">Processo contínuo até alta</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusColors[instrumentStatus.color as keyof typeof statusColors]}`}>
                        {statusIcons[instrumentStatus.color as keyof typeof statusIcons]}
                        {instrumentStatus.label}
                    </div>
                </div>

                {/* Instruments Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-700">Instrumentos</span>
                    </div>
                    {lastAssessments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {lastAssessments.map((a: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                                    {a.type}: {a.score} pts
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">Nenhum instrumento aplicado ainda</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{instrumentStatus.message}</p>
                </div>

                {/* Last Session */}
                {lastSession && (
                    <div className="bg-purple-50 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-gray-700">Última Sessão ({new Date(lastSession.date).toLocaleDateString('pt-BR')})</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{lastSession.summary}</p>
                    </div>
                )}

                {/* GAS Summary */}
                {gasSummary && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-semibold text-gray-700">Metas GAS</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">{gasSummary.count} ativa(s)</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${parseFloat(gasSummary.avgLevel) >= 0 ? 'bg-green-500' : 'bg-orange-500'}`}>
                                    {parseFloat(gasSummary.avgLevel) > 0 ? '+' : ''}{gasSummary.avgLevel}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setShowRecommendations(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-md"
                >
                    <Lightbulb className="w-5 h-5" />
                    Instrumentos Recomendados
                </button>
            </div>

            {/* Modal de Recomendações */}
            {showRecommendations && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Lightbulb className="w-6 h-6" />
                                    Recomendações de Monitoramento
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    Baseado em: {currentPatient?.primaryDisorder ?
                                        currentPatient.primaryDisorder.toUpperCase() : 'Avaliação Geral'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowRecommendations(false)}
                                className="w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {recs.specific?.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        🎯 Instrumentos Específicos
                                    </h3>
                                    <div className="space-y-2">
                                        {recs.specific.map((inst: any, i: number) => (
                                            <div key={i} className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                        <p className="text-sm text-gray-600">{inst.desc}</p>
                                                    </div>
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                                        {inst.freq}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    ✅ Sintomas Gerais
                                </h3>
                                <div className="space-y-2">
                                    {recs.general.map((inst: any, i: number) => (
                                        <div key={i} className="bg-gray-50 border-2 border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                    <p className="text-sm text-gray-600">{inst.desc}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                                    {inst.freq}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    📊 Funcionalidade
                                </h3>
                                <div className="space-y-2">
                                    {recs.functionality.map((inst: any, i: number) => (
                                        <div key={i} className="bg-green-50 border-2 border-green-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{inst.name}</h4>
                                                    <p className="text-sm text-gray-600">{inst.desc}</p>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                                    {inst.freq}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
