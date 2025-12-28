import React, { useState } from 'react';
import { Calendar, Plus, Check, X, Clock, Edit2, Search, Tag } from 'lucide-react';
import { AssessmentFrequency } from '../types/eells';
import { INSTRUMENTS_LIBRARY, Instrument } from '../data/instruments';

// Nova estrutura: frequência por instrumento
interface ScheduledInstrument {
    id: string;
    instrumentId: string; // Link para INSTRUMENTS_LIBRARY
    name: string;
    frequency: AssessmentFrequency;
    customDays?: number;
    lastApplied?: string;
    category?: string;
}

interface AssessmentScheduleV2 {
    instruments: ScheduledInstrument[];
    lastUpdated?: string;
}

interface AssessmentScheduleCardProps {
    schedule: AssessmentScheduleV2 | any | undefined;
    isNA: boolean;
    onScheduleChange: (schedule: AssessmentScheduleV2) => void;
    onNAChange: (isNA: boolean) => void;
}

const FREQUENCY_OPTIONS: { value: AssessmentFrequency; label: string }[] = [
    { value: 'sessao', label: 'A cada sessão' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quinzenal', label: 'Quinzenal' },
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'personalizado', label: 'Personalizado' },
];

// Mapear frequência do instrumento para AssessmentFrequency
const mapFrequency = (freq: Instrument['frequency']): AssessmentFrequency => {
    const map: Record<string, AssessmentFrequency> = {
        'Toda sessão': 'sessao',
        'Semanal': 'semanal',
        'Quinzenal': 'quinzenal',
        'Mensal': 'mensal',
        'Sob demanda': 'quando_indicado',
        'Diário': 'semanal'
    };
    return map[freq] || 'mensal';
};

