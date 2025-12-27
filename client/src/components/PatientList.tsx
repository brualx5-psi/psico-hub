import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import { User, Plus, Search, Calendar, FileText, ChevronDown, ChevronRight, Clock, Archive } from 'lucide-react';

export const PatientList: React.FC = () => {
    const { patients, addPatient, selectPatient } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [expandedDays, setExpandedDays] = useState<number[]>([1, 2, 3, 4, 5]);
    const [showInactive, setShowInactive] = useState(false);

    // Form states
    const [isChild, setIsChild] = useState(false);
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [emergencyContact1Name, setEmergencyContact1Name] = useState('');
    const [emergencyContact1Phone, setEmergencyContact1Phone] = useState('');
    const [emergencyContact2Name, setEmergencyContact2Name] = useState('');
    const [emergencyContact2Phone, setEmergencyContact2Phone] = useState('');
    const [country, setCountry] = useState('Brasil');
    const [gender, setGender] = useState('');
    const [profession, setProfession] = useState('');
    const [healthPlan, setHealthPlan] = useState('');
    const [healthPlanOther, setHealthPlanOther] = useState('');
    const [medication, setMedication] = useState('');

    const resetForm = () => {
        setIsChild(false);
        setName('');
        setBirthDate('');
        setEmail('');
        setPhone('');
        setGuardianName('');
        setGuardianPhone('');
        setEmergencyContact1Name('');
        setEmergencyContact1Phone('');
        setEmergencyContact2Name('');
        setEmergencyContact2Phone('');
        setCountry('Brasil');
        setGender('');
        setProfession('');
        setHealthPlan('');
        setHealthPlanOther('');
        setMedication('');
        setIsCreating(false);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            addPatient(name);
            resetForm();
        }
    };

    const toggleDay = (dayOfWeek: number) => {
        setExpandedDays(prev =>
            prev.includes(dayOfWeek)
                ? prev.filter(d => d !== dayOfWeek)
                : [...prev, dayOfWeek]
        );
    };

    // Group patients by day of week
    const groupedPatients = useMemo(() => {
        const days = {
            1: { name: '📅 SEGUNDA-FEIRA', patients: [] as typeof patients },
            2: { name: '📅 TERÇA-FEIRA', patients: [] as typeof patients },
            3: { name: '📅 QUARTA-FEIRA', patients: [] as typeof patients },
            4: { name: '📅 QUINTA-FEIRA', patients: [] as typeof patients },
            5: { name: '📅 SEXTA-FEIRA', patients: [] as typeof patients },
            6: { name: '📅 SÁBADO', patients: [] as typeof patients },
        };

        const inactive: typeof patients = [];
        const unscheduled: typeof patients = [];

        patients
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .forEach(patient => {
                if (patient.status === 'inativo') {
                    inactive.push(patient);
                } else if (patient.schedule) {
                    const dayKey = patient.schedule.dayOfWeek as keyof typeof days;
                    if (days[dayKey]) {
                        days[dayKey].patients.push(patient);
                    }
                } else {
                    unscheduled.push(patient);
                }
            });

        // Sort by time within each day
        Object.values(days).forEach(day => {
            day.patients.sort((a, b) => {
                const timeA = a.schedule?.time || '00:00';
                const timeB = b.schedule?.time || '00:00';
                return timeA.localeCompare(timeB);
            });
        });

        return { days, inactive, unscheduled };
    }, [patients, searchTerm]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header with Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white border-2 border-indigo-100 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 w-72 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Novo Paciente
                        </button>
                    </div>
                </div>

                {isCreating && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                        <form onSubmit={handleCreate} className="bg-white border-2 border-gray-200 p-6 rounded-2xl shadow-xl">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">Adicionar Paciente</h3>

                            {/* Child/Adolescent Checkbox */}
                            <div className="mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isChild}
                                        onChange={(e) => setIsChild(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Criança/Adolescente</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o nome"
                                        required
                                    />
                                </div>

                                {/* Birth Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o email"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o telefone"
                                    />
                                </div>

                                {/* Guardian Fields (conditional) */}
                                {isChild && (
                                    <>
                                        <div className="col-span-2 mt-2 mb-1 pb-2 border-b border-gray-200">
                                            <span className="text-sm font-semibold text-indigo-700">Dados do Responsável</span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável *</label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => setGuardianName(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Digite o nome"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone do Responsável *</label>
                                            <input
                                                type="tel"
                                                value={guardianPhone}
                                                onChange={(e) => setGuardianPhone(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Digite o telefone"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Emergency Contacts */}
                                <div className="col-span-2 mt-2 mb-1 pb-2 border-b border-gray-200">
                                    <span className="text-sm font-semibold text-gray-600">Contatos de Emergência</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Contato 1</label>
                                    <input
                                        type="text"
                                        value={emergencyContact1Name}
                                        onChange={(e) => setEmergencyContact1Name(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Contato 1</label>
                                    <input
                                        type="tel"
                                        value={emergencyContact1Phone}
                                        onChange={(e) => setEmergencyContact1Phone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o telefone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Contato 2</label>
                                    <input
                                        type="text"
                                        value={emergencyContact2Name}
                                        onChange={(e) => setEmergencyContact2Name(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o nome"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Contato 2</label>
                                    <input
                                        type="tel"
                                        value={emergencyContact2Phone}
                                        onChange={(e) => setEmergencyContact2Phone(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o telefone"
                                    />
                                </div>

                                {/* Other Fields */}
                                <div className="col-span-2 mt-2 mb-1 pb-2 border-b border-gray-200">
                                    <span className="text-sm font-semibold text-gray-600">Informações Adicionais</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                                    <input
                                        type="text"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite o gênero"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label>
                                    <input
                                        type="text"
                                        value={profession}
                                        onChange={(e) => setProfession(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Digite a profissão"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Saúde</label>
                                    <select
                                        value={healthPlan}
                                        onChange={(e) => setHealthPlan(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Particular">Particular</option>
                                        <option value="Unimed">Unimed</option>
                                        <option value="Bradesco Saúde">Bradesco Saúde</option>
                                        <option value="Amil">Amil</option>
                                        <option value="SulAmérica">SulAmérica</option>
                                        <option value="NotreDame Intermédica">NotreDame Intermédica</option>
                                        <option value="Porto Seguro">Porto Seguro</option>
                                        <option value="Hapvida">Hapvida</option>
                                        <option value="Cassi">Cassi</option>
                                        <option value="Golden Cross">Golden Cross</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                                {healthPlan === 'Outro' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qual plano?</label>
                                        <input
                                            type="text"
                                            value={healthPlanOther}
                                            onChange={(e) => setHealthPlanOther(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Digite o nome do plano"
                                        />
                                    </div>
                                )}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medicamento</label>
                                    <textarea
                                        value={medication}
                                        onChange={(e) => setMedication(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Liste os medicamentos em uso"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                                >
                                    Criar Prontuário
                                </button>
                                <button
                                    onClick={resetForm}
                                    type="button"
                                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Weekday Sections */}
                <div className="space-y-4">
                    {Object.entries(groupedPatients.days).map(([dayNum, dayData]) => {
                        const dayOfWeek = parseInt(dayNum);
                        const isExpanded = expandedDays.includes(dayOfWeek);
                        const count = dayData.patients.length;

                        if (count === 0) return null;

                        return (
                            <div key={dayNum} className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden shadow-lg">
                                <button
                                    onClick={() => toggleDay(dayOfWeek)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-indigo-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="w-5 h-5 text-indigo-600" /> : <ChevronRight className="w-5 h-5 text-indigo-600" />}
                                        <h2 className="text-lg font-bold text-gray-800">{dayData.name}</h2>
                                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                                            {count} {count === 1 ? 'paciente' : 'pacientes'}
                                        </span>
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-indigo-100 p-4 bg-indigo-50/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dayData.patients.map(patient => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => selectPatient(patient.id)}
                                                    className="group bg-white border border-indigo-100 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                                                            <User className="w-4 h-4 text-white" />
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                                            <span className="text-sm font-bold text-indigo-700">{patient.schedule?.time}</span>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-base font-bold text-gray-800 group-hover:text-indigo-600 mb-2 transition-colors">
                                                        {patient.name}
                                                    </h3>

                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                                                        <span className="font-semibold text-purple-600">{patient.clinicalRecords.sessions.length}</span>
                                                        <span>sessões</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Unscheduled Section */}
                    {groupedPatients.unscheduled.length > 0 && (
                        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5">
                            <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                SEM HORÁRIO DEFINIDO ({groupedPatients.unscheduled.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {groupedPatients.unscheduled.map(patient => (
                                    <div
                                        key={patient.id}
                                        onClick={() => selectPatient(patient.id)}
                                        className="bg-white border border-amber-200 hover:border-amber-400 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md text-sm"
                                    >
                                        <div className="font-bold text-gray-800">{patient.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Clique para definir horário</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inactive Section */}
                    {groupedPatients.inactive.length > 0 && (
                        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setShowInactive(!showInactive)}
                                className="w-full flex items-center justify-between p-5 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {showInactive ? <ChevronDown className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
                                    <Archive className="w-5 h-5 text-gray-500" />
                                    <h2 className="text-lg font-bold text-gray-700">INATIVOS</h2>
                                    <span className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">
                                        {groupedPatients.inactive.length}
                                    </span>
                                </div>
                            </button>

                            {showInactive && (
                                <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {groupedPatients.inactive.map(patient => (
                                            <div
                                                key={patient.id}
                                                onClick={() => selectPatient(patient.id)}
                                                className="bg-white border border-gray-200 hover:border-gray-400 rounded-lg p-3 cursor-pointer transition-all hover:shadow-md opacity-75 hover:opacity-100"
                                            >
                                                <div className="font-bold text-gray-700">{patient.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {patient.inactivationReason === 'alta' && '✓ Alta'}
                                                    {patient.inactivationReason === 'abandono' && '⚠︎ Abandono'}
                                                    {patient.inactivationReason === 'transferencia' && '→ Transferência'}
                                                    {!patient.inactivationReason && 'Inativo'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {patients.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-block p-6 bg-indigo-50 rounded-full mb-4">
                            <User className="w-12 h-12 text-indigo-300" />
                        </div>
                        <p className="text-gray-500 text-lg">Nenhum paciente cadastrado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
