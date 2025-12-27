import React, { useState, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    FileText,
    Download,
    Printer,
    Calendar,
    User,
    DollarSign,
    CheckCircle,
    X,
    Building2,
    Copy
} from 'lucide-react';

interface ReceiptData {
    receiptNumber: string;
    date: string;
    patientName: string;
    patientDocument?: string;
    therapistName: string;
    therapistCRP: string;
    therapistCPF?: string;
    serviceDescription: string;
    amount: number;
    paymentMethod: string;
    period?: string;
    sessionsCount?: number;
}

interface ReceiptGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ isOpen, onClose }) => {
    const { currentPatient } = usePatients();
    const receiptRef = useRef<HTMLDivElement>(null);

    // Therapist Info (would come from settings in a real app)
    const [therapistName, setTherapistName] = useState('Dr(a). Nome do Psicólogo');
    const [therapistCRP, setTherapistCRP] = useState('CRP 00/00000');
    const [therapistCPF, setTherapistCPF] = useState('000.000.000-00');

    // Receipt Details
    const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
    const [period, setPeriod] = useState('Dezembro 2024');
    const [sessionsCount, setSessionsCount] = useState(4);
    const [customAmount, setCustomAmount] = useState(
        currentPatient?.billing?.sessionValue
            ? currentPatient.billing.sessionValue * 4
            : 800
    );
    const [paymentMethod, setPaymentMethod] = useState('PIX');

    const [copied, setCopied] = useState(false);

    if (!isOpen || !currentPatient) return null;

    const receiptNumber = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDateBR = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const numberToWords = (num: number): string => {
        const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
        const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

        if (num === 0) return 'zero';
        if (num === 100) return 'cem';

        let result = '';

        if (num >= 1000) {
            const thousands = Math.floor(num / 1000);
            result += (thousands === 1 ? 'mil' : units[thousands] + ' mil');
            num %= 1000;
            if (num > 0) result += ' e ';
        }

        if (num >= 100) {
            result += hundreds[Math.floor(num / 100)];
            num %= 100;
            if (num > 0) result += ' e ';
        }

        if (num >= 20) {
            result += tens[Math.floor(num / 10)];
            num %= 10;
            if (num > 0) result += ' e ';
        } else if (num >= 10) {
            result += teens[num - 10];
            num = 0;
        }

        if (num > 0) {
            result += units[num];
        }

        return result;
    };

    const amountInWords = () => {
        const reais = Math.floor(customAmount);
        const centavos = Math.round((customAmount - reais) * 100);

        let result = numberToWords(reais) + ' reais';
        if (centavos > 0) {
            result += ' e ' + numberToWords(centavos) + ' centavos';
        }
        return result;
    };

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo - ${currentPatient.name}</title>
                    <style>
                        body { font-family: 'Georgia', serif; padding: 40px; max-width: 700px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                        .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .subtitle { color: #666; }
                        .receipt-number { font-size: 14px; color: #888; margin-top: 10px; }
                        .content { line-height: 1.8; margin: 30px 0; }
                        .amount { font-size: 20px; font-weight: bold; text-align: center; background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
                        .signature { margin-top: 60px; text-align: center; }
                        .signature-line { border-top: 1px solid #333; width: 300px; margin: 10px auto; padding-top: 10px; }
                        .footer { margin-top: 40px; font-size: 12px; color: #888; text-align: center; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleCopyText = () => {
        const text = `
RECIBO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS
Nº ${receiptNumber}

Recebi de ${currentPatient.name} a importância de ${formatCurrency(customAmount)} (${amountInWords()}) referente a ${sessionsCount} sessões de psicoterapia realizadas no período de ${period}.

Forma de pagamento: ${paymentMethod}

${therapistName}
${therapistCRP}
CPF: ${therapistCPF}

Data: ${formatDateBR(receiptDate)}
        `.trim();

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Gerar Recibo</h3>
                            <p className="text-sm text-gray-500">{currentPatient.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Config Panel */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-700">Configurações do Recibo</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Psicólogo</label>
                            <input
                                type="text"
                                value={therapistName}
                                onChange={(e) => setTherapistName(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">CRP</label>
                                <input
                                    type="text"
                                    value={therapistCRP}
                                    onChange={(e) => setTherapistCRP(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">CPF</label>
                                <input
                                    type="text"
                                    value={therapistCPF}
                                    onChange={(e) => setTherapistCPF(e.target.value)}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Período de Referência</label>
                            <input
                                type="text"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                placeholder="Ex: Dezembro 2024"
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nº Sessões</label>
                                <input
                                    type="number"
                                    value={sessionsCount}
                                    onChange={(e) => setSessionsCount(Number(e.target.value))}
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                                    min={1}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Valor Total</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(Number(e.target.value))}
                                        className="w-full border-2 border-gray-200 rounded-xl p-3 pl-10 focus:outline-none focus:border-indigo-400"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Forma de Pagamento</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                            >
                                <option value="PIX">PIX</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                <option value="Cartão de Débito">Cartão de Débito</option>
                                <option value="Transferência Bancária">Transferência Bancária</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Data do Recibo</label>
                            <input
                                type="date"
                                value={receiptDate}
                                onChange={(e) => setReceiptDate(e.target.value)}
                                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400"
                            />
                        </div>
                    </div>

                    {/* Preview Panel */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-4">Pré-visualização</h4>
                        <div
                            ref={receiptRef}
                            className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-inner"
                            style={{ fontFamily: 'Georgia, serif' }}
                        >
                            <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                                <h2 className="text-xl font-bold text-gray-800">RECIBO</h2>
                                <p className="text-sm text-gray-500">Prestação de Serviços Psicológicos</p>
                                <p className="text-xs text-gray-400 mt-2">Nº {receiptNumber}</p>
                            </div>

                            <div className="text-gray-700 leading-relaxed text-sm">
                                <p className="mb-4">
                                    Recebi de <strong>{currentPatient.name}</strong> a importância de{' '}
                                    <strong>{formatCurrency(customAmount)}</strong> ({amountInWords()}), referente a{' '}
                                    <strong>{sessionsCount} sessões</strong> de psicoterapia realizadas no período de{' '}
                                    <strong>{period}</strong>.
                                </p>

                                <p className="mb-6">
                                    Forma de pagamento: <strong>{paymentMethod}</strong>
                                </p>

                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(customAmount)}</p>
                                </div>
                            </div>

                            <div className="mt-10 text-center">
                                <div className="border-t border-gray-400 w-64 mx-auto pt-2">
                                    <p className="font-bold text-gray-800">{therapistName}</p>
                                    <p className="text-sm text-gray-600">{therapistCRP}</p>
                                    <p className="text-xs text-gray-500">CPF: {therapistCPF}</p>
                                </div>
                            </div>

                            <div className="mt-6 text-center text-xs text-gray-400">
                                {formatDateBR(receiptDate)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 flex gap-3">
                    <button
                        onClick={handleCopyText}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                        {copied ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir / PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptGenerator;