export const AssessmentScheduleCard: React.FC<AssessmentScheduleCardProps> = ({
    schedule,
    isNA,
    onScheduleChange,
    onNAChange,
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Obter categorias únicas
    const categories = Array.from(new Set(INSTRUMENTS_LIBRARY.map(i => i.category)));

    // Migrar formato antigo para novo
    const getInstruments = (): ScheduledInstrument[] => {
        if (schedule?.instruments && Array.isArray(schedule.instruments)) {
            return schedule.instruments;
        }
        // Migrar formato antigo
        if (schedule?.core?.instruments) {
            return schedule.core.instruments.map((name: string) => {
                const found = INSTRUMENTS_LIBRARY.find(i =>
                    i.abbreviation === name || i.name === name
                );
                return {
                    id: crypto.randomUUID(),
                    instrumentId: found?.id || name,
                    name: found?.abbreviation || name,
                    frequency: (schedule.core.frequency as AssessmentFrequency) || 'mensal',
                    category: found?.category
                };
            });
        }
        return [];
    };

    const instruments = getInstruments();

    // Filtrar instrumentos disponíveis
    const filteredLibrary = INSTRUMENTS_LIBRARY.filter(inst => {
        const notAdded = !instruments.some(i => i.instrumentId === inst.id);
        const matchesSearch = searchTerm === '' ||
            inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inst.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || inst.category === selectedCategory;
        return notAdded && matchesSearch && matchesCategory;
    }).slice(0, 20); // Limitar para performance

    const handleAddInstrument = (inst: Instrument) => {
        const newInstrument: ScheduledInstrument = {
            id: crypto.randomUUID(),
            instrumentId: inst.id,
            name: inst.abbreviation,
            frequency: mapFrequency(inst.frequency),
            category: inst.category
        };

        onScheduleChange({
            instruments: [...instruments, newInstrument],
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        setShowPicker(false);
        setSearchTerm('');
    };

    const handleRemoveInstrument = (id: string) => {
        onScheduleChange({
            instruments: instruments.filter(i => i.id !== id),
            lastUpdated: new Date().toISOString().split('T')[0]
        });
    };

    const handleUpdateFrequency = (id: string, frequency: AssessmentFrequency, customDays?: number) => {
        onScheduleChange({
            instruments: instruments.map(i =>
                i.id === id ? { ...i, frequency, customDays } : i
            ),
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        if (frequency !== 'personalizado') {
            setEditingId(null);
        }
    };

    const getFrequencyLabel = (freq: AssessmentFrequency, customDays?: number) => {
        if (freq === 'personalizado' && customDays) {
            return `${customDays} dias`;
        }
        return FREQUENCY_OPTIONS.find(f => f.value === freq)?.label || freq;
    };

    const getFrequencyColor = (freq: AssessmentFrequency) => {
        switch (freq) {
            case 'sessao': return 'bg-purple-100 text-purple-700';
            case 'semanal': return 'bg-green-100 text-green-700';
            case 'quinzenal': return 'bg-blue-100 text-blue-700';
            case 'mensal': return 'bg-amber-100 text-amber-700';
            case 'trimestral': return 'bg-gray-100 text-gray-700';
            case 'personalizado': return 'bg-indigo-100 text-indigo-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="bg-white border-2 border-teal-100 rounded-2xl p-6 hover:border-teal-200 transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Cronograma de Avaliações (MBC)</h3>
                        <p className="text-xs text-gray-500">
                            {INSTRUMENTS_LIBRARY.length} instrumentos disponíveis • Frequência individual
                        </p>
                    </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isNA}
                        onChange={(e) => onNAChange(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600">N/A</span>
                </label>
            </div>

            {/* Content */}
            {!isNA && (
                <div className="space-y-4">
                    {/* Instruments List */}
                    {instruments.length > 0 ? (
                        <div className="space-y-2">
                            {instruments.map(inst => {
                                const fullInstrument = INSTRUMENTS_LIBRARY.find(i => i.id === inst.instrumentId);
                                return (
                                    <div
                                        key={inst.id}
                                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="font-semibold text-gray-800">{inst.name}</div>
                                            <span className="text-xs text-gray-400 truncate hidden sm:block">
                                                {fullInstrument?.name || inst.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {editingId === inst.id ? (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={inst.frequency}
                                                        onChange={(e) => handleUpdateFrequency(inst.id, e.target.value as AssessmentFrequency)}
                                                        className="px-2 py-1 text-sm border border-gray-200 rounded-lg"
                                                    >
                                                        {FREQUENCY_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>

                                                    {inst.frequency === 'personalizado' && (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max="365"
                                                                value={inst.customDays || 10}
                                                                onChange={(e) => handleUpdateFrequency(inst.id, 'personalizado', parseInt(e.target.value) || 10)}
                                                                className="w-16 px-2 py-1 text-sm border border-gray-200 rounded-lg"
                                                            />
                                                            <span className="text-xs text-gray-500">dias</span>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1 bg-teal-100 text-teal-600 rounded"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFrequencyColor(inst.frequency)}`}>
                                                        {getFrequencyLabel(inst.frequency, inst.customDays)}
                                                    </span>
                                                    <button
                                                        onClick={() => setEditingId(inst.id)}
                                                        className="p-1 text-gray-400 hover:text-teal-600"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => handleRemoveInstrument(inst.id)}
                                                className="p-1 text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhum instrumento agendado</p>
                            <p className="text-xs">Adicione instrumentos da biblioteca para monitoramento</p>
                        </div>
                    )}

                    {/* Add Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowPicker(!showPicker)}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-teal-200 hover:border-teal-400 text-teal-600 hover:text-teal-700 rounded-xl transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Adicionar Instrumento da Biblioteca
                        </button>

                        {showPicker && (
                            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-h-96 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-600">Biblioteca de Instrumentos</span>
                                    <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Search & Filter */}
                                <div className="flex gap-2 mb-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar instrumento..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="px-2 py-2 text-sm border border-gray-200 rounded-lg"
                                    >
                                        <option value="">Todas</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Instruments Grid */}
                                <div className="overflow-y-auto flex-1 space-y-2">
                                    {filteredLibrary.map(inst => (
                                        <button
                                            key={inst.id}
                                            onClick={() => handleAddInstrument(inst)}
                                            className="w-full flex items-start justify-between p-3 text-left hover:bg-teal-50 rounded-lg transition-colors border border-gray-100 hover:border-teal-200"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-gray-800">{inst.abbreviation}</span>
                                                    {inst.hasForm && (
                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">
                                                            Form
                                                        </span>
                                                    )}
                                                    {inst.isNew && (
                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">
                                                            Novo
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{inst.name}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] ${getFrequencyColor(mapFrequency(inst.frequency))}`}>
                                                        {inst.frequency}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {inst.questionCount > 0 ? `${inst.questionCount}q` : ''} ~{inst.estimatedMinutes}min
                                                    </span>
                                                </div>
                                            </div>
                                            <Plus className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                                        </button>
                                    ))}

                                    {filteredLibrary.length === 0 && (
                                        <div className="text-center py-4 text-gray-400 text-sm">
                                            Nenhum instrumento encontrado
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {instruments.length > 0 && (
                        <div className="bg-teal-50 rounded-xl p-4">
                            <h4 className="font-semibold text-teal-800 mb-2">📋 Cronograma Configurado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                {instruments.map(inst => (
                                    <div key={inst.id} className="flex items-center justify-between text-teal-700 bg-white/60 rounded-lg p-2">
                                        <span className="font-medium">{inst.name}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getFrequencyColor(inst.frequency)}`}>
                                            {getFrequencyLabel(inst.frequency, inst.customDays)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* N/A State */}
            {isNA && (
                <div className="text-center py-6 text-gray-500">
                    <Check className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Marcado como não aplicável</p>
                </div>
            )}
        </div>
    );
};
