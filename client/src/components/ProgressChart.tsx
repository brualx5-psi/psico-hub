/**
 * ProgressChart - Gráficos de evolução por instrumento
 * Mostra tendência dos scores ao longo do tempo
 */

import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Area,
    AreaChart
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronDown,
    BarChart3,
    Calendar,
    Info
} from 'lucide-react';
import { InstrumentRecord, TemporalComparison } from '../types/eells';
import { calculateTemporalComparison } from '../lib/monitoring-utils';

// Cores por instrumento
const INSTRUMENT_COLORS: Record<string, string> = {
    'GAD-7': '#8B5CF6',    // Roxo
    'PHQ-9': '#3B82F6',    // Azul
    'BDI-II': '#0EA5E9',   // Azul claro
    'BAI': '#EC4899',      // Rosa
    'WAI': '#10B981',      // Verde
    'ORS': '#F59E0B',      // Âmbar
    'SRS': '#22C55E',      // Verde claro
    'default': '#6366F1'   // Indigo
};

// Faixas de severidade POR INSTRUMENTO (não universais!)
interface SeverityBand {
    value: number;
    label: string;
    color: string;
}

const INSTRUMENT_SEVERITY_BANDS: Record<string, SeverityBand[]> = {
    'GAD-7': [
        { value: 5, label: 'Mín (0-4)', color: '#22C55E' },
        { value: 10, label: 'Leve (5-9)', color: '#FBBF24' },
        { value: 15, label: 'Mod (10-14)', color: '#F97316' },
        // Grave: 15+
    ],
    'PHQ-9': [
        { value: 5, label: 'Mín (0-4)', color: '#22C55E' },
        { value: 10, label: 'Leve (5-9)', color: '#FBBF24' },
        { value: 15, label: 'Mod (10-14)', color: '#F97316' },
        { value: 20, label: 'Mod-Grave (15-19)', color: '#EF4444' },
        // Grave: 20+
    ],
    'BDI-II': [
        { value: 14, label: 'Mín (0-13)', color: '#22C55E' },
        { value: 20, label: 'Leve (14-19)', color: '#FBBF24' },
        { value: 29, label: 'Mod (20-28)', color: '#F97316' },
        // Grave: 29+
    ],
    'BAI': [
        { value: 8, label: 'Mín (0-7)', color: '#22C55E' },
        { value: 16, label: 'Leve (8-15)', color: '#FBBF24' },
        { value: 26, label: 'Mod (16-25)', color: '#F97316' },
        // Grave: 26+
    ],
    // Fallback genérico para instrumentos não mapeados
    'default': [
        { value: 5, label: 'Baixo', color: '#22C55E' },
        { value: 10, label: 'Médio', color: '#FBBF24' },
        { value: 15, label: 'Alto', color: '#F97316' },
    ]
};

