import React, { useState } from 'react';
import { Plus, Trash2, FileText, Users, Stethoscope, GraduationCap, HelpCircle, Check, Clock, AlertCircle, X } from 'lucide-react';
import { ExternalSource, ExternalSourceType, ExternalSourceStatus, SourceReliability } from '../types/eells';

interface ExternalSourcesPanelProps {
    sources: ExternalSource[];
    isNA: boolean;
    onSourcesChange: (sources: ExternalSource[]) => void;
    onNAChange: (isNA: boolean) => void;
}

const SOURCE_TYPE_OPTIONS: { value: ExternalSourceType; label: string; icon: React.ReactNode }[] = [
    { value: 'prontuario', label: 'Prontuário Anterior', icon: <FileText className="w-4 h-4" /> },
    { value: 'familiar', label: 'Informação Familiar', icon: <Users className="w-4 h-4" /> },
    { value: 'laudo', label: 'Laudo/Parecer', icon: <Stethoscope className="w-4 h-4" /> },
    { value: 'exame', label: 'Exame Médico', icon: <Stethoscope className="w-4 h-4" /> },
    { value: 'escola', label: 'Escola/Instituição', icon: <GraduationCap className="w-4 h-4" /> },
    { value: 'outro', label: 'Outro', icon: <HelpCircle className="w-4 h-4" /> },
];

const STATUS_OPTIONS: { value: ExternalSourceStatus; label: string; color: string }[] = [
    { value: 'nao_aplicavel', label: 'N/A', color: 'bg-gray-100 text-gray-600' },
    { value: 'solicitado', label: 'Solicitado', color: 'bg-amber-100 text-amber-700' },
    { value: 'recebido', label: 'Recebido', color: 'bg-blue-100 text-blue-700' },
    { value: 'revisado', label: 'Revisado', color: 'bg-emerald-100 text-emerald-700' },
];

const RELIABILITY_OPTIONS: { value: SourceReliability; label: string }[] = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Média' },
    { value: 'baixa', label: 'Baixa' },
];

export const ExternalSourcesPanel: React.FC<ExternalSourcesPanelProps> = ({
    sources,
    isNA,
    onSourcesChange,
    onNAChange,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleAddSource = () => {
        const newSource: ExternalSource = {
            id: crypto.randomUUID(),
            type: 'prontuario',
            who: '',
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            summary: '',
            consent: false,
            reliability: 'media',
            status: 'solicitado',
        };
        onSourcesChange([...sources, newSource]);
        setEditingId(newSource.id);
        setIsExpanded(true);
    };

    const handleUpdateSource = (id: string, updates: Partial<ExternalSource>) => {
        onSourcesChange(
            sources.map(s => s.id === id ? { ...s, ...updates } : s)
        );
    };

    const handleRemoveSource = (id: string) => {
        onSourcesChange(sources.filter(s => s.id !== id));
    };

    const getTypeIcon = (type: ExternalSourceType) => {
        return SOURCE_TYPE_OPTIONS.find(o => o.value === type)?.icon || <FileText className="w-4 h-4" />;
    };

    const getStatusBadge = (status: ExternalSourceStatus) => {
        const option = STATUS_OPTIONS.find(o => o.value === status);
        return option ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                {option.label}
            </span>
        ) : null;
    };

    return (
        <div className="bg-white border-2 border-amber-100 rounded-2xl p-6 hover:border-amber-200 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Fontes Externas</h3>
                        <p className="text-xs text-gray-500">Prontuários, laudos, informações de familiares</p>
                    </div>
                </div>

                {/* N/A Toggle */}
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isNA}
                            onChange={(e) => onNAChange(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-sm text-gray-600">Não aplicável</span>
                    </label>
                </div>
            </div>

            {/* Content */}
            {!isNA && (
                <div className="space-y-4">
                    {/* Sources List */}
                    {sources.length > 0 && (
                        <div className="space-y-3">
                            {sources.map(source => (
                                <div
                                    key={source.id}
                                    className={`border rounded-xl p-4 transition-all ${editingId === source.id
                                            ? 'border-amber-300 bg-amber-50'
                                            : 'border-gray-200 bg-gray-50 hover:border-amber-200'
                                        }`}
                                >
                                    {editingId === source.id ? (
                                        /* Edit Mode */
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Type */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                                                    <select
                                                        value={source.type}
                                                        onChange={(e) => handleUpdateSource(source.id, { type: e.target.value as ExternalSourceType })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    >
                                                        {SOURCE_TYPE_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Who */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Quem/Origem</label>
                                                    <input
                                                        type="text"
                                                        value={source.who}
                                                        onChange={(e) => handleUpdateSource(source.id, { who: e.target.value })}
                                                        placeholder="Ex: Dr. João (psiquiatra)"
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>

                                                {/* Date */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                                                    <input
                                                        type="date"
                                                        value={source.date}
                                                        onChange={(e) => handleUpdateSource(source.id, { date: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>

                                                {/* Status */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                                    <select
                                                        value={source.status}
                                                        onChange={(e) => handleUpdateSource(source.id, { status: e.target.value as ExternalSourceStatus })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    >
                                                        {STATUS_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Reliability */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Confiabilidade</label>
                                                    <select
                                                        value={source.reliability}
                                                        onChange={(e) => handleUpdateSource(source.id, { reliability: e.target.value as SourceReliability })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    >
                                                        {RELIABILITY_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Consent */}
                                                <div className="flex items-center">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={source.consent}
                                                            onChange={(e) => handleUpdateSource(source.id, { consent: e.target.checked })}
                                                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                        />
                                                        <span className="text-sm text-gray-600">Consentimento obtido</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Summary */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Resumo do Conteúdo</label>
                                                <textarea
                                                    value={source.summary}
                                                    onChange={(e) => handleUpdateSource(source.id, { summary: e.target.value })}
                                                    placeholder="Resumo das informações relevantes..."
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="flex justify-between">
                                                <button
                                                    onClick={() => handleRemoveSource(source.id)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Remover
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="flex items-center gap-1 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Concluir
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div
                                            className="flex items-center justify-between cursor-pointer"
                                            onClick={() => setEditingId(source.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                                    {getTypeIcon(source.type)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800">
                                                            {SOURCE_TYPE_OPTIONS.find(o => o.value === source.type)?.label}
                                                        </span>
                                                        {getStatusBadge(source.status)}
                                                        {!source.consent && (
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                                                Sem consentimento
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {source.who || 'Origem não especificada'} • {source.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveSource(source.id);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Button */}
                    <button
                        onClick={handleAddSource}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-amber-200 hover:border-amber-400 text-amber-600 hover:text-amber-700 rounded-xl transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Fonte Externa
                    </button>

                    {/* Empty State */}
                    {sources.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Nenhuma fonte externa registrada.</p>
                            <p className="text-xs">Adicione prontuários, laudos ou informações de familiares.</p>
                        </div>
                    )}
                </div>
            )}

            {/* N/A State */}
            {isNA && (
                <div className="text-center py-6 text-gray-500">
                    <Check className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Marcado como não aplicável</p>
                    <p className="text-xs">Não há fontes externas relevantes para este caso.</p>
                </div>
            )}
        </div>
    );
};
