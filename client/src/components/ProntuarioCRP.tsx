import React, { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { ProntuarioRecord } from '../types/patient';
import { FileText, Download, Edit3, Check, X, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

// Empty record template
const EMPTY_RECORD: Omit<ProntuarioRecord, 'sessionDate' | 'updatedAt'> = {
    consultationType: 'presencial',
    intervention: '',
    demandAssessment: '',
    objectives: '',
    preSessionNotes: '',
    evolution: '',
    observation: '',
    homework: '',
    continuity: ''
};

export const ProntuarioCRP: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [editingRecord, setEditingRecord] = useState<{ id: string; data: ProntuarioRecord } | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    const sessions = currentPatient?.clinicalRecords.sessions || [];
    const prontuarioRecords = currentPatient?.clinicalRecords.prontuarioRecords || {};

    const toggleSessionSelection = (sessionId: string) => {
        const newSelected = new Set(selectedSessions);
        if (newSelected.has(sessionId)) {
            newSelected.delete(sessionId);
        } else {
            newSelected.add(sessionId);
        }
        setSelectedSessions(newSelected);
    };

    const selectAll = () => {
        if (selectedSessions.size === sessions.length) {
            setSelectedSessions(new Set());
        } else {
            setSelectedSessions(new Set(sessions.map(s => s.id)));
        }
    };

    const handleEditStart = (session: any) => {
        const existing = prontuarioRecords[session.id];
        const record: ProntuarioRecord = existing || {
            ...EMPTY_RECORD,
            sessionDate: session.date,
            updatedAt: new Date().toISOString(),
            // Pre-fill from SOAP if available
            evolution: session.soap?.avaliacao || '',
            intervention: session.soap?.plano?.join('\n') || '',
            demandAssessment: session.soap?.queixa_principal || ''
        };
        setEditingRecord({ id: session.id, data: record });
    };

    const handleEditSave = () => {
        if (!editingRecord || !currentPatient) return;

        const updatedRecords = {
            ...prontuarioRecords,
            [editingRecord.id]: {
                ...editingRecord.data,
                updatedAt: new Date().toISOString()
            }
        };

        updatePatient({
            ...currentPatient,
            clinicalRecords: {
                ...currentPatient.clinicalRecords,
                prontuarioRecords: updatedRecords
            }
        });

        setEditingRecord(null);
    };

    const updateField = (field: keyof ProntuarioRecord, value: string) => {
        if (!editingRecord) return;
        setEditingRecord({
            ...editingRecord,
            data: { ...editingRecord.data, [field]: value }
        });
    };

    const handleDownloadPDF = async () => {
        if (selectedSessions.size === 0) {
            alert('Selecione pelo menos uma sessão para exportar.');
            return;
        }

        setIsGeneratingPDF(true);

        const selectedData = sessions
            .filter(s => selectedSessions.has(s.id))
            .map((s, idx) => {
                const record = prontuarioRecords[s.id] || {
                    intervention: s.soap?.plano?.join(', ') || 'N/A',
                    demandAssessment: s.soap?.queixa_principal || 'N/A',
                    objectives: 'N/A',
                    preSessionNotes: 'N/A',
                    evolution: s.soap?.avaliacao || 'N/A',
                    observation: 'N/A',
                    homework: 'N/A',
                    continuity: 'N/A',
                    consultationType: 'presencial'
                };
                return { ...record, date: new Date(s.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }), index: sessions.length - idx };
            });

        const printContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Prontuário - ${currentPatient?.name}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
        h1 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; font-size: 24px; }
        .header { margin-bottom: 30px; }
        .patient-card { background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #c7d4f0; }
        .patient-card strong { color: #1e3a5f; }
        .session { border: 1px solid #e0e0e0; padding: 25px; margin-bottom: 20px; border-radius: 12px; page-break-inside: avoid; background: #fff; }
        .session-header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; }
        .session-header h2 { margin: 0; font-size: 16px; }
        .session-header p { margin: 5px 0 0 0; font-size: 13px; opacity: 0.9; }
        .field { margin-bottom: 18px; }
        .field-title { font-weight: 700; font-size: 13px; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
        .field-content { font-size: 14px; line-height: 1.7; color: #444; }
        .empty { color: #999; font-style: italic; }
        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 20px; }
        @media print { body { padding: 20px; } .session { break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Ficha de Evolução</h1>
        <div class="patient-card">
            <strong>Paciente:</strong> ${currentPatient?.name}<br/>
            <strong>Data de Nascimento:</strong> ${currentPatient?.birthDate ? new Date(currentPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}<br/>
            <strong>Documento gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
    </div>
    
    ${selectedData.map((s) => `
        <div class="session">
            <div class="session-header">
                <h2>Sessão ${s.index}</h2>
                <p>📅 ${s.date} • ${s.consultationType === 'presencial' ? '🏥 Presencial' : '💻 Online'}</p>
            </div>
            
            <div class="field">
                <div class="field-title">Intervenção Realizada</div>
                <div class="field-content">${s.intervention || '<span class="empty">Não registrado</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Avaliação de Demanda</div>
                <div class="field-content">${s.demandAssessment || '<span class="empty">Não registrado</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Registros de Objetivos</div>
                <div class="field-content">${s.objectives || '<span class="empty">Não registrado</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Anotações de Antes da Sessão</div>
                <div class="field-content">${s.preSessionNotes || '<span class="empty">Não há nada específico sobre este tópico nas anotações.</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Evolução</div>
                <div class="field-content">${s.evolution || '<span class="empty">Não registrado</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Observação</div>
                <div class="field-content">${s.observation || '<span class="empty">Não há nada específico sobre este tópico nas anotações.</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Dever de Casa</div>
                <div class="field-content">${s.homework || '<span class="empty">Não há nada específico sobre este tópico nas anotações.</span>'}</div>
            </div>
            
            <div class="field">
                <div class="field-title">Registro de Encaminhamento/Encerramento/Continuidade</div>
                <div class="field-content">${s.continuity || '<span class="empty">Não registrado</span>'}</div>
            </div>
        </div>
    `).join('')}
    
    <div class="footer">
        Documento gerado conforme Resolução CFP nº 01/2009<br/>
        Guarda obrigatória: 20 anos
    </div>
</body>
</html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }

        setIsGeneratingPDF(false);
    };

    // Field labels for the edit form
    const FIELD_LABELS: { key: keyof ProntuarioRecord; label: string; placeholder: string }[] = [
        { key: 'intervention', label: 'Intervenção Realizada', placeholder: 'Descreva as técnicas e intervenções utilizadas na sessão...' },
        { key: 'demandAssessment', label: 'Avaliação de Demanda', placeholder: 'Qual a demanda principal que o paciente apresentou...' },
        { key: 'objectives', label: 'Registros de Objetivos', placeholder: 'Liste os objetivos trabalhados e próximos passos...' },
        { key: 'preSessionNotes', label: 'Anotações de Antes da Sessão', placeholder: 'Alguma observação prévia à sessão...' },
        { key: 'evolution', label: 'Evolução', placeholder: 'Como o paciente evoluiu desde a última sessão...' },
        { key: 'observation', label: 'Observação', placeholder: 'Observações adicionais do clínico...' },
        { key: 'homework', label: 'Dever de Casa', placeholder: 'Atividades propostas para o paciente realizar...' },
        { key: 'continuity', label: 'Encaminhamento/Continuidade', placeholder: 'O tratamento continuará, foi encerrado ou encaminhado...' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        Prontuário Clínico
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Fichas de Evolução por sessão (Res. CFP 01/2009)
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={selectAll}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        {selectedSessions.size === sessions.length ? 'Desmarcar' : 'Selecionar Todas'}
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={selectedSessions.size === 0 || isGeneratingPDF}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2 rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Baixar PDF ({selectedSessions.size})
                    </button>
                </div>
            </div>

            {/* Patient Info Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Paciente:</span>
                        <p className="font-semibold text-gray-800">{currentPatient?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Nascimento:</span>
                        <p className="font-semibold text-gray-800">
                            {currentPatient?.birthDate ? new Date(currentPatient.birthDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Total de Sessões:</span>
                        <p className="font-semibold text-gray-800">{sessions.length}</p>
                    </div>
                    <div>
                        <span className="text-gray-500">Última Sessão:</span>
                        <p className="font-semibold text-gray-800">
                            {sessions[0] ? new Date(sessions[0].date).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-3">
                {sessions.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhuma sessão registrada ainda.</p>
                    </div>
                ) : (
                    sessions.map((session, index) => {
                        const record = prontuarioRecords[session.id];
                        const isExpanded = expandedSession === session.id;
                        const isEditing = editingRecord?.id === session.id;
                        const hasRecord = !!record;

                        return (
                            <div
                                key={session.id}
                                className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${selectedSessions.has(session.id) ? 'border-indigo-400 shadow-md' : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                {/* Session Header */}
                                <div className="flex items-center gap-4 p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedSessions.has(session.id)}
                                        onChange={() => toggleSessionSelection(session.id)}
                                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">Sessão {sessions.length - index}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-600">{new Date(session.date).toLocaleDateString('pt-BR')}</span>
                                            {hasRecord ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">✓ Registrado</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Pendente</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate mt-1">
                                            {record?.evolution || session.soap?.avaliacao || 'Clique para expandir e editar...'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                                        {isEditing && editingRecord ? (
                                            <div className="space-y-4">
                                                {/* Consultation Type */}
                                                <div className="flex gap-4 mb-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={editingRecord.data.consultationType === 'presencial'}
                                                            onChange={() => updateField('consultationType', 'presencial')}
                                                            className="text-indigo-600"
                                                        />
                                                        <span className="text-sm text-gray-700">🏥 Presencial</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            checked={editingRecord.data.consultationType === 'online'}
                                                            onChange={() => updateField('consultationType', 'online')}
                                                            className="text-indigo-600"
                                                        />
                                                        <span className="text-sm text-gray-700">💻 Online</span>
                                                    </label>
                                                </div>

                                                {/* Fields */}
                                                {FIELD_LABELS.map(({ key, label, placeholder }) => (
                                                    <div key={key}>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                                                        <textarea
                                                            value={(editingRecord.data as any)[key] || ''}
                                                            onChange={(e) => updateField(key, e.target.value)}
                                                            placeholder={placeholder}
                                                            className="w-full h-24 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-y"
                                                        />
                                                    </div>
                                                ))}

                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={handleEditSave}
                                                        className="flex items-center gap-1 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                                                    >
                                                        <Check className="w-4 h-4" /> Salvar Prontuário
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingRecord(null)}
                                                        className="flex items-center gap-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium"
                                                    >
                                                        <X className="w-4 h-4" /> Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {FIELD_LABELS.map(({ key, label }) => (
                                                    <div key={key}>
                                                        <h4 className="text-xs font-bold text-indigo-600 uppercase mb-1">{label}</h4>
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                                            {(record as any)?.[key] || (session.soap as any)?.[key === 'evolution' ? 'avaliacao' : key] ||
                                                                <span className="text-gray-400 italic">Não há nada específico sobre este tópico.</span>}
                                                        </p>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => handleEditStart(session)}
                                                    className="flex items-center gap-1 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-sm font-medium mt-4"
                                                >
                                                    <Edit3 className="w-4 h-4" /> Editar Ficha de Evolução
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
