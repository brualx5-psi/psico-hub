import React, { useState } from 'react';
import { EellsMechanisms, MechanismItem, CoreBelief, EvidenceLinks, ProblemDomain } from '../types/eells';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Sparkles, Brain, Shield, Target, Zap, Eye, Settings } from 'lucide-react';

interface MechanismsCardProps {
    mechanisms: EellsMechanisms;
    onChange: (mechanisms: EellsMechanisms) => void;
}

type QuadrantKey = 'precipitants' | 'origins' | 'resources' | 'obstacles';

const QUADRANT_CONFIG: Record<QuadrantKey, { title: string; placeholder: string; icon: React.ElementType; color: string; bgColor: string }> = {
    precipitants: {
        title: 'Precipitantes',
        placeholder: 'Ex: Demissão do trabalho, término de relacionamento...',
        icon: Zap,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200'
    },
    origins: {
        title: 'Origens',
        placeholder: 'Ex: Negligência na infância, bullying escolar...',
        icon: Target,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200'
    },
    resources: {
        title: 'Recursos / Forças',
        placeholder: 'Ex: Rede de apoio familiar, inteligência, motivação...',
        icon: Shield,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50 border-emerald-200'
    },
    obstacles: {
        title: 'Obstáculos',
        placeholder: 'Ex: Resistência à medicação, má adesão ao tratamento...',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200'
    }
};

const COMMON_PROCESSES = [
    'Evitação experiencial',
    'Ruminação',
    'Pensamento catastrófico',
    'Reforço negativo',
    'Esquemas de abandono',
    'Comportamento de segurança',
    'Fusão cognitiva',
    'Supressão emocional'
];

const COMMON_PATTERNS = [
    'Isolamento social',
    'Procrastinação',
    'Uso de substâncias',
    'Comportamento de checagem',
    'Fuga de situações',
    'Explosões de raiva',
    'Autolesão',
    'Compulsões alimentares'
];

