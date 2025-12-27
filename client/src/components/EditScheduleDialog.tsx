import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save } from 'lucide-react';

interface EditScheduleDialogProps {
    isOpen: boolean;
    patientName: string;
    currentSchedule?: {
        dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
        time: string;
        frequency: 'semanal' | 'quinzenal' | 'mensal';
    };
    onClose: () => void;
    onSave: (schedule: { dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; time: string; frequency: 'semanal' | 'quinzenal' | 'mensal' }) => void;
}

const DAYS = [
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
    { value: 0, label: 'Domingo' },
] as const;

const TIMES = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export const EditScheduleDialog: React.FC<EditScheduleDialogProps> = ({
    isOpen,
    patientName,
    currentSchedule,
    onClose,
    onSave
}) => {
    const [dayOfWeek, setDayOfWeek] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(1);
    const [time, setTime] = useState('14:00');
    const [frequency, setFrequency] = useState<'semanal' | 'quinzenal' | 'mensal'>('semanal');

    useEffect(() => {
        if (currentSchedule) {
            setDayOfWeek(currentSchedule.dayOfWeek);
            setTime(currentSchedule.time);
            setFrequency(currentSchedule.frequency);
        }
    }, [currentSchedule, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ dayOfWeek, time, frequency });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Editar Horário</h3>
                            <p className="text-sm text-gray-500">{patientName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Day of Week */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Dia da Semana
                        </label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(parseInt(e.target.value) as any)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 bg-white"
                        >
                            {DAYS.map(day => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Horário
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {TIMES.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTime(t)}
                                    className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${time === t
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Frequência
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: 'semanal', label: 'Semanal' },
                                { value: 'quinzenal', label: 'Quinzenal' },
                                { value: 'mensal', label: 'Mensal' }
                            ].map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setFrequency(f.value as any)}
                                    className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${frequency === f.value
                                            ? 'bg-indigo-600 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};
