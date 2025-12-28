import React, { useState } from 'react';
import { EellsFormulationV2 } from '../types/eells';
import { FileText, Stethoscope, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, History } from 'lucide-react';

interface FormulationNarrativeCardProps {
    formulation: EellsFormulationV2;
    onChange: (formulation: EellsFormulationV2) => void;
}

export const FormulationNarrativeCard: React.FC<FormulationNarrativeCardProps> = ({ formulation, onChange }) => {
    const [showPredictions, setShowPredictions] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [newPrediction, setNewPrediction] = useState('');

    const narrativeLength = (formulation.explanatoryNarrative?.trim() || '').length;
    const isNarrativeValid = narrativeLength > 100;

    const diagnosisNAReasonLength = (formulation.diagnosisNAReason?.trim() || '').length;
    const isDiagnosisNAValid = formulation.diagnosisNA && diagnosisNAReasonLength >= 10;

    // Add prediction
    const addPrediction = () => {
        if (!newPrediction.trim()) return;
        onChange({
            ...formulation,
            testablePredictions: [...(formulation.testablePredictions || []), newPrediction.trim()]
        });
        setNewPrediction('');
    };

    // Remove prediction
    const removePrediction = (index: number) => {
        const updated = [...(formulation.testablePredictions || [])];
        updated.splice(index, 1);
        onChange({ ...formulation, testablePredictions: updated });
    };

    return (
        <div className="space-y-6">
            {/* Narrative Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-purple-600" />
                        <h3 className="text-xl font-bold text-purple-800">Narrativa Explicativa</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isNarrativeValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {narrativeLength} / 100 caracteres
                    </span>
                </div>

                <p className="text-sm text-purple-700">
                    Conecte os precipitantes com as origens/vulnerabilidades e explique como isso gera os problemas atuais.
                    Esta é a síntese causal do caso (modelo Eells).
                </p>

                <textarea
                    value={formulation.explanatoryNarrative || ''}
                    onChange={(e) => onChange({ ...formulation, explanatoryNarrative: e.target.value })}
                    className="w-full bg-white border-2 border-purple-200 rounded-xl p-4 text-gray-800 focus:outline-none focus:border-purple-400 min-h-[200px] resize-y font-serif leading-relaxed"
                    placeholder="Ex: Maria apresenta ataques de pânico que começaram após a demissão (precipitante), ativando esquemas de abandono formados na infância (origens). A evitação de situações sociais (processo mantenedor) alivia temporariamente a ansiedade mas reforça a crença de que é incapaz..."
                />

                {!isNarrativeValid && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        Narrativa deve ter pelo menos 100 caracteres para contar como completa
                    </div>
                )}

                {/* Case Summary (optional) */}
                <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Resumo do Caso (1-2 frases, opcional):</label>
                    <input
                        type="text"
                        value={formulation.caseSummary || ''}
                        onChange={(e) => onChange({ ...formulation, caseSummary: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-lg text-sm"
                        placeholder="Ex: Transtorno de pânico com agorafobia secundária a esquemas de abandono."
                    />
                </div>

                {/* Testable Predictions */}
                <div className="pt-2 border-t border-purple-200">
                    <button
                        onClick={() => setShowPredictions(!showPredictions)}
                        className="flex items-center gap-2 text-sm font-medium text-purple-600"
                    >
                        <Lightbulb className="w-4 h-4" />
                        Predições Testáveis (opcional, avançado)
                        {showPredictions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showPredictions && (
                        <div className="mt-3 space-y-2">
                            <p className="text-xs text-purple-600">
                                "Se [intervenção], então [resultado esperado]"
                            </p>
                            {(formulation.testablePredictions || []).map((pred, i) => (
                                <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                                    <span className="flex-1 text-sm text-gray-700">{pred}</span>
                                    <button
                                        onClick={() => removePrediction(i)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newPrediction}
                                    onChange={(e) => setNewPrediction(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addPrediction()}
                                    placeholder="Ex: Se reduzir evitação, ataques diminuirão em 50%"
                                    className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm"
                                />
                                <button onClick={addPrediction} className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium">
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Version History */}
                {(formulation.history?.length ?? 0) > 0 && (
                    <div className="pt-2 border-t border-purple-200">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 text-sm font-medium text-purple-600"
                        >
                            <History className="w-4 h-4" />
                            Histórico de Revisões ({formulation.history?.length})
                            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {showHistory && (
                            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                                {formulation.history?.map((entry) => (
                                    <div key={entry.id} className="bg-white p-3 rounded-lg border border-purple-100 text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-purple-500">
                                                {new Date(entry.date).toLocaleString('pt-BR')}
                                            </span>
                                            {entry.changedBy && (
                                                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                                                    {entry.changedBy}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-700 text-xs line-clamp-3">{entry.narrative}</p>
                                        {entry.changeReason && (
                                            <p className="text-xs text-gray-500 mt-1 italic">
                                                Motivo: {entry.changeReason}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Diagnosis Section */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-cyan-600" />
                    <h3 className="text-xl font-bold text-cyan-800">Diagnóstico</h3>
                </div>

                {/* N/A Toggle */}
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={formulation.diagnosisNA || false}
                        onChange={(e) => onChange({ ...formulation, diagnosisNA: e.target.checked })}
                        className="rounded"
                    />
                    Não aplicável / Em avaliação (N/A)
                </label>

                {formulation.diagnosisNA ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Justificativa (min. 10 caracteres):
                        </label>
                        <input
                            type="text"
                            value={formulation.diagnosisNAReason || ''}
                            onChange={(e) => onChange({ ...formulation, diagnosisNAReason: e.target.value })}
                            placeholder="Ex: Avaliação ainda em andamento, aguardando mais sessões..."
                            className={`w-full px-4 py-2 border rounded-lg text-sm ${diagnosisNAReasonLength < 10 ? 'border-red-300' : 'border-gray-200'}`}
                        />
                        {diagnosisNAReasonLength < 10 && (
                            <p className="text-xs text-red-500 mt-1">Justificativa deve ter pelo menos 10 caracteres</p>
                        )}
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-cyan-700 mb-1">Diagnóstico Primário (DSM-5 / CID-11):</label>
                            <input
                                type="text"
                                value={formulation.primaryDiagnosis || ''}
                                onChange={(e) => onChange({ ...formulation, primaryDiagnosis: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-lg text-sm"
                                placeholder="Ex: F41.0 Transtorno de Pânico"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-cyan-700 mb-1">Diagnósticos Diferenciais (opcional):</label>
                            <input
                                type="text"
                                value={(formulation.differentialDiagnosis || []).join(', ')}
                                onChange={(e) => onChange({
                                    ...formulation,
                                    differentialDiagnosis: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                                })}
                                className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-lg text-sm"
                                placeholder="Ex: F40.1 Fobia Social, F32.0 Episódio Depressivo Leve"
                            />
                        </div>
                    </>
                )}

                {/* Red Flags */}
                <div className="pt-3 border-t border-cyan-200 space-y-2">
                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Red Flags
                    </h4>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={formulation.suicidality || false}
                                onChange={(e) => onChange({ ...formulation, suicidality: e.target.checked })}
                                className="rounded"
                            />
                            Risco de Suicídio
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={formulation.chemicalDependence || false}
                                onChange={(e) => onChange({ ...formulation, chemicalDependence: e.target.checked })}
                                className="rounded"
                            />
                            Dependência Química
                        </label>
                    </div>
                    <input
                        type="text"
                        value={formulation.redFlags || ''}
                        onChange={(e) => onChange({ ...formulation, redFlags: e.target.value })}
                        className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm"
                        placeholder="Outros red flags ou observações de segurança..."
                    />
                </div>

                {/* Treatment Implications */}
                <div>
                    <label className="block text-sm font-medium text-cyan-700 mb-1">Implicações para o Tratamento (opcional):</label>
                    <textarea
                        value={formulation.treatmentImplications || ''}
                        onChange={(e) => onChange({ ...formulation, treatmentImplications: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-cyan-200 rounded-lg text-sm min-h-[80px]"
                        placeholder="Ex: Priorizar dessensibilização antes de trabalhar esquemas profundos..."
                    />
                </div>
            </div>
        </div>
    );
};