interface ProgressChartProps {
    compact?: boolean;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ compact = false }) => {
    const { currentPatient } = usePatients();
    const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
    const [timeWindow, setTimeWindow] = useState<number>(8); // Últimas 8 sessões/aplicações

    // Obter todos os registros de instrumentos
    const { records, instruments, chartData, comparison } = useMemo(() => {
        if (!currentPatient) return { records: [], instruments: [], chartData: [], comparison: null };

        const eellsData = (currentPatient as any).eellsData;
        const allRecords: InstrumentRecord[] = eellsData?.monitoring?.instrumentRecords || [];

        // Agrupar por instrumento
        const byInstrument = allRecords.reduce((acc, record) => {
            if (!acc[record.instrumentName]) {
                acc[record.instrumentName] = [];
            }
            acc[record.instrumentName].push(record);
            return acc;
        }, {} as Record<string, InstrumentRecord[]>);

        const instrumentNames = Object.keys(byInstrument);
        const selected = selectedInstrument || instrumentNames[0] || null;

        // Preparar dados para gráfico do instrumento selecionado
        let chartData: any[] = [];
        let comparison: TemporalComparison | null = null;

        if (selected && byInstrument[selected]) {
            const instrumentRecords = byInstrument[selected]
                .filter(r => r.score !== null)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(-timeWindow);

            chartData = instrumentRecords.map((record, idx) => ({
                date: new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                fullDate: record.date,
                score: record.score,
                interpretation: record.interpretation,
                idx: idx + 1
            }));

            comparison = calculateTemporalComparison(allRecords, selected, 4);
        }

        return {
            records: allRecords,
            instruments: instrumentNames,
            chartData,
            comparison
        };
    }, [currentPatient, selectedInstrument, timeWindow]);

    if (!currentPatient) return null;

    if (records.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 text-gray-500">
                    <BarChart3 className="w-8 h-8 opacity-30" />
                    <div>
                        <p className="font-medium">Sem dados para gráfico</p>
                        <p className="text-sm">Aplique instrumentos para ver a evolução aqui.</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentInstrument = selectedInstrument || instruments[0];
    const instrumentColor = INSTRUMENT_COLORS[currentInstrument] || INSTRUMENT_COLORS.default;

    // Renderizar tendência
    const renderTrend = () => {
        if (!comparison) return null;

        const Icon = comparison.trend === 'melhorando' ? TrendingDown :
            comparison.trend === 'piorando' ? TrendingUp : Minus;

        const color = comparison.trend === 'melhorando' ? 'text-green-600' :
            comparison.trend === 'piorando' ? 'text-red-600' : 'text-gray-500';

        const bgColor = comparison.trend === 'melhorando' ? 'bg-green-50' :
            comparison.trend === 'piorando' ? 'bg-red-50' : 'bg-gray-50';

        return (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                    <span className={`font-bold ${color}`}>
                        {comparison.trend === 'melhorando' ? 'Melhorando' :
                            comparison.trend === 'piorando' ? 'Piorando' : 'Estável'}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                        ({comparison.deltaAbsolute > 0 ? '+' : ''}{comparison.deltaAbsolute} pts)
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Evolução por Instrumento</h3>
                        <p className="text-sm text-gray-500">{records.length} registros totais</p>
                    </div>
                </div>

                {/* Seletor de Instrumento */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select
                            value={currentInstrument}
                            onChange={(e) => setSelectedInstrument(e.target.value)}
                            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 font-medium text-gray-700 focus:ring-2 focus:ring-indigo-200"
                        >
                            {instruments.map(inst => (
                                <option key={inst} value={inst}>{inst}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {renderTrend()}
                </div>
            </div>

            {/* Gráfico */}
            <div className="p-4">
                {chartData.length > 1 ? (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`gradient-${currentInstrument}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={instrumentColor} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={instrumentColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#E5E7EB' }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 'auto']}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
                                                    <p className="text-xs text-gray-500">{data.fullDate}</p>
                                                    <p className="font-bold text-lg" style={{ color: instrumentColor }}>
                                                        Score: {data.score}
                                                    </p>
                                                    {data.interpretation && (
                                                        <p className="text-sm text-gray-600 capitalize">{data.interpretation}</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                {/* Linhas de referência para severidade (específicas por instrumento) */}
                                {(INSTRUMENT_SEVERITY_BANDS[currentInstrument] || INSTRUMENT_SEVERITY_BANDS.default).map((band, idx) => (
                                    <ReferenceLine
                                        key={idx}
                                        y={band.value}
                                        stroke={band.color}
                                        strokeDasharray="3 3"
                                    />
                                ))}

                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke={instrumentColor}
                                    strokeWidth={3}
                                    fill={`url(#gradient-${currentInstrument})`}
                                    dot={{ r: 4, fill: instrumentColor, stroke: '#fff', strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: instrumentColor, stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p>Apenas {chartData.length} registro(s) para {currentInstrument}</p>
                            <p className="text-sm">Precisa de 2+ para gerar gráfico</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Legenda de Severidade (específica por instrumento) */}
            <div className="px-4 pb-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>Faixas ({currentInstrument}):</span>
                    </div>
                    {(INSTRUMENT_SEVERITY_BANDS[currentInstrument] || INSTRUMENT_SEVERITY_BANDS.default).map((band, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <div className="w-3 h-0.5" style={{ backgroundColor: band.color }}></div>
                            <span>{band.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Estatísticas Rápidas */}
            {comparison && chartData.length > 1 && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Score Atual</p>
                            <p className="text-xl font-bold" style={{ color: instrumentColor }}>{comparison.currentScore}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Score Anterior</p>
                            <p className="text-xl font-bold text-gray-700">{comparison.previousScore}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Variação</p>
                            <p className={`text-xl font-bold ${comparison.deltaAbsolute < 0 ? 'text-green-600' : comparison.deltaAbsolute > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {comparison.deltaAbsolute > 0 ? '+' : ''}{comparison.deltaAbsolute} ({comparison.deltaPercent}%)
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Média Móvel</p>
                            <p className="text-xl font-bold text-gray-700">{comparison.movingAverage || '-'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