export const MechanismsCard: React.FC<MechanismsCardProps> = ({ mechanisms, onChange }) => {
    const [expandedQuadrant, setExpandedQuadrant] = useState<QuadrantKey | null>(null);
    const [newItemText, setNewItemText] = useState<Record<QuadrantKey, string>>({
        precipitants: '', origins: '', resources: '', obstacles: ''
    });

    // Helper to add item to quadrant
    const addItem = (quadrant: QuadrantKey) => {
        const text = newItemText[quadrant].trim();
        if (!text) return;

        const newItem: MechanismItem = {
            id: crypto.randomUUID(),
            text,
            date: new Date().toISOString().split('T')[0]
        };

        onChange({
            ...mechanisms,
            [quadrant]: [...(mechanisms[quadrant] || []), newItem]
        });

        setNewItemText(prev => ({ ...prev, [quadrant]: '' }));
    };

    // Helper to remove item
    const removeItem = (quadrant: QuadrantKey, itemId: string) => {
        onChange({
            ...mechanisms,
            [quadrant]: (mechanisms[quadrant] || []).filter(item => item.id !== itemId)
        });
    };

    // Helper to toggle N/A
    const toggleNA = (quadrant: QuadrantKey) => {
        const naKey = `${quadrant}NA` as keyof EellsMechanisms;
        onChange({
            ...mechanisms,
            [naKey]: !mechanisms[naKey]
        });
    };

    // Helper to update NA reason
    const updateNAReason = (quadrant: QuadrantKey, reason: string) => {
        const reasonKey = `${quadrant}NAReason` as keyof EellsMechanisms;
        onChange({
            ...mechanisms,
            [reasonKey]: reason
        });
    };

    // Helper to add process/pattern
    const addProcess = (process: string) => {
        const existing = mechanisms.maintainingProcesses || [];
        if (existing.includes(process)) return;
        onChange({
            ...mechanisms,
            maintainingProcesses: [...existing, process]
        });
    };

    const removeProcess = (process: string) => {
        onChange({
            ...mechanisms,
            maintainingProcesses: (mechanisms.maintainingProcesses || []).filter(p => p !== process)
        });
    };

    const addPattern = (pattern: string) => {
        const existing = mechanisms.observablePatterns || [];
        if (existing.includes(pattern)) return;
        onChange({
            ...mechanisms,
            observablePatterns: [...existing, pattern]
        });
    };

    const removePattern = (pattern: string) => {
        onChange({
            ...mechanisms,
            observablePatterns: (mechanisms.observablePatterns || []).filter(p => p !== pattern)
        });
    };

    // Update evidence links
    const updateEvidenceLink = (key: keyof EvidenceLinks, value: boolean) => {
        onChange({
            ...mechanisms,
            evidenceLinks: {
                ...(mechanisms.evidenceLinks || {}),
                [key]: value
            }
        });
    };

    // Render quadrant card
    const renderQuadrant = (quadrant: QuadrantKey) => {
        const config = QUADRANT_CONFIG[quadrant];
        const items = mechanisms[quadrant] || [];
        const naKey = `${quadrant}NA` as keyof EellsMechanisms;
        const reasonKey = `${quadrant}NAReason` as keyof EellsMechanisms;
        const isNA = mechanisms[naKey] as boolean;
        const naReason = (mechanisms[reasonKey] as string) || '';
        const isExpanded = expandedQuadrant === quadrant;
        const Icon = config.icon;

        return (
            <div key={quadrant} className={`rounded-xl border-2 ${config.bgColor} overflow-hidden`}>
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 cursor-pointer"
                    onClick={() => setExpandedQuadrant(isExpanded ? null : quadrant)}
                >
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <h4 className={`font-bold ${config.color}`}>{config.title}</h4>
                        <span className="px-2 py-0.5 bg-white/60 text-gray-600 text-xs rounded-full">
                            {isNA ? 'N/A' : `${items.length} item(s)`}
                        </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="p-3 pt-0 space-y-3 bg-white/50">
                        {/* N/A Toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={isNA || false}
                                onChange={() => toggleNA(quadrant)}
                                className="rounded"
                            />
                            Não aplicável (N/A)
                        </label>

                        {isNA ? (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Justificativa (min. 10 caracteres):</label>
                                <input
                                    type="text"
                                    value={naReason}
                                    onChange={(e) => updateNAReason(quadrant, e.target.value)}
                                    placeholder="Ex: Caso atípico, informação indisponível..."
                                    className={`w-full px-3 py-2 border rounded-lg text-sm ${naReason.length < 10 ? 'border-red-300' : 'border-gray-200'}`}
                                />
                                {naReason.length < 10 && (
                                    <p className="text-xs text-red-500 mt-1">Justificativa deve ter pelo menos 10 caracteres</p>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Existing Items */}
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                                            <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                                            {item.date && <span className="text-xs text-gray-400">{item.date}</span>}
                                            <button
                                                onClick={() => removeItem(quadrant, item.id)}
                                                className="p-1 hover:bg-red-100 rounded text-red-500"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add New Item */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItemText[quadrant]}
                                        onChange={(e) => setNewItemText(prev => ({ ...prev, [quadrant]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && addItem(quadrant)}
                                        placeholder={config.placeholder}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={() => addItem(quadrant)}
                                        className={`px-3 py-2 ${config.bgColor} ${config.color} rounded-lg font-medium text-sm`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Title */}
            <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-800">Mecanismos</h3>
                <span className="text-sm text-gray-500">(Hipótese Explicativa)</span>
            </div>

            {/* 4 Quadrants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['precipitants', 'origins', 'resources', 'obstacles'] as QuadrantKey[]).map(renderQuadrant)}
            </div>

            {/* Maintaining Processes */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-indigo-800">Processos Mantenedores</h4>
                    <span className="text-xs text-indigo-600">(POR QUÊ mantém o problema)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(mechanisms.maintainingProcesses || []).map(p => (
                        <span key={p} className="px-3 py-1.5 bg-indigo-500 text-white rounded-full text-sm flex items-center gap-1">
                            {p}
                            <button onClick={() => removeProcess(p)} className="ml-1 hover:text-red-200">×</button>
                        </span>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {COMMON_PROCESSES.filter(p => !(mechanisms.maintainingProcesses || []).includes(p)).map(p => (
                        <button
                            key={p}
                            onClick={() => addProcess(p)}
                            className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-full text-sm hover:bg-indigo-100"
                        >
                            + {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Observable Patterns */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-teal-600" />
                    <h4 className="font-bold text-teal-800">Padrões Observáveis</h4>
                    <span className="text-xs text-teal-600">(O QUÊ a pessoa faz)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(mechanisms.observablePatterns || []).map(p => (
                        <span key={p} className="px-3 py-1.5 bg-teal-500 text-white rounded-full text-sm flex items-center gap-1">
                            {p}
                            <button onClick={() => removePattern(p)} className="ml-1 hover:text-red-200">×</button>
                        </span>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    {COMMON_PATTERNS.filter(p => !(mechanisms.observablePatterns || []).includes(p)).map(p => (
                        <button
                            key={p}
                            onClick={() => addPattern(p)}
                            className="px-3 py-1.5 bg-white text-teal-600 border border-teal-200 rounded-full text-sm hover:bg-teal-100"
                        >
                            + {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Evidence Links */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gray-600" />
                    <h4 className="font-bold text-gray-700">Evidências Vinculadas</h4>
                </div>

                <div className="flex flex-wrap gap-4">
                    {[
                        { key: 'hasPbtNetwork', label: 'Rede PBT' },
                        { key: 'hasClinicalNotes', label: 'Notas Clínicas' },
                        { key: 'hasInstruments', label: 'Instrumentos/Escalas' },
                        { key: 'hasExternalSources', label: 'Fontes Externas' }
                    ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={(mechanisms.evidenceLinks as any)?.[key] || false}
                                onChange={(e) => updateEvidenceLink(key as keyof EvidenceLinks, e.target.checked)}
                                className="rounded"
                            />
                            {label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};
