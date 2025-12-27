import React, { useMemo, useState } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    DollarSign,
    TrendingUp,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Building2,
    Package
} from 'lucide-react';

type PeriodFilter = 'hoje' | 'semana' | 'mes' | 'ano';

export const ClinicDashboard: React.FC = () => {
    const { patients } = usePatients();
    const [period, setPeriod] = useState<PeriodFilter>('mes');

    // Calculate financial metrics
    const metrics = useMemo(() => {
        const activePatients = patients.filter(p => p.status === 'ativo');
        const inactivePatients = patients.filter(p => p.status === 'inativo');

        // Calculate expected monthly revenue
        let monthlyRevenue = 0;
        let pendingFromInsurance = 0;
        let sessionsPerWeek = 0;

        // Payment type distribution
        let particularCount = 0;
        let convenioCount = 0;
        let pacoteCount = 0;

        activePatients.forEach(patient => {
            const billing = patient.billing;
            const schedule = patient.schedule;

            if (billing) {
                // Count by payment type
                if (billing.paymentType === 'particular') particularCount++;
                else if (billing.paymentType === 'convenio') convenioCount++;
                else if (billing.paymentType === 'pacote') pacoteCount++;

                // Calculate sessions per month based on frequency
                let sessionsPerMonth = 0;
                if (schedule) {
                    sessionsPerWeek++;
                    if (schedule.frequency === 'semanal') sessionsPerMonth = 4;
                    else if (schedule.frequency === 'quinzenal') sessionsPerMonth = 2;
                    else if (schedule.frequency === 'mensal') sessionsPerMonth = 1;
                }

                // Calculate revenue
                if (billing.paymentType === 'convenio') {
                    pendingFromInsurance += billing.sessionValue * sessionsPerMonth;
                }
                monthlyRevenue += billing.sessionValue * sessionsPerMonth;
            }
        });

        // Payment records analysis
        let paidThisMonth = 0;
        let pendingPayments = 0;
        patients.forEach(patient => {
            if (patient.paymentRecords) {
                patient.paymentRecords.forEach(record => {
                    const recordDate = new Date(record.sessionDate);
                    const now = new Date();
                    const isThisMonth = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();

                    if (isThisMonth) {
                        if (record.status === 'pago') {
                            paidThisMonth += record.amount;
                        } else if (record.status === 'pendente') {
                            pendingPayments += record.amount;
                        } else if (record.status === 'a_receber') {
                            pendingFromInsurance += record.amount;
                        }
                    }
                });
            }
        });

        // Session count (from clinical records)
        let totalSessions = 0;
        patients.forEach(patient => {
            totalSessions += patient.clinicalRecords.sessions?.length || 0;
        });

        // Attendance rate (mock - would need actual data)
        const attendanceRate = 92; // Placeholder

        return {
            activePatients: activePatients.length,
            inactivePatients: inactivePatients.length,
            monthlyRevenue,
            pendingFromInsurance,
            paidThisMonth,
            pendingPayments,
            sessionsPerWeek,
            totalSessions,
            attendanceRate,
            particularCount,
            convenioCount,
            pacoteCount
        };
    }, [patients]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard da Clínica</h2>
                    <p className="text-gray-500 text-sm">Visão geral do seu consultório</p>
                </div>

                {/* Period Filter */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['hoje', 'semana', 'mes', 'ano'] as PeriodFilter[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-emerald-100 text-sm">Faturamento Estimado</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</p>
                </div>

                {/* Pending from Insurance */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Convênios</span>
                    </div>
                    <p className="text-amber-100 text-sm">A Receber</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.pendingFromInsurance)}</p>
                </div>

                {/* Active Patients */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{metrics.inactivePatients} inativos</span>
                    </div>
                    <p className="text-indigo-100 text-sm">Pacientes Ativos</p>
                    <p className="text-2xl font-bold">{metrics.activePatients}</p>
                </div>

                {/* Sessions */}
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{metrics.attendanceRate}% freq.</span>
                    </div>
                    <p className="text-blue-100 text-sm">Sessões/Semana</p>
                    <p className="text-2xl font-bold">{metrics.sessionsPerWeek}</p>
                </div>
            </div>

            {/* Secondary Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Payment Distribution */}
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        Distribuição de Pagamento
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-gray-600">Particular</span>
                            </div>
                            <span className="font-bold text-gray-800">{metrics.particularCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-600">Convênio</span>
                            </div>
                            <span className="font-bold text-gray-800">{metrics.convenioCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-500" />
                                <span className="text-sm text-gray-600">Pacote</span>
                            </div>
                            <span className="font-bold text-gray-800">{metrics.pacoteCount}</span>
                        </div>
                    </div>
                </div>

                {/* Status Overview */}
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        Status do Mês
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm text-gray-600">Recebido</span>
                            </div>
                            <span className="font-bold text-emerald-600">{formatCurrency(metrics.paidThisMonth)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                <span className="text-sm text-gray-600">Pendente</span>
                            </div>
                            <span className="font-bold text-amber-600">{formatCurrency(metrics.pendingPayments)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-gray-600">Convênios</span>
                            </div>
                            <span className="font-bold text-blue-600">{formatCurrency(metrics.pendingFromInsurance)}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Resumo de Sessões
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total Histórico</span>
                            <span className="font-bold text-gray-800">{metrics.totalSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Por Semana</span>
                            <span className="font-bold text-gray-800">{metrics.sessionsPerWeek}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Comparecimento</span>
                            <span className="font-bold text-emerald-600">{metrics.attendanceRate}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicDashboard;
