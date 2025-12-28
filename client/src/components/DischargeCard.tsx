/**
 * DischargeCard - Avaliação de Prontidão para Alta e Prevenção de Recaída
 * Etapa 7 do modelo Eells
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    GraduationCap,
    Plus,
    X,
    Save,
    ChevronDown,
    ChevronUp,
    Target,
    AlertTriangle,
    Shield,
    Users,
    Phone,
    FileText,
    CheckCircle2,
    Circle,
    TrendingUp,
    Calendar,
    Edit3
} from 'lucide-react';
import {
    DischargeData,
    DischargeReadiness,
    DischargeCriterion,
    RelapsePrevention,
    WarningSign,
    CopingStrategy,
    DischargeStatus
} from '../types/eells';

// Critérios sugeridos por categoria
const SUGGESTED_CRITERIA: Omit<DischargeCriterion, 'id' | 'met' | 'metDate' | 'evidence'>[] = [
    // Sintomas
    { description: 'Sintomas principais em faixa mínima por 4+ semanas', category: 'sintomas', weight: 3 },
    { description: 'Sem episódios de crise nas últimas 6 semanas', category: 'sintomas', weight: 2 },

    // Funcionalidade
    { description: 'Retorno às atividades cotidianas', category: 'funcionalidade', weight: 3 },
    { description: 'Melhora nos relacionamentos interpessoais', category: 'funcionalidade', weight: 2 },
    { description: 'Funcionamento ocupacional satisfatório', category: 'funcionalidade', weight: 2 },

    // Mecanismos
    { description: 'Padrões disfuncionais identificados e modificados', category: 'mecanismos', weight: 3 },
    { description: 'Crenças nucleares flexibilizadas', category: 'mecanismos', weight: 2 },

    // Aliança/Autonomia
    { description: 'Paciente percebe progresso e confia nas próprias habilidades', category: 'autonomia', weight: 3 },
    { description: 'Usa estratégias aprendidas de forma independente', category: 'autonomia', weight: 3 },
    { description: 'Acordo mútuo sobre encerramento', category: 'alianca', weight: 2 },
];

// Cores por categoria
const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    sintomas: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-500' },
    funcionalidade: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    mecanismos: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    alianca: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    autonomia: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
};

export const DischargeCard: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [activeTab, setActiveTab] = useState<'readiness' | 'prevention'>('readiness');
    const [showAddCriterion, setShowAddCriterion] = useState(false);
    const [showAddWarning, setShowAddWarning] = useState(false);
    const [showAddStrategy, setShowAddStrategy] = useState(false);

    // Form states
    const [newCriterion, setNewCriterion] = useState({ description: '', category: 'sintomas' as DischargeCriterion['category'], weight: 2 });
    const [newWarning, setNewWarning] = useState({ description: '', category: 'comportamental' as WarningSign['category'], severity: 'precoce' as WarningSign['severity'] });
    const [newStrategy, setNewStrategy] = useState({ description: '', category: 'cognitiva' as CopingStrategy['category'] });

    // Dados atuais
    const dischargeData = useMemo((): DischargeData | null => {
        if (!currentPatient) return null;
        return (currentPatient as any).eellsData?.discharge || null;
    }, [currentPatient]);

    // Calcular status de prontidão
    const calculateStatus = (criteria: DischargeCriterion[]): { status: DischargeStatus; percent: number } => {
        if (criteria.length === 0) return { status: 'nao_indicada', percent: 0 };

        const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
        const metWeight = criteria.filter(c => c.met).reduce((sum, c) => sum + c.weight, 0);
        const percent = Math.round((metWeight / totalWeight) * 100);

        let status: DischargeStatus = 'nao_indicada';
        if (percent >= 75) status = 'indicada';
        else if (percent >= 50) status = 'em_preparacao';

        return { status, percent };
    };

    // Inicializar dados se não existirem
    const initializeDischargeData = (): DischargeData => ({
        readiness: {
            criteria: [],
            overallStatus: 'nao_indicada',
            percentMet: 0,
            lastEvaluated: new Date().toISOString(),
        },
        relapsePrevention: {
            warningSigns: [],
            copingStrategies: [],
            supportNetwork: [],
            emergencyContacts: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
        }
    });

    // Handlers
    const saveDischargeData = (updated: DischargeData) => {
        if (!currentPatient) return;

        const eellsData = (currentPatient as any).eellsData || {};
        updatePatient({
            ...currentPatient,
            eellsData: {
                ...eellsData,
                discharge: updated
            }
        } as any);
    };

    const toggleCriterion = (criterionId: string) => {
        const data = dischargeData || initializeDischargeData();
        const criteria = data.readiness.criteria.map(c =>
            c.id === criterionId
                ? { ...c, met: !c.met, metDate: !c.met ? new Date().toISOString() : undefined }
                : c
        );

        const { status, percent } = calculateStatus(criteria);

        saveDischargeData({
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                overallStatus: status,
                percentMet: percent,
                lastEvaluated: new Date().toISOString()
            }
        });
    };

    const addCriterion = () => {
        if (!newCriterion.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const criterion: DischargeCriterion = {
            id: crypto.randomUUID(),
            description: newCriterion.description,
            category: newCriterion.category,
            weight: newCriterion.weight,
            met: false
        };

        const criteria = [...data.readiness.criteria, criterion];
        const { status, percent } = calculateStatus(criteria);

        saveDischargeData({
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                overallStatus: status,
                percentMet: percent,
                lastEvaluated: new Date().toISOString()
            }
        });

        setNewCriterion({ description: '', category: 'sintomas', weight: 2 });
        setShowAddCriterion(false);
    };

    const addSuggestedCriteria = () => {
        const data = dischargeData || initializeDischargeData();
        const existingDescriptions = new Set(data.readiness.criteria.map(c => c.description));

        const newCriteria: DischargeCriterion[] = SUGGESTED_CRITERIA
            .filter(c => !existingDescriptions.has(c.description))
            .map(c => ({
                id: crypto.randomUUID(),
                ...c,
                met: false
            }));

        const criteria = [...data.readiness.criteria, ...newCriteria];
        const { status, percent } = calculateStatus(criteria);

        saveDischargeData({
            ...data,
            readiness: {
                ...data.readiness,
                criteria,
                overallStatus: status,
                percentMet: percent,
                lastEvaluated: new Date().toISOString()
            }
        });
    };

    const addWarningSign = () => {
        if (!newWarning.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const warning: WarningSign = {
            id: crypto.randomUUID(),
            description: newWarning.description,
            category: newWarning.category,
            severity: newWarning.severity
        };

        saveDischargeData({
            ...data,
            relapsePrevention: {
                ...data.relapsePrevention,
                warningSigns: [...data.relapsePrevention.warningSigns, warning],
                lastUpdated: new Date().toISOString()
            }
        });

        setNewWarning({ description: '', category: 'comportamental', severity: 'precoce' });
        setShowAddWarning(false);
    };

    const addCopingStrategy = () => {
        if (!newStrategy.description.trim()) return;

        const data = dischargeData || initializeDischargeData();
        const strategy: CopingStrategy = {
            id: crypto.randomUUID(),
            description: newStrategy.description,
            category: newStrategy.category,
            practiced: false
        };

        saveDischargeData({
            ...data,
            relapsePrevention: {
                ...data.relapsePrevention,
                copingStrategies: [...data.relapsePrevention.copingStrategies, strategy],
                lastUpdated: new Date().toISOString()
            }
        });

        setNewStrategy({ description: '', category: 'cognitiva' });
        setShowAddStrategy(false);
    };

    if (!currentPatient) return null;

    const data = dischargeData || initializeDischargeData();
    const { status, percent } = calculateStatus(data.readiness.criteria);

    // Cores do status
    const statusColors = {
        'nao_indicada': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Não Indicada' },
        'em_preparacao': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Em Preparação' },
        'indicada': { bg: 'bg-green-100', text: 'text-green-700', label: 'Indicada' },
        'alta_realizada': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Alta Realizada' }
    };

    const currentStatusColors = statusColors[status];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Alta e Prevenção de Recaída</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentStatusColors.bg} ${currentStatusColors.text}`}>
                                {currentStatusColors.label}
                            </span>
                            <span className="text-sm text-gray-500">{percent}% critérios</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all ${percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('readiness')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'readiness'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Target className="w-4 h-4 inline mr-1" />
                    Critérios de Alta
                </button>
                <button
                    onClick={() => setActiveTab('prevention')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'prevention'
                            ? 'text-emerald-600 border-b-2 border-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Shield className="w-4 h-4 inline mr-1" />
                    Prevenção de Recaída
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {activeTab === 'readiness' && (
                    <div className="space-y-4">
                        {/* Critérios */}
                        {data.readiness.criteria.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>Nenhum critério de alta definido.</p>
                                <button
                                    onClick={addSuggestedCriteria}
                                    className="mt-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                                >
                                    Adicionar critérios sugeridos
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.readiness.criteria.map(criterion => {
                                    const colors = CATEGORY_COLORS[criterion.category];
                                    return (
                                        <div
                                            key={criterion.id}
                                            className={`p-3 rounded-lg border ${criterion.met ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() => toggleCriterion(criterion.id)}
                                                    className="mt-0.5"
                                                >
                                                    {criterion.met ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300" />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <p className={`font-medium ${criterion.met ? 'text-green-800' : 'text-gray-700'}`}>
                                                        {criterion.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
                                                            {criterion.category}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            Peso: {criterion.weight}
                                                        </span>
                                                        {criterion.metDate && (
                                                            <span className="text-xs text-green-600">
                                                                ✓ {new Date(criterion.metDate).toLocaleDateString('pt-BR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Botão adicionar */}
                        <button
                            onClick={() => setShowAddCriterion(true)}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Adicionar critério
                        </button>
                    </div>
                )}

                {activeTab === 'prevention' && (
                    <div className="space-y-6">
                        {/* Sinais de Alerta */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    Sinais de Alerta
                                </h4>
                                <button
                                    onClick={() => setShowAddWarning(true)}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>

                            {data.relapsePrevention.warningSigns.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Nenhum sinal de alerta definido.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.relapsePrevention.warningSigns.map(sign => (
                                        <div key={sign.id} className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                                            <p className="text-amber-800">{sign.description}</p>
                                            <span className={`text-xs ${sign.severity === 'critico' ? 'text-red-600' :
                                                    sign.severity === 'moderado' ? 'text-amber-600' : 'text-green-600'
                                                }`}>
                                                {sign.severity} • {sign.category}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Estratégias de Enfrentamento */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    Estratégias de Enfrentamento
                                </h4>
                                <button
                                    onClick={() => setShowAddStrategy(true)}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar
                                </button>
                            </div>

                            {data.relapsePrevention.copingStrategies.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Nenhuma estratégia definida.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.relapsePrevention.copingStrategies.map(strategy => (
                                        <div key={strategy.id} className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                                            <p className="text-blue-800">{strategy.description}</p>
                                            <span className="text-xs text-blue-600">
                                                {strategy.category} {strategy.practiced && '• ✓ Praticado'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Adicionar Critério */}
            {showAddCriterion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Novo Critério de Alta</h3>
                            <button onClick={() => setShowAddCriterion(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newCriterion.description}
                                    onChange={(e) => setNewCriterion({ ...newCriterion, description: e.target.value })}
                                    placeholder="Ex: GAD-7 < 5 por 4+ semanas"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={newCriterion.category}
                                        onChange={(e) => setNewCriterion({ ...newCriterion, category: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="sintomas">Sintomas</option>
                                        <option value="funcionalidade">Funcionalidade</option>
                                        <option value="mecanismos">Mecanismos</option>
                                        <option value="alianca">Aliança</option>
                                        <option value="autonomia">Autonomia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                                    <select
                                        value={newCriterion.weight}
                                        onChange={(e) => setNewCriterion({ ...newCriterion, weight: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value={1}>1 - Menor</option>
                                        <option value={2}>2 - Médio</option>
                                        <option value={3}>3 - Maior</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddCriterion(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addCriterion}
                                disabled={!newCriterion.description.trim()}
                                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Sinal de Alerta */}
            {showAddWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Novo Sinal de Alerta</h3>
                            <button onClick={() => setShowAddWarning(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newWarning.description}
                                    onChange={(e) => setNewWarning({ ...newWarning, description: e.target.value })}
                                    placeholder="Ex: Voltar a evitar situações sociais"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={newWarning.category}
                                        onChange={(e) => setNewWarning({ ...newWarning, category: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="cognitivo">Cognitivo</option>
                                        <option value="comportamental">Comportamental</option>
                                        <option value="emocional">Emocional</option>
                                        <option value="fisiologico">Fisiológico</option>
                                        <option value="social">Social</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Severidade</label>
                                    <select
                                        value={newWarning.severity}
                                        onChange={(e) => setNewWarning({ ...newWarning, severity: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="precoce">Precoce</option>
                                        <option value="moderado">Moderado</option>
                                        <option value="critico">Crítico</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddWarning(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addWarningSign}
                                disabled={!newWarning.description.trim()}
                                className="flex-1 py-2 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Adicionar Estratégia */}
            {showAddStrategy && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">Nova Estratégia de Enfrentamento</h3>
                            <button onClick={() => setShowAddStrategy(false)}>
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    value={newStrategy.description}
                                    onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                                    placeholder="Ex: Usar respiração diafragmática"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={newStrategy.category}
                                    onChange={(e) => setNewStrategy({ ...newStrategy, category: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="cognitiva">Cognitiva</option>
                                    <option value="comportamental">Comportamental</option>
                                    <option value="social">Social</option>
                                    <option value="automonitoramento">Automonitoramento</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowAddStrategy(false)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={addCopingStrategy}
                                disabled={!newStrategy.description.trim()}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
