import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { Problem, ProblemDomain, ProblemListAgreement, SharedUnderstanding } from '../types/eells';
import { AlertCircle, Plus, Edit2, Trash2, Link as LinkIcon, Target, Users, Check, ChevronDown, ChevronUp } from 'lucide-react';

const DOMAIN_OPTIONS: { value: ProblemDomain; label: string; emoji: string }[] = [
    { value: 'trabalho', label: 'Trabalho', emoji: '💼' },
    { value: 'relacionamento', label: 'Relacionamento', emoji: '💑' },
    { value: 'familia', label: 'Família', emoji: '👨‍👩‍👧' },
    { value: 'saude', label: 'Saúde', emoji: '🏥' },
    { value: 'estudo', label: 'Estudo', emoji: '📚' },
    { value: 'financeiro', label: 'Financeiro', emoji: '💰' },
    { value: 'social', label: 'Social', emoji: '👥' },
    { value: 'outro', label: 'Outro', emoji: '📌' },
];

export const ProblemListCard: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAgreementPanel, setShowAgreementPanel] = useState(false);
    const [formData, setFormData] = useState<Partial<Problem>>({
        problem: '',
        frequency: '',
        severity: 5,
        functionalImpairment: '',
        linkedPbtNodes: [],
        status: 'active',
        priorityRank: undefined,
        isFocus: false,
        domains: [],
        functionalImpact: 5,
        triggerContext: ''
    });

    if (!currentPatient) return null;

    const eellsData = (currentPatient as any).eellsData || {};
    const problemList: Problem[] = eellsData.problemList || [];
    const agreement: ProblemListAgreement | undefined = eellsData.problemListAgreement;

    // Função de clamp para valores numéricos
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    // Detectar ranks duplicados para alertar usuário
    const activeProblems = problemList.filter((p: Problem) => p.status === 'active');
    const ranks = activeProblems.filter((p: Problem) => p.priorityRank != null).map((p: Problem) => p.priorityRank);
    const hasDuplicateRanks = ranks.length !== new Set(ranks).size;

    const handleSave = () => {
        if (!formData.problem) return;

        const now = new Date().toISOString().split('T')[0];
        const newProblem: Problem = {
            id: editingId || crypto.randomUUID(),
            problem: formData.problem || '',
            priorityRank: formData.priorityRank,
            isFocus: formData.isFocus || false,
            domains: (formData.domains && formData.domains.length > 0) ? formData.domains : undefined,
            functionalImpact: formData.functionalImpact != null ? clamp(formData.functionalImpact, 0, 10) : undefined,
            triggerContext: formData.triggerContext,
            frequency: formData.frequency || '',
            severity: clamp(formData.severity || 5, 0, 10),
            functionalImpairment: formData.functionalImpairment || '',
            linkedPbtNodes: formData.linkedPbtNodes || [],
            status: formData.status || 'active',
            createdAt: editingId ? (problemList.find((p: Problem) => p.id === editingId)?.createdAt || now) : now,
            updatedAt: editingId ? now : undefined
        };

        const updatedList = editingId
            ? problemList.map((p: Problem) => p.id === editingId ? newProblem : p)
            : [...problemList, newProblem];

        updatePatient({
            ...currentPatient,
            eellsData: { ...eellsData, problemList: updatedList }
        } as any);

        resetForm();
    };

    const resetForm = () => {
        setFormData({
            problem: '', frequency: '', severity: 5, functionalImpairment: '',
            linkedPbtNodes: [], status: 'active', priorityRank: undefined,
            isFocus: false, domains: [], functionalImpact: 5, triggerContext: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleEdit = (problem: Problem) => {
        setFormData(problem);
        setEditingId(problem.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Deletar este problema?')) return;
        const updatedList = problemList.filter((p: Problem) => p.id !== id);
        updatePatient({
            ...currentPatient,
            eellsData: { ...eellsData, problemList: updatedList }
        } as any);
    };

    const handleToggleFocus = (id: string) => {
        const updatedList = problemList.map((p: Problem) => ({
            ...p,
            isFocus: p.id === id ? !p.isFocus : p.isFocus
        }));
        updatePatient({
            ...currentPatient,
            eellsData: { ...eellsData, problemList: updatedList }
        } as any);
    };

    const handleSetRank = (id: string, rank: number) => {
        const updatedList = problemList.map((p: Problem) =>
            p.id === id ? { ...p, priorityRank: rank } : p
        );
        updatePatient({
            ...currentPatient,
            eellsData: { ...eellsData, problemList: updatedList }
        } as any);
    };

    const handleSaveAgreement = (sharedUnderstanding: SharedUnderstanding) => {
        const newAgreement: ProblemListAgreement = {
            sharedUnderstanding,
            priorityProblems: problemList.filter(p => p.isFocus || (p.priorityRank && p.priorityRank <= 3)).map(p => p.id),
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        updatePatient({
            ...currentPatient,
            eellsData: { ...eellsData, problemListAgreement: newAgreement }
        } as any);
    };

    const toggleDomain = (domain: ProblemDomain) => {
        const current = formData.domains || [];
        if (current.includes(domain)) {
            setFormData({ ...formData, domains: current.filter(d => d !== domain) });
        } else {
            setFormData({ ...formData, domains: [...current, domain] });
        }
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 8) return 'text-red-600 bg-red-50 border-red-200';
        if (severity >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };

    // Sort by priority rank
    const sortedProblems = [...problemList].sort((a, b) => {
        if (a.isFocus && !b.isFocus) return -1;
        if (!a.isFocus && b.isFocus) return 1;
        if (a.priorityRank && b.priorityRank) return a.priorityRank - b.priorityRank;
        if (a.priorityRank) return -1;
        if (b.priorityRank) return 1;
        return 0;
    });

    return (
        <div className="bg-white rounded-2xl p-6 border-2 border-red-100 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        Lista de Problemas
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">
                            {problemList.length} problema(s) • {problemList.filter(p => p.isFocus).length} em foco
                        </p>
                        {hasDuplicateRanks && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                ⚠️ Ranks duplicados
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar
                </button>
            </div>

            {/* Agreement Status */}
            <div
                className={`mb-4 p-3 rounded-xl cursor-pointer transition-all ${agreement?.sharedUnderstanding?.reviewed
                    ? 'bg-emerald-50 border-2 border-emerald-200'
                    : 'bg-amber-50 border-2 border-amber-200'
                    }`}
                onClick={() => setShowAgreementPanel(!showAgreementPanel)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-700">Acordo Terapeuta-Cliente</span>
                        {agreement?.sharedUnderstanding?.reviewed && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${agreement.sharedUnderstanding.agreement === 'sim' ? 'bg-emerald-100 text-emerald-700' :
                                agreement.sharedUnderstanding.agreement === 'parcial' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {agreement.sharedUnderstanding.agreement === 'sim' ? '✓ Concorda' :
                                    agreement.sharedUnderstanding.agreement === 'parcial' ? '◐ Parcial' : '✗ Não concorda'}
                            </span>
                        )}
                    </div>
                    {showAgreementPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                {showAgreementPanel && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={agreement?.sharedUnderstanding?.reviewed || false}
                                    onChange={(e) => handleSaveAgreement({
                                        ...agreement?.sharedUnderstanding || { agreement: 'sim' as const },
                                        reviewed: e.target.checked,
                                        lastReviewedAt: new Date().toISOString().split('T')[0]
                                    })}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm">Revisado com paciente</span>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Concordância:</label>
                            <div className="flex gap-2">
                                {(['sim', 'parcial', 'nao'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => handleSaveAgreement({
                                            ...agreement?.sharedUnderstanding || { reviewed: true },
                                            agreement: level,
                                            lastReviewedAt: new Date().toISOString().split('T')[0]
                                        })}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${agreement?.sharedUnderstanding?.agreement === level
                                            ? level === 'sim' ? 'bg-emerald-500 text-white'
                                                : level === 'parcial' ? 'bg-amber-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {level === 'sim' ? 'Sim' : level === 'parcial' ? 'Parcial' : 'Não'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Notas de divergência:</label>
                            <input
                                type="text"
                                value={agreement?.sharedUnderstanding?.notes || ''}
                                onChange={(e) => handleSaveAgreement({
                                    ...agreement?.sharedUnderstanding || { reviewed: true, agreement: 'sim' as const },
                                    notes: e.target.value
                                })}
                                placeholder="Ex: Paciente não reconhece problema X como prioritário"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="mb-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border-2 border-red-200">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Problema *</label>
                            <input
                                type="text"
                                value={formData.problem}
                                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                                placeholder="Ex: Ataques de pânico"
                                className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {/* Prioridade e Foco */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Prioridade</label>
                                <select
                                    value={formData.priorityRank || ''}
                                    onChange={(e) => setFormData({ ...formData, priorityRank: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2"
                                >
                                    <option value="">-</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}º</option>)}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer pb-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isFocus || false}
                                        onChange={(e) => setFormData({ ...formData, isFocus: e.target.checked })}
                                        className="w-4 h-4 rounded text-red-600"
                                    />
                                    <span className="text-sm font-medium">🎯 Alvo atual</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Impacto (0-10)</label>
                                <input
                                    type="number" min="0" max="10"
                                    value={formData.functionalImpact}
                                    onChange={(e) => setFormData({ ...formData, functionalImpact: parseInt(e.target.value) })}
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* Domínios */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Onde afeta?</label>
                            <div className="flex flex-wrap gap-2">
                                {DOMAIN_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggleDomain(opt.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.domains?.includes(opt.value)
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {opt.emoji} {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contexto/Gatilho */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quando/Onde piora? (opcional)</label>
                            <input
                                type="text"
                                value={formData.triggerContext || ''}
                                onChange={(e) => setFormData({ ...formData, triggerContext: e.target.value })}
                                placeholder="Ex: Durante reuniões, em lugares cheios"
                                className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Frequência</label>
                                <input
                                    type="text"
                                    value={formData.frequency}
                                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="Ex: 3-4x por semana"
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Severidade (0-10)</label>
                                <input
                                    type="number" min="0" max="10"
                                    value={formData.severity}
                                    onChange={(e) => setFormData({ ...formData, severity: parseInt(e.target.value) })}
                                    className="w-full bg-white border-2 border-red-100 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 rounded-lg font-bold">
                                {editingId ? 'Salvar' : 'Adicionar'}
                            </button>
                            <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Problem List */}
            <div className="space-y-3">
                {sortedProblems.map((problem: Problem) => (
                    <div
                        key={problem.id}
                        className={`rounded-xl p-4 border-2 transition-all ${problem.isFocus
                            ? 'bg-gradient-to-br from-red-100 to-pink-100 border-red-300 shadow-md'
                            : 'bg-gradient-to-br from-white to-red-50 border-red-100 hover:border-red-200'
                            }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                {/* Badges */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {problem.isFocus && (
                                        <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                                            <Target className="w-3 h-3" /> Alvo Atual
                                        </span>
                                    )}
                                    {problem.priorityRank && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                            {problem.priorityRank}º prioridade
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getSeverityColor(problem.severity)}`}>
                                        Sev: {problem.severity}/10
                                    </span>
                                    {problem.functionalImpact !== undefined && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                            Impacto: {problem.functionalImpact}/10
                                        </span>
                                    )}
                                </div>

                                <h4 className="font-bold text-gray-900 mb-1">{problem.problem}</h4>

                                {/* Domains */}
                                {problem.domains && problem.domains.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {problem.domains.map(d => {
                                            const opt = DOMAIN_OPTIONS.find(o => o.value === d);
                                            return (
                                                <span key={d} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                    {opt?.emoji} {opt?.label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {problem.triggerContext && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold">Gatilho:</span> {problem.triggerContext}
                                    </p>
                                )}

                                {problem.frequency && (
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">Frequência:</span> {problem.frequency}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => handleToggleFocus(problem.id)}
                                    className={`p-2 rounded-lg transition-colors ${problem.isFocus ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-red-100 text-gray-600'
                                        }`}
                                    title={problem.isFocus ? 'Remover foco' : 'Definir como alvo'}
                                >
                                    <Target className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleEdit(problem)}
                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(problem.id)}
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {problemList.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Nenhum problema cadastrado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
