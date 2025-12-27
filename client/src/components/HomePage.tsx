import React, { useState } from 'react';
import { PatientList } from './PatientList';
import { ClinicDashboard } from './ClinicDashboard';
import { WeeklyCalendar } from './WeeklyCalendar';
import { usePatients } from '../context/PatientContext';
import { Building2, ArrowLeft, Archive, User, ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export const HomePage: React.FC = () => {
    const [showDashboard, setShowDashboard] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const { patients, selectPatient } = usePatients();

    const inactivePatients = patients.filter(p => p.status === 'inativo');

    // Show calendar view
    if (showCalendar) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {/* Header with Back Button */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <button
                        onClick={() => setShowCalendar(false)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar para Pacientes
                    </button>
                </div>

                {/* Calendar */}
                <div className="p-6">
                    <WeeklyCalendar onSelectPatient={(id) => {
                        setShowCalendar(false);
                        selectPatient(id);
                    }} />
                </div>
            </div>
        );
    }

    // Show dashboard view
    if (showDashboard) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                {/* Header with Back Button */}
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                    <button
                        onClick={() => setShowDashboard(false)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar para Pacientes
                    </button>
                </div>

                {/* Dashboard */}
                <div className="p-6">
                    <ClinicDashboard />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Action Buttons */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => setShowDashboard(true)}
                        className="group bg-gradient-to-br from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white rounded-lg px-4 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-left inline-flex items-center gap-2"
                    >
                        <Building2 className="w-5 h-5" />
                        <span className="font-semibold text-sm">Gestão do Consultório</span>
                    </button>
                    <button
                        onClick={() => setShowCalendar(true)}
                        className="group bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-lg px-4 py-2.5 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] text-left inline-flex items-center gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        <span className="font-semibold text-sm">Agenda</span>
                    </button>
                </div>

                {/* Patient List */}
                <PatientList />

                {/* Inactive Patients - Discrete at bottom */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-xs transition-colors"
                        disabled={inactivePatients.length === 0}
                    >
                        {showInactive ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <Archive className="w-3 h-3" />
                        <span>Pacientes Inativos ({inactivePatients.length})</span>
                    </button>

                    {showInactive && inactivePatients.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {inactivePatients.map(patient => (
                                <button
                                    key={patient.id}
                                    onClick={() => selectPatient(patient.id)}
                                    className="w-full flex items-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-left group"
                                >
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600">{patient.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {patient.inactivationReason === 'alta' && 'Alta'}
                                            {patient.inactivationReason === 'abandono' && 'Abandono'}
                                            {patient.inactivationReason === 'transferencia' && 'Transferência'}
                                            {patient.inactivationReason === 'outro' && 'Outro'}
                                            {patient.inactivationDate && ` • ${new Date(patient.inactivationDate).toLocaleDateString('pt-BR')}`}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 group-hover:text-indigo-500">
                                        Abrir →
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
