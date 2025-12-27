import React, { useMemo, useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { User, Calendar, Settings, Plus, X } from 'lucide-react';

interface WorkPeriod {
    start: number;
    end: number;
}

interface DaySchedule {
    [key: string]: WorkPeriod[];
}

interface WeeklyCalendarProps {
    onSelectPatient: (patientId: string) => void;
}

const DEFAULT_SCHEDULE: DaySchedule = {
    'Segunda': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Terça': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Quarta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Quinta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Sexta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Sábado': [{ start: 8, end: 12 }],
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onSelectPatient }) => {
    const { patients } = usePatients();
    const [workSchedule, setWorkSchedule] = useState<DaySchedule>(DEFAULT_SCHEDULE);
    const [showSettings, setShowSettings] = useState(false);

    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const DAY_MAP: Record<number, string> = {
        1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
    };

    // Load schedule from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('workSchedule');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate structure
                if (parsed && typeof parsed === 'object') {
                    setWorkSchedule(parsed);
                }
            }
        } catch (e) {
            console.error('Error loading schedule from localStorage:', e);
            localStorage.removeItem('workSchedule'); // Clear corrupted data
        }
    }, []);

    // Save schedule to localStorage
    const saveSchedule = (schedule: DaySchedule) => {
        setWorkSchedule(schedule);
        localStorage.setItem('workSchedule', JSON.stringify(schedule));
    };

    // Group patients by day and time
    const appointmentsByDay = useMemo(() => {
        const grouped: Record<string, Array<{ patient: any; time: string }>> = {};

        patients
            .filter(p => p.status === 'ativo' && p.schedule)
            .forEach(patient => {
                const dayName = DAY_MAP[patient.schedule!.dayOfWeek];
                if (!grouped[dayName]) {
                    grouped[dayName] = [];
                }
                grouped[dayName].push({
                    patient,
                    time: patient.schedule!.time
                });
            });

        return grouped;
    }, [patients]);

    const getAppointmentsForSlot = (day: string, hour: number) => {
        const dayAppointments = appointmentsByDay[day] || [];
        const hourStr = `${hour.toString().padStart(2, '0')}:`;
        return dayAppointments.filter(apt => apt.time.startsWith(hourStr));
    };

    const isWorkHour = (day: string, hour: number) => {
        const periods = workSchedule[day];
        if (!periods || !Array.isArray(periods) || periods.length === 0) return false;
        return periods.some(period => period && typeof period.start === 'number' && hour >= period.start && hour < period.end);
    };

    const getWorkHoursForDay = (day: string) => {
        const periods = workSchedule[day];
        if (!periods || !Array.isArray(periods) || periods.length === 0) return [];

        const hours: number[] = [];
        periods.forEach(period => {
            if (period && typeof period.start === 'number' && typeof period.end === 'number') {
                for (let h = period.start; h < period.end; h++) {
                    hours.push(h);
                }
            }
        });
        return hours;
    };

    const allWorkHours = useMemo(() => {
        const hours = new Set<number>();
        DAYS.forEach(day => {
            const dayHours = getWorkHoursForDay(day);
            dayHours.forEach(h => hours.add(h));
        });
        return Array.from(hours).sort((a, b) => a - b);
    }, [workSchedule]);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            {/* Header - Google Calendar Style */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Agenda</h2>
                            <p className="text-sm text-gray-600">Horários de atendimento</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-300"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm font-medium">Configurar</span>
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-gray-50 border-b border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Horários de Atendimento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DAYS.map(day => {
                            const periods = workSchedule[day] || [{ start: 8, end: 18 }];
                            return (
                                <div key={day} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                    <div className="font-medium text-gray-700 mb-3 text-sm flex items-center justify-between">
                                        <span>{day}</span>
                                        <button
                                            onClick={() => {
                                                const newSchedule = {
                                                    ...workSchedule,
                                                    [day]: [...periods, { start: 14, end: 18 }]
                                                };
                                                saveSchedule(newSchedule);
                                            }}
                                            className="text-green-600 hover:text-green-700 p-1"
                                            title="Adicionar período"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {periods.map((period, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={period.start}
                                                    onChange={(e) => {
                                                        const newPeriods = [...periods];
                                                        newPeriods[idx] = { ...period, start: parseInt(e.target.value) };
                                                        const newSchedule = { ...workSchedule, [day]: newPeriods };
                                                        saveSchedule(newSchedule);
                                                    }}
                                                    className="w-14 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                                <span className="text-gray-500 text-xs">às</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    value={period.end}
                                                    onChange={(e) => {
                                                        const newPeriods = [...periods];
                                                        newPeriods[idx] = { ...period, end: parseInt(e.target.value) };
                                                        const newSchedule = { ...workSchedule, [day]: newPeriods };
                                                        saveSchedule(newSchedule);
                                                    }}
                                                    className="w-14 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                                <span className="text-gray-500 text-xs">h</span>
                                                {periods.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const newPeriods = periods.filter((_, i) => i !== idx);
                                                            const newSchedule = { ...workSchedule, [day]: newPeriods };
                                                            saveSchedule(newSchedule);
                                                        }}
                                                        className="text-red-500 hover:text-red-600 p-1"
                                                        title="Remover período"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        <div className="p-3 text-xs font-semibold text-gray-500">Horário</div>
                        {DAYS.map(day => (
                            <div key={day} className="p-3 text-center">
                                <div className="text-sm font-bold text-gray-700">{day}</div>
                                <div className="text-xs text-gray-500">
                                    {workSchedule[day]?.map((p, i) => (
                                        <div key={i}>{p.start}h-{p.end}h</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time Slots */}
                    <div className="divide-y divide-gray-100">
                        {allWorkHours.map(hour => (
                            <div key={hour} className="grid grid-cols-7">
                                {/* Hour Label */}
                                <div className="p-3 text-xs font-medium text-gray-500 border-r border-gray-200 bg-gray-50">
                                    {hour}:00
                                </div>

                                {/* Day Columns */}
                                {DAYS.map(day => {
                                    const appointments = getAppointmentsForSlot(day, hour);
                                    const isWork = isWorkHour(day, hour);

                                    if (!isWork) {
                                        return (
                                            <div
                                                key={`${day}-${hour}`}
                                                className="p-2 border-r border-gray-100 min-h-[60px] bg-gray-50"
                                            />
                                        );
                                    }

                                    return (
                                        <div
                                            key={`${day}-${hour}`}
                                            className="p-1.5 border-r border-gray-200 min-h-[60px] hover:bg-blue-50 transition-colors"
                                        >
                                            <div className="space-y-1">
                                                {appointments.length > 0 ? (
                                                    appointments.map(({ patient, time }) => (
                                                        <button
                                                            key={patient.id}
                                                            onClick={() => onSelectPatient(patient.id)}
                                                            className="w-full text-left p-2 bg-blue-500 hover:bg-blue-600 text-white rounded border-l-4 border-blue-700 transition-all shadow-sm hover:shadow group"
                                                        >
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <User className="w-3 h-3 flex-shrink-0" />
                                                                <span className="text-xs font-semibold truncate">
                                                                    {patient.name.split(' ')[0]}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs opacity-90 font-medium">
                                                                {time}
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-1.5 bg-white border border-gray-200 rounded text-center hover:bg-gray-50 transition-colors">
                                                        <div className="text-xs text-gray-500">
                                                            Livre
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
                <div className="flex items-center gap-6 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded border-l-2 border-blue-700"></div>
                        <span>Paciente Agendado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                        <span>Horário Livre</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-50 rounded"></div>
                        <span>Fora do Expediente</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyCalendar;
