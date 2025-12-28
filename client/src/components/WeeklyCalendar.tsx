import React, { useMemo, useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { User, Calendar, Settings, Plus, X, Clock, Stethoscope, Hash, Trash2, UserPlus, Info } from 'lucide-react';
import { Patient } from '../types/patient';

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

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    day: string;
    hour: number;
    availablePatients: Patient[];
    onSchedule: (patientId: string, day: number, time: string) => void;
    currentPatient?: Patient;
    onRemove?: () => void;
}

const DISORDER_LABELS: Record<string, string> = {
    'panic': 'Pânico',
    'depression': 'Depressão',
    'ocd': 'TOC',
    'gad': 'TAG',
    'social_anxiety': 'Fobia Social',
    'ptsd': 'TEPT',
    'other': 'Outro'
};

const AVATAR_COLORS = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-green-600',
    'bg-gradient-to-br from-orange-500 to-orange-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-indigo-500 to-indigo-600',
    'bg-gradient-to-br from-rose-500 to-rose-600',
];

const getAvatarColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

// Modal de Agendamento
const ScheduleModal: React.FC<ScheduleModalProps> = ({
    isOpen,
    onClose,
    day,
    hour,
    availablePatients,
    onSchedule,
    currentPatient,
    onRemove
}) => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedTime, setSelectedTime] = useState(`${hour.toString().padStart(2, '0')}:00`);

    const DAY_TO_NUMBER: Record<string, number> = {
        'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
    };

    if (!isOpen) return null;

    const handleSchedule = () => {
        if (selectedPatientId) {
            onSchedule(selectedPatientId, DAY_TO_NUMBER[day], selectedTime);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-scaleIn">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {currentPatient ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </h3>
                            <p className="text-sm text-gray-500">{day} às {hour}:00</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {currentPatient ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 ${getAvatarColor(currentPatient.name)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                                    {getInitials(currentPatient.name)}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{currentPatient.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {currentPatient.schedule?.time} - {currentPatient.primaryDisorder ? DISORDER_LABELS[currentPatient.primaryDisorder] : 'Sem diagnóstico'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onRemove}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remover Agendamento
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Selecionar Paciente
                            </label>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="">-- Escolha um paciente --</option>
                                {availablePatients.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.primaryDisorder ? `(${DISORDER_LABELS[p.primaryDisorder]})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horário
                            </label>
                            <input
                                type="time"
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSchedule}
                                disabled={!selectedPatientId}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                            >
                                <UserPlus className="w-4 h-4 inline mr-2" />
                                Agendar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DEFAULT_SCHEDULE: DaySchedule = {
    'Segunda': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Terça': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Quarta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Quinta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Sexta': [{ start: 8, end: 12 }, { start: 14, end: 18 }],
    'Sábado': [{ start: 8, end: 12 }],
};

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ onSelectPatient }) => {
    const { patients, updatePatient } = usePatients();
    const [workSchedule, setWorkSchedule] = useState<DaySchedule>(DEFAULT_SCHEDULE);
    const [showSettings, setShowSettings] = useState(false);
    const [scheduleModal, setScheduleModal] = useState<{
        isOpen: boolean;
        day: string;
        hour: number;
        currentPatient?: Patient;
    }>({ isOpen: false, day: '', hour: 0 });
    const [hoveredPatient, setHoveredPatient] = useState<string | null>(null);

    // Estado para Drag and Drop
    const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
    const [dropTarget, setDropTarget] = useState<{ day: string; hour: number } | null>(null);

    const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const DAY_MAP: Record<number, string> = {
        1: 'Segunda', 2: 'Terça', 3: 'Quarta', 4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
    };
    const DAY_TO_NUMBER: Record<string, number> = {
        'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
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
            .filter(p => p.status === 'ativo' && p.schedule && p.schedule.dayOfWeek)
            .forEach(patient => {
                const dayName = DAY_MAP[patient.schedule!.dayOfWeek];
                if (!dayName) return; // Skip if day not found
                if (!grouped[dayName]) {
                    grouped[dayName] = [];
                }
                grouped[dayName].push({
                    patient,
                    time: patient.schedule!.time || '08:00'
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
        const result = Array.from(hours).sort((a, b) => a - b);
        // Fallback: if no hours defined, show default work hours
        return result.length > 0 ? result : [8, 9, 10, 11, 12, 14, 15, 16, 17];
    }, [workSchedule]);

    // Pacientes disponíveis para agendamento (ativos, sem agendamento ou com agendamento diferente)
    const availablePatients = useMemo(() => {
        return patients.filter(p => p.status === 'ativo' && (!p.schedule || !p.schedule.dayOfWeek));
    }, [patients]);

    // Função para agendar paciente
    const handleSchedulePatient = (patientId: string, dayOfWeek: number, time: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const updatedPatient: Patient = {
                ...patient,
                schedule: {
                    dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                    time: time,
                    frequency: 'semanal'
                }
            };
            updatePatient(updatedPatient);
        }
    };

    // Função para remover agendamento
    const handleRemoveSchedule = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            const updatedPatient: Patient = {
                ...patient,
                schedule: undefined
            };
            updatePatient(updatedPatient);
        }
        setScheduleModal({ isOpen: false, day: '', hour: 0 });
    };

    // Contar número de sessões do paciente
    const getSessionCount = (patient: Patient) => {
        return patient.clinicalRecords?.sessions?.length || 0;
    };

    // Funções de Drag and Drop
    const handleDragStart = (e: React.DragEvent, patient: Patient) => {
        setDraggedPatient(patient);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', patient.id);
    };

    const handleDragOver = (e: React.DragEvent, day: string, hour: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropTarget({ day, hour });
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    const handleDrop = (e: React.DragEvent, day: string, hour: number) => {
        e.preventDefault();
        if (draggedPatient) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            const dayNumber = DAY_TO_NUMBER[day];

            const updatedPatient: Patient = {
                ...draggedPatient,
                schedule: {
                    dayOfWeek: dayNumber as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                    time: time,
                    frequency: draggedPatient.schedule?.frequency || 'semanal'
                }
            };
            updatePatient(updatedPatient);
        }
        setDraggedPatient(null);
        setDropTarget(null);
    };

    const handleDragEnd = () => {
        setDraggedPatient(null);
        setDropTarget(null);
    };

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

                                    const isDropTarget = dropTarget?.day === day && dropTarget?.hour === hour;

                                    return (
                                        <div
                                            key={`${day}-${hour}`}
                                            className={`p-1.5 border-r border-gray-200 min-h-[80px] transition-all relative
                                                ${isDropTarget ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' : 'hover:bg-blue-50/50'}
                                                ${draggedPatient ? 'cursor-copy' : ''}`}
                                            onDragOver={(e) => handleDragOver(e, day, hour)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, day, hour)}
                                        >
                                            <div className="space-y-1">
                                                {appointments.length > 0 ? (
                                                    appointments.map(({ patient, time }) => (
                                                        <div
                                                            key={patient.id}
                                                            className={`relative group cursor-grab active:cursor-grabbing ${draggedPatient?.id === patient.id ? 'opacity-50' : ''}`}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, patient)}
                                                            onDragEnd={handleDragEnd}
                                                            onMouseEnter={() => setHoveredPatient(patient.id)}
                                                            onMouseLeave={() => setHoveredPatient(null)}
                                                        >
                                                            <button
                                                                onClick={() => onSelectPatient(patient.id)}
                                                                className={`w-full text-left p-2 ${getAvatarColor(patient.name)} text-white rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-[1.02] group`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                                        {getInitials(patient.name)}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-xs font-bold truncate">
                                                                            {patient.name.split(' ')[0]}
                                                                        </div>
                                                                        <div className="text-[10px] opacity-90 flex items-center gap-1">
                                                                            <Clock className="w-2.5 h-2.5" />
                                                                            {time}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                                                                    {patient.primaryDisorder && (
                                                                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                            <Stethoscope className="w-2 h-2" />
                                                                            {DISORDER_LABELS[patient.primaryDisorder]}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                                        <Hash className="w-2 h-2" />
                                                                        S{getSessionCount(patient) + 1}
                                                                    </span>
                                                                </div>
                                                            </button>

                                                            {/* Tooltip com mais informações */}
                                                            {hoveredPatient === patient.id && (
                                                                <div className="absolute left-full ml-2 top-0 z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl min-w-[200px] animate-fadeIn">
                                                                    <div className="font-bold mb-1">{patient.name}</div>
                                                                    <div className="space-y-1 text-gray-300">
                                                                        <div className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {time} - {patient.schedule?.frequency || 'semanal'}
                                                                        </div>
                                                                        {patient.primaryDisorder && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Stethoscope className="w-3 h-3" />
                                                                                {DISORDER_LABELS[patient.primaryDisorder]}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1">
                                                                            <Hash className="w-3 h-3" />
                                                                            {getSessionCount(patient)} sessões realizadas
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
                                                                        Clique para abrir o prontuário
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Botão de editar agendamento */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setScheduleModal({ isOpen: true, day, hour, currentPatient: patient });
                                                                }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                                                title="Editar agendamento"
                                                            >
                                                                <Settings className="w-3 h-3 text-gray-600" />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <button
                                                        onClick={() => setScheduleModal({ isOpen: true, day, hour })}
                                                        className="w-full p-2 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all group cursor-pointer"
                                                    >
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                                            <span className="text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors font-medium">
                                                                Agendar
                                                            </span>
                                                        </div>
                                                    </button>
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow"></div>
                            <span>Paciente Agendado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-white border-2 border-dashed border-gray-300 rounded"></div>
                            <span>Horário Livre (clique para agendar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 rounded"></div>
                            <span>Fora do Expediente</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Info className="w-4 h-4" />
                        <span>Passe o mouse sobre um paciente para ver detalhes</span>
                    </div>
                </div>
            </div>

            {/* Modal de Agendamento */}
            <ScheduleModal
                isOpen={scheduleModal.isOpen}
                onClose={() => setScheduleModal({ isOpen: false, day: '', hour: 0 })}
                day={scheduleModal.day}
                hour={scheduleModal.hour}
                availablePatients={availablePatients}
                onSchedule={handleSchedulePatient}
                currentPatient={scheduleModal.currentPatient}
                onRemove={() => scheduleModal.currentPatient && handleRemoveSchedule(scheduleModal.currentPatient.id)}
            />
        </div>
    );
};

export default WeeklyCalendar;
