import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { GASPlan, GASMeta, GASEvaluation } from '../types/eells';
import { Target, ChevronDown, ChevronRight, Save, Plus, CheckCircle2 } from 'lucide-react';

const LEVEL_CONFIG = [
    { value: -2, label: '-2', name: 'Muito pior', color: 'bg-red-600', hover: 'hover:bg-red-700' },
    { value: -1, label: '-1', name: 'Pior', color: 'bg-orange-500', hover: 'hover:bg-orange-600' },
    { value: 0, label: '0', name: 'Esperado', color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
    { value: 1, label: '+1', name: 'Melhor', color: 'bg-lime-500', hover: 'hover:bg-lime-600' },
    { value: 2, label: '+2', name: 'Muito melhor', color: 'bg-green-600', hover: 'hover:bg-green-700' }
];

interface GASEvaluatorProps {
    sessionId?: string;
    onComplete?: () => void;
}

export const GASEvaluator: React.FC<GASEvaluatorProps> = ({ sessionId, onComplete }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [expandedMetas, setExpandedMetas] = useState<string[]>([]);
    const [evaluations, setEvaluations] = useState<Record<string, { level: number; notes: string }>>({});
    const [saved, setSaved] = useState(false);

    const gasPlans = (currentPatient as any)?.eellsData?.gasPlans || [];
    const activePlan = gasPlans.find((p: GASPlan) => p.status === 'active');
    const activeMetas = activePlan?.metas.filter((m: GASMeta) => m.status === 'active') || [];

    const toggleMeta = (id: string) => {
        setExpandedMetas(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const setEvaluation = (metaId: string, level: number) => {
        setEvaluations(prev => ({
            ...prev,
            [metaId]: { ...prev[metaId], level, notes: prev[metaId]?.notes || '' }
        }));
    };

    const setNotes = (metaId: string, notes: string) => {
        setEvaluations(prev => ({
            ...prev,
            [metaId]: { ...prev[metaId], notes, level: prev[metaId]?.level ?? 0 }
        }));
    };

    const handleSave = () => {
        if (!activePlan || !currentPatient) return;

        const updatedPlans = gasPlans.map((p: GASPlan) => {
            if (p.id !== activePlan.id) return p;

            return {
                ...p,
                metas: p.metas.map((m: GASMeta) => {
                    const ev = evaluations[m.id];
                    if (!ev) return m;

                    const newEvaluation: GASEvaluation = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        level: ev.level,
                        sessionId: sessionId,
                        notes: ev.notes
                    };

                    return {
                        ...m,
                        currentLevel: ev.level,
                        evaluations: [...m.evaluations, newEvaluation]
                    };
                }),
                updatedAt: new Date().toISOString()
            };
        });

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                gasPlans: updatedPlans
            }
        } as any);

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        onComplete?.();
    };

    if (!currentPatient) return null;

    if (!activePlan || activeMetas.length === 0) {
        return (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                <Target className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Nenhuma meta GAS ativa para avaliar.</p>
                <p className="text-sm text-gray-500">Crie metas na aba "Problemas & Metas".</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-gray-900">Avaliar Metas GAS</h3>
                </div>
                {Object.keys(evaluations).length > 0 && (
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all"
                    >
                        {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved ? 'Salvo!' : 'Salvar Avaliações'}
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {activeMetas.map((meta: GASMeta) => {
                    const isExpanded = expandedMetas.includes(meta.id);
                    const currentEval = evaluations[meta.id];
                    const displayLevel = currentEval?.level ?? meta.currentLevel;

                    return (
                        <div key={meta.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            {/* Meta Header */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleMeta(meta.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    <span className="font-medium text-gray-900">{meta.title}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-white text-sm font-bold ${LEVEL_CONFIG.find(l => l.value === displayLevel)?.color}`}>
                                    {displayLevel > 0 ? `+${displayLevel}` : displayLevel}
                                </div>
                            </div>

                            {/* Expanded Evaluation */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    {/* Level Selector */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nível Atual
                                        </label>
                                        <div className="flex gap-2">
                                            {LEVEL_CONFIG.map(({ value, label, name, color, hover }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => setEvaluation(meta.id, value)}
                                                    className={`flex-1 py-3 rounded-lg text-white font-bold transition-all ${color} ${hover} ${(currentEval?.level ?? meta.currentLevel) === value
                                                        ? 'ring-4 ring-offset-2 ring-purple-500 scale-105'
                                                        : 'opacity-70'
                                                        }`}
                                                >
                                                    <div className="text-lg">{label}</div>
                                                    <div className="text-xs font-normal opacity-90">{name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description Hint */}
                                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            <strong>Nível {displayLevel > 0 ? `+${displayLevel}` : displayLevel}:</strong>{' '}
                                            {(() => {
                                                const key = displayLevel === -2 ? 'minus2'
                                                    : displayLevel === -1 ? 'minus1'
                                                        : displayLevel === 0 ? 'zero'
                                                            : displayLevel === 1 ? 'plus1'
                                                                : 'plus2';
                                                return meta.levels[key] || 'Descrição não definida';
                                            })()}
                                        </p>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Observações / Evidências
                                        </label>
                                        <textarea
                                            placeholder="Descreva evidências ou observações sobre o progresso..."
                                            value={currentEval?.notes || ''}
                                            onChange={(e) => setNotes(meta.id, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GASEvaluator;
