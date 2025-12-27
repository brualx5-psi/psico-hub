import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { GASPlan, GASMeta, GASLevelDescriptions, Problem } from '../types/eells';
import { Target, Plus, Edit2, Trash2, ChevronDown, ChevronRight, CheckCircle2, Archive, TrendingUp, AlertCircle, History, Sparkles, Loader2 } from 'lucide-react';
import { generateSmartGoalLevels } from '../lib/gemini';

const LEVEL_LABELS = {
    '-2': 'Muito pior que o esperado',
    '-1': 'Pior que o esperado',
    '0': 'Meta esperada (baseline)',
    '+1': 'Melhor que o esperado',
    '+2': 'Muito melhor que o esperado'
};

const LEVEL_COLORS = {
    '-2': 'bg-red-600',
    '-1': 'bg-orange-500',
    '0': 'bg-yellow-500',
    '+1': 'bg-lime-500',
    '+2': 'bg-green-600'
};

const EMPTY_LEVELS: GASLevelDescriptions = {
    minus2: '',
    minus1: '',
    zero: '',
    plus1: '',
    plus2: ''
};

export const GASPanel: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isCreating, setIsCreating] = useState(false);
    const [isCreatingMeta, setIsCreatingMeta] = useState(false);
    const [editingMeta, setEditingMeta] = useState<GASMeta | null>(null);
    const [expandedMetas, setExpandedMetas] = useState<string[]>([]);

    // Form state
    const [planTitle, setPlanTitle] = useState('');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaLevels, setMetaLevels] = useState<GASLevelDescriptions>(EMPTY_LEVELS);
    const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
    const [isGeneratingSmart, setIsGeneratingSmart] = useState(false);

    const gasPlans = (currentPatient as any)?.eellsData?.gasPlans || [];
    const problemList: Problem[] = (currentPatient as any)?.eellsData?.problemList || [];
    const activePlan = gasPlans.find((p: GASPlan) => p.status === 'active');

    const toggleMetaExpand = (id: string) => {
        setExpandedMetas(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    const handleCreatePlan = () => {
        if (!planTitle.trim() || !currentPatient) return;

        const newPlan: GASPlan = {
            id: crypto.randomUUID(),
            title: planTitle,
            patientId: currentPatient.id,
            metas: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                gasPlans: [...gasPlans, newPlan]
            }
        } as any);

        setPlanTitle('');
        setIsCreating(false);
    };

    const handleSaveMeta = () => {
        if (!metaTitle.trim() || !activePlan || !currentPatient) return;

        const newMeta: GASMeta = {
            id: editingMeta?.id || crypto.randomUUID(),
            title: metaTitle,
            linkedProblems: selectedProblems,
            levels: metaLevels,
            evaluations: editingMeta?.evaluations || [],
            currentLevel: editingMeta?.currentLevel ?? 0,
            status: 'active',
            startDate: editingMeta?.startDate || new Date().toISOString(),
            createdAt: editingMeta?.createdAt || new Date().toISOString()
        };

        const updatedPlans = gasPlans.map((p: GASPlan) => {
            if (p.id === activePlan.id) {
                return {
                    ...p,
                    metas: editingMeta
                        ? p.metas.map((m: GASMeta) => m.id === editingMeta.id ? newMeta : m)
                        : [...p.metas, newMeta],
                    updatedAt: new Date().toISOString()
                };
            }
            return p;
        });

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                gasPlans: updatedPlans
            }
        } as any);

        resetForm();
    };

    const handleDeleteMeta = (metaId: string) => {
        if (!activePlan || !currentPatient) return;

        const updatedPlans = gasPlans.map((p: GASPlan) => {
            if (p.id === activePlan.id) {
                return {
                    ...p,
                    metas: p.metas.filter((m: GASMeta) => m.id !== metaId),
                    updatedAt: new Date().toISOString()
                };
            }
            return p;
        });

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                gasPlans: updatedPlans
            }
        } as any);
    };

    const handleEditMeta = (meta: GASMeta) => {
        setEditingMeta(meta);
        setMetaTitle(meta.title);
        setMetaLevels(meta.levels);
        setSelectedProblems(meta.linkedProblems);
        setIsCreatingMeta(true);
    };

    const resetForm = () => {
        setMetaTitle('');
        setMetaLevels(EMPTY_LEVELS);
        setSelectedProblems([]);
        setEditingMeta(null);
        setIsCreatingMeta(false);
    };

    const getLevelColor = (level: number) => {
        const key = level > 0 ? `+${level}` : `${level}`;
        return LEVEL_COLORS[key as keyof typeof LEVEL_COLORS] || 'bg-gray-400';
    };

    if (!currentPatient) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">GAS - Escala de Atingimento de Metas</h2>
                        <p className="text-sm text-gray-600">Defina e monitore metas usando a escala -2 a +2</p>
                    </div>
                </div>
            </div>

            {/* No Active Plan */}
            {!activePlan && !isCreating && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center border-2 border-dashed border-purple-200">
                    <Target className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum Plano GAS Ativo</h3>
                    <p className="text-gray-600 mb-6">Crie um plano para definir metas mensuráveis com 5 níveis de realização.</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Plano GAS
                    </button>
                </div>
            )}

            {/* Create Plan Form */}
            {isCreating && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Criar Plano GAS</h3>
                    <input
                        type="text"
                        placeholder="Ex: Plano de objetivos para tratamento de ansiedade - 1º semestre"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={handleCreatePlan}
                            disabled={!planTitle.trim()}
                            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Criar Plano
                        </button>
                        <button
                            onClick={() => { setIsCreating(false); setPlanTitle(''); }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Active Plan */}
            {activePlan && (
                <div className="space-y-6">
                    {/* Plan Header */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{activePlan.title}</h3>
                                <p className="text-sm text-gray-500">
                                    {activePlan.metas.filter((m: GASMeta) => m.status === 'active').length} meta(s) ativa(s)
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCreatingMeta(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Nova Meta
                            </button>
                        </div>

                        {/* Meta Form */}
                        {isCreatingMeta && (
                            <div className="bg-purple-50 rounded-xl p-6 mb-6 border border-purple-200">
                                <h4 className="font-bold text-gray-800 mb-4">
                                    {editingMeta ? 'Editar Meta' : 'Nova Meta'}
                                </h4>

                                {/* Meta Title */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Título da Meta</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Aumentar a frequência de comunicação verbal de 3 para 8 vezes por sessão"
                                        value={metaTitle}
                                        onChange={(e) => setMetaTitle(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Linked Problems */}
                                {problemList.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Problemas Vinculados</label>
                                        <div className="flex flex-wrap gap-2">
                                            {problemList.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProblems(prev =>
                                                            prev.includes(p.id)
                                                                ? prev.filter(id => id !== p.id)
                                                                : [...prev, p.id]
                                                        );
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedProblems.includes(p.id)
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    {p.problem}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Level Descriptions */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-semibold text-gray-700">Níveis de Realização</label>
                                    </div>

                                    {/* SMART Generation Button */}
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-2">
                                            Use IA para gerar sugestões SMART baseadas no título da meta.
                                            <br />
                                            <span className="text-purple-600">Dica: Inclua detalhes específicos como métricas, percentuais e prazos para melhores resultados.</span>
                                        </p>
                                        <button
                                            onClick={async () => {
                                                if (!metaTitle.trim()) {
                                                    alert('Digite o título da meta primeiro!');
                                                    return;
                                                }
                                                setIsGeneratingSmart(true);
                                                try {
                                                    const levels = await generateSmartGoalLevels(metaTitle);
                                                    setMetaLevels(levels);
                                                } catch (error) {
                                                    console.error('Error:', error);
                                                    alert('Erro ao gerar sugestões. Tente novamente.');
                                                } finally {
                                                    setIsGeneratingSmart(false);
                                                }
                                            }}
                                            disabled={isGeneratingSmart || !metaTitle.trim()}
                                            className="w-full py-3 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-purple-200"
                                        >
                                            {isGeneratingSmart ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Gerando sugestões...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    Gerar sugestões seguindo o modelo SMART
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {[
                                        { key: 'minus2', label: '-2', desc: 'Muito pior que o esperado', color: 'border-red-500', bg: 'bg-red-50' },
                                        { key: 'minus1', label: '-1', desc: 'Pior que o esperado', color: 'border-orange-500', bg: 'bg-orange-50' },
                                        { key: 'zero', label: '0', desc: 'Meta esperada (baseline)', color: 'border-yellow-500', bg: 'bg-yellow-50' },
                                        { key: 'plus1', label: '+1', desc: 'Melhor que o esperado', color: 'border-lime-500', bg: 'bg-lime-50' },
                                        { key: 'plus2', label: '+2', desc: 'Muito melhor que o esperado', color: 'border-green-500', bg: 'bg-green-50' }
                                    ].map(({ key, label, desc, color, bg }) => (
                                        <div key={key} className={`flex items-start gap-3 p-3 rounded-lg ${bg} border-l-4 ${color}`}>
                                            <span className="font-bold text-gray-700 w-8">{label}</span>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-600 mb-1">{desc}</p>
                                                <input
                                                    type="text"
                                                    placeholder={`Descreva o nível ${label}...`}
                                                    value={metaLevels[key as keyof GASLevelDescriptions]}
                                                    onChange={(e) => setMetaLevels(prev => ({ ...prev, [key]: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleSaveMeta}
                                        disabled={!metaTitle.trim()}
                                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {editingMeta ? 'Salvar Alterações' : 'Adicionar Meta'}
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Meta List */}
                        <div className="space-y-4">
                            {activePlan.metas.length === 0 && !isCreatingMeta && (
                                <p className="text-gray-500 text-center py-8">
                                    Nenhuma meta definida ainda. Clique em "Nova Meta" para começar.
                                </p>
                            )}

                            {activePlan.metas.map((meta: GASMeta) => (
                                <div key={meta.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                    {/* Meta Header */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => toggleMetaExpand(meta.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {expandedMetas.includes(meta.id) ? (
                                                <ChevronDown className="w-5 h-5 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            )}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getLevelColor(meta.currentLevel)}`}>
                                                {meta.currentLevel > 0 ? `+${meta.currentLevel}` : meta.currentLevel}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{meta.title}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {meta.evaluations.length} avaliação(ões) • Criada em {new Date(meta.createdAt).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditMeta(meta); }}
                                                className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteMeta(meta.id); }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedMetas.includes(meta.id) && (
                                        <div className="border-t border-gray-200 p-4 bg-white">
                                            {/* Level Descriptions */}
                                            <div className="mb-4">
                                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Níveis de Realização</h5>
                                                <div className="space-y-2">
                                                    {[
                                                        { key: 'minus2', label: '-2', color: 'bg-red-100 border-red-300' },
                                                        { key: 'minus1', label: '-1', color: 'bg-orange-100 border-orange-300' },
                                                        { key: 'zero', label: '0', color: 'bg-yellow-100 border-yellow-300' },
                                                        { key: 'plus1', label: '+1', color: 'bg-lime-100 border-lime-300' },
                                                        { key: 'plus2', label: '+2', color: 'bg-green-100 border-green-300' }
                                                    ].map(({ key, label, color }) => (
                                                        <div
                                                            key={key}
                                                            className={`flex items-center gap-3 p-2 rounded ${color} border ${meta.currentLevel === parseInt(label) ? 'ring-2 ring-purple-500' : ''}`}
                                                        >
                                                            <span className="font-bold w-8 text-gray-700">{label}</span>
                                                            <span className="text-sm text-gray-600">
                                                                {meta.levels[key as keyof GASLevelDescriptions] || <span className="italic text-gray-400">Não definido</span>}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Linked Problems */}
                                            {meta.linkedProblems.length > 0 && (
                                                <div className="mb-4">
                                                    <h5 className="text-sm font-semibold text-gray-700 mb-2">Problemas Vinculados</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {meta.linkedProblems.map(pId => {
                                                            const problem = problemList.find(p => p.id === pId);
                                                            return problem ? (
                                                                <span key={pId} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                                                                    {problem.problem}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Evaluation History */}
                                            {meta.evaluations.length > 0 && (
                                                <div>
                                                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                                        <History className="w-4 h-4" />
                                                        Histórico de Avaliações
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {meta.evaluations.slice().reverse().map(ev => (
                                                            <div key={ev.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getLevelColor(ev.level)}`}>
                                                                    {ev.level > 0 ? `+${ev.level}` : ev.level}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-gray-900">{ev.notes || 'Sem observações'}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Date(ev.date).toLocaleDateString('pt-BR')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GASPanel;
