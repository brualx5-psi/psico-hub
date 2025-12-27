import React, { useState, useRef } from 'react';
import { usePatients } from '../context/PatientContext';
import {
    FileText,
    Printer,
    Copy,
    X,
    Save,
    Calendar,
    User,
    Building2,
    Edit3,
    CheckCircle
} from 'lucide-react';

interface FunservReportGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FunservReportGenerator: React.FC<FunservReportGeneratorProps> = ({
    isOpen,
    onClose
}) => {
    const { currentPatient } = usePatients();
    const reportRef = useRef<HTMLDivElement>(null);

    // Therapist info - preenchido automaticamente
    const [therapistName, setTherapistName] = useState('Bruno Alexandre');
    const [therapistCRP, setTherapistCRP] = useState('06/18006');
    const [therapistCPF, setTherapistCPF] = useState('');
    const [clinicAddress, setClinicAddress] = useState('Rua Fernão Salles, 672 - Vila Hortência - Sorocaba - SP');
    const [clinicPhone, setClinicPhone] = useState('(15) 3329-7084');
    const [clinicEmail, setClinicEmail] = useState('clinicapersonart@gmail.com');

    // Report date
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    // Patient age calculation
    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return '';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Count sessions
    const sessionCount = currentPatient?.clinicalRecords.sessions.length || 0;
    const presences = currentPatient?.scheduledSessions?.filter(s => s.status === 'presente').length || sessionCount;

    // Get main complaints from anamnesis or sessions
    const getMainComplaints = () => {
        if (!currentPatient) return '';

        // Try to get from anamnesis
        const anamnesis = currentPatient.clinicalRecords.anamnesis.content;
        if (anamnesis && anamnesis.length > 50) {
            // Extract first paragraph or 300 chars
            const clean = anamnesis.replace(/<[^>]*>/g, '').trim();
            return clean.slice(0, 400);
        }

        // Fallback to disorder info
        const disorder = currentPatient.primaryDisorder;
        const disorderMap: Record<string, string> = {
            'panic': 'transtorno de pânico com sintomas de ansiedade',
            'depression': 'quadro depressivo com sintomas de humor rebaixado',
            'ocd': 'transtorno obsessivo-compulsivo',
            'gad': 'transtorno de ansiedade generalizada',
            'social_anxiety': 'ansiedade social',
            'ptsd': 'transtorno de estresse pós-traumático'
        };

        return disorderMap[disorder || ''] || 'queixas emocionais e comportamentais que impactam sua qualidade de vida';
    };

    // Generate justification based on patient data
    const generateJustification = () => {
        if (!currentPatient) return '';

        const name = currentPatient.name.split(' ')[0]; // First name only

        return `${name} apresenta evolução gradual ao longo do processo terapêutico, demonstrando maior capacidade de identificação e manejo de estados emocionais. Contudo, ainda apresenta vulnerabilidade em situações de estresse, necessitando de continuidade do acompanhamento psicológico para consolidação das habilidades desenvolvidas e prevenção de recaídas.

A interrupção prematura do tratamento poderia comprometer os ganhos terapêuticos obtidos até o momento, considerando que o paciente ainda está em processo de fortalecimento de recursos psicológicos essenciais para o enfrentamento de demandas cotidianas.

Diante do quadro clínico apresentado e da evolução observada, recomenda-se a continuidade do acompanhamento psicológico para:
a) Consolidar as estratégias de enfrentamento desenvolvidas;
b) Trabalhar aspectos ainda vulneráveis identificados no processo;
c) Prevenir recaídas e promover maior autonomia emocional;
d) Favorecer a qualidade de vida e funcionamento em diferentes contextos.`;
    };

    const [justification, setJustification] = useState('');
    const [sessionsRequested, setSessionsRequested] = useState(18);

    // Initialize justification when patient changes
    React.useEffect(() => {
        if (currentPatient && isOpen) {
            setJustification(generateJustification());
        }
    }, [currentPatient, isOpen]);

    if (!isOpen || !currentPatient) return null;

    const formatDateBR = (dateStr: string) => {
        const date = new Date(dateStr);
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    const handlePrint = () => {
        const printContent = reportRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Get base URL for images
        const baseUrl = window.location.origin;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório FUNSERV - ${currentPatient.name}</title>
                <style>
                    @page { margin: 2cm; }
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        font-size: 12pt; 
                        line-height: 1.6;
                        color: #000;
                        max-width: 21cm;
                        margin: 0 auto;
                    }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { font-size: 18pt; font-weight: bold; color: #0d9488; }
                    .title { font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 20px 0; }
                    .section-title { font-weight: bold; text-decoration: underline; margin-top: 20px; }
                    .content { text-align: justify; margin: 10px 0; }
                    .signature { margin-top: 60px; text-align: center; }
                    .signature-line { border-top: 1px solid #000; width: 250px; margin: 0 auto; padding-top: 5px; }
                    .footer { margin-top: 40px; font-size: 10pt; text-align: center; color: #666; border-top: 1px solid #ccc; padding-top: 10px; }
                    .indent { text-indent: 40px; }
                    .list-item { margin-left: 20px; }
                    img { max-height: 100px; display: block; margin: 0 auto; }
                    textarea { 
                        border: none !important; 
                        resize: none;
                        font-family: 'Times New Roman', Times, serif !important;
                        font-size: 12pt !important;
                        width: 100%;
                        text-align: justify;
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML.replace(/src="\/carimbo.png"/g, `src="${baseUrl}/carimbo.png"`)}
            </body>
            </html>
        `);
        printWindow.document.close();

        // Wait for image to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const handleCopy = () => {
        const text = reportRef.current?.innerText || '';
        navigator.clipboard.writeText(text);
        alert('Texto copiado para a área de transferência!');
    };

    const patientAge = calculateAge(currentPatient.birthDate);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6" />
                        <div>
                            <h2 className="text-xl font-bold">Relatório FUNSERV</h2>
                            <p className="text-teal-100 text-sm">Solicitação de Continuidade de Tratamento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Configuration Panel */}
                    <div className="bg-gray-50 p-4 border-b">
                        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Configurações do Relatório
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Psicóloga</label>
                                <input
                                    type="text"
                                    value={therapistName}
                                    onChange={(e) => setTherapistName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">CRP</label>
                                <input
                                    type="text"
                                    value={therapistCRP}
                                    onChange={(e) => setTherapistCRP(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Data do Relatório</label>
                                <input
                                    type="date"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Sessões Solicitadas</label>
                                <input
                                    type="number"
                                    value={sessionsRequested}
                                    onChange={(e) => setSessionsRequested(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    min={1}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Report Preview */}
                    <div className="p-6">
                        <div
                            ref={reportRef}
                            className="bg-white border-2 border-gray-200 rounded-lg p-8 font-serif text-gray-800"
                            style={{ fontFamily: "'Times New Roman', Times, serif" }}
                        >
                            {/* Header/Logo */}
                            <div className="text-center mb-8">
                                <img
                                    src="/logo-clinica.png"
                                    alt="Clínica Personart"
                                    className="mx-auto h-16 object-contain"
                                    style={{ maxHeight: '70px' }}
                                />
                            </div>

                            {/* Title */}
                            <h2 className="text-center font-bold text-lg underline mb-6">
                                RELATÓRIO PSICOLÓGICO - SOLICITAÇÃO DE CONTINUIDADE
                            </h2>

                            {/* Identification */}
                            <div className="mb-6">
                                <h3 className="font-bold underline mb-2">Identificação</h3>
                                <p><strong>Nome do Paciente:</strong> {currentPatient.name}{patientAge ? ` (${patientAge} Anos)` : ''}</p>
                                <p><strong>Finalidade:</strong> Solicitação de Continuidade de Atendimento Psicológico - FUNSERV</p>
                                <p><strong>Sessões Realizadas:</strong> {presences} sessões</p>
                                <p><strong>Sessões Solicitadas:</strong> {sessionsRequested} sessões adicionais</p>
                                <p><strong>Autor:</strong> {therapistName} (CRP {therapistCRP})</p>
                            </div>

                            {/* Demand Description */}
                            <div className="mb-6">
                                <h3 className="font-bold underline mb-2">Descrição da Demanda</h3>
                                <p className="text-justify indent-8">
                                    {currentPatient.name.split(' ')[0]} foi encaminhado(a) para acompanhamento psicológico devido a {getMainComplaints()}.
                                </p>
                            </div>

                            {/* Procedures */}
                            <div className="mb-6">
                                <h3 className="font-bold underline mb-2">Procedimentos Realizados</h3>
                                <p className="text-justify indent-8">
                                    No acompanhamento psicológico foram realizadas:
                                </p>
                                <ul className="list-disc ml-8 mt-2">
                                    <li>Entrevistas clínicas individuais, em sessões semanais</li>
                                    <li>Aplicação de técnicas cognitivo-comportamentais</li>
                                    <li>Monitoramento da evolução sintomática</li>
                                    <li>Psicoeducação sobre o quadro clínico</li>
                                </ul>
                            </div>

                            {/* Justification */}
                            <div className="mb-6">
                                <h3 className="font-bold underline mb-2">Justificativa para Continuidade</h3>
                                <textarea
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-justify min-h-[200px] font-serif"
                                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                                />
                            </div>

                            {/* Conclusion */}
                            <div className="mb-8">
                                <h3 className="font-bold underline mb-2">Conclusão</h3>
                                <p className="text-justify indent-8">
                                    Com base na avaliação clínica e na evolução do tratamento até o momento, recomenda-se a
                                    <strong> autorização de {sessionsRequested} sessões adicionais</strong> de acompanhamento
                                    psicológico para continuidade do processo terapêutico, visando a consolidação dos
                                    ganhos obtidos e a promoção de maior estabilidade emocional e funcional do(a) paciente.
                                </p>
                                <p className="text-justify indent-8 mt-2">
                                    Este relatório é confidencial e destina-se exclusivamente aos fins de autorização
                                    de continuidade de tratamento junto à FUNSERV, devendo ser utilizado apenas pelas
                                    instâncias competentes, em conformidade com as normas éticas da Psicologia.
                                </p>
                            </div>

                            {/* Date and Location */}
                            <div className="text-right mb-12">
                                <p>Sorocaba - SP, {formatDateBR(reportDate)}.</p>
                            </div>

                            {/* Signature - Side by Side like example */}
                            <div className="flex justify-center items-end gap-12 mt-16">
                                {/* Left: Stamp Image */}
                                <div className="text-center">
                                    <img
                                        src="/carimbo.png"
                                        alt="Carimbo"
                                        className="h-20 object-contain"
                                        style={{ maxHeight: '80px' }}
                                    />
                                </div>

                                {/* Right: Signature + Name */}
                                <div className="text-center">
                                    {/* Signature Image */}
                                    <img
                                        src="/assinatura.png"
                                        alt="Assinatura"
                                        className="mx-auto h-16 object-contain mb-1"
                                        style={{ maxHeight: '60px' }}
                                    />
                                    <div className="border-t border-gray-800 w-56 pt-2">
                                        <p className="font-bold">{therapistName || 'Seu Nome'}</p>
                                        <p className="text-sm">Psicólogo(a) – CRP</p>
                                        <p className="text-sm">{therapistCRP || '00/00000'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-300 mt-12 pt-4 text-center text-sm text-gray-500">
                                <p>{clinicAddress} / {clinicPhone} / {clinicEmail}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 border-t p-4 flex gap-3 justify-end">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Copiar Texto
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:from-teal-700 hover:to-emerald-700 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir / PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FunservReportGenerator;
