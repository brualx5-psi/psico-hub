import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Save, Loader2, Bot, User, FileText, RefreshCw, Mic, MicOff, Calendar, AlertTriangle, Book, Check, RotateCcw, Plus, Activity } from 'lucide-react';
import { getCoPilotSuggestion, summarizeChatToSoap, generateSessionScript, consultCoreLibrary, generatePostSessionAnalysis, monitorActiveProcesses, analyzeSessionDemand, checkScriptProgress, SessionAdaptation, ScriptItem, ActiveProcess } from '../lib/gemini';
import { generateSOAPPreview } from '../lib/soap-preview';
import { usePatients } from '../context/PatientContext';
import { ProcessNetworkMini } from './ProcessNetworkMini';
import { ScriptProgressTracker } from './ScriptProgressTracker';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
    adaptation?: SessionAdaptation; // For adaptive session suggestions
}

interface CoPilotChatProps {
    onSessionEnd: () => void;
    onAnalysisUpdate?: (analysis: { active_nodes?: any[] }) => void;
}

export const CoPilotChat: React.FC<CoPilotChatProps> = ({ onSessionEnd, onAnalysisUpdate }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [soapPreview, setSOAPPreview] = useState<any>(null);
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
    const [lastPreviewCount, setLastPreviewCount] = useState(0);

    // Radar PBT (Live) - Enhanced with typing
    const [activeProcesses, setActiveProcesses] = useState<ActiveProcess[]>([]);
    const [isAnalyzingProcesses, setIsAnalyzingProcesses] = useState(false);

    // Voice recording states
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
    const [interimTranscript, setInterimTranscript] = useState('');

    // Session Script (GPS Terapêutico) - Now structured
    const [sessionScript, setSessionScript] = useState<string | null>(null);
    const [scriptItems, setScriptItems] = useState<ScriptItem[]>([]);
    const [isCheckingProgress, setIsCheckingProgress] = useState(false);
    const [isCrisisMode, setIsCrisisMode] = useState(false);
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // Library Consultant
    const [isConsultingLibrary, setIsConsultingLibrary] = useState(false);

    // Pending Adaptation (waiting for user decision)
    const [pendingAdaptation, setPendingAdaptation] = useState<SessionAdaptation | null>(null);
    const [isAnalyzingDemand, setIsAnalyzingDemand] = useState(false);

    // Command Center Tabs
    type CommandTab = 'rede' | 'roteiro' | 'soap';
    const [activeCommandTab, setActiveCommandTab] = useState<CommandTab>('roteiro');
    const [tabNotifications, setTabNotifications] = useState<Record<CommandTab, boolean>>({ rede: false, roteiro: false, soap: false });
    const [lastSeenData, setLastSeenData] = useState<{ rede: number; roteiro: number; soap: number }>({ rede: 0, roteiro: 0, soap: 0 });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const autoSendTimerRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    // Detect changes on Rede tab when not active
    useEffect(() => {
        if (activeCommandTab !== 'rede' && activeProcesses.length !== lastSeenData.rede) {
            setTabNotifications(prev => ({ ...prev, rede: true }));
        }
    }, [activeProcesses, activeCommandTab, lastSeenData.rede]);

    // Detect changes on Roteiro tab when not active
    useEffect(() => {
        const completedCount = scriptItems.filter(i => i.completed).length;
        if (activeCommandTab !== 'roteiro' && completedCount !== lastSeenData.roteiro) {
            setTabNotifications(prev => ({ ...prev, roteiro: true }));
        }
    }, [scriptItems, activeCommandTab, lastSeenData.roteiro]);

    // Detect changes on SOAP tab when not active
    useEffect(() => {
        const hasSoap = soapPreview ? 1 : 0;
        if (activeCommandTab !== 'soap' && hasSoap !== lastSeenData.soap) {
            setTabNotifications(prev => ({ ...prev, soap: true }));
        }
    }, [soapPreview, activeCommandTab, lastSeenData.soap]);

    // ... (rest of useEffects)

    const handleConsultLibrary = async () => {
        if (messages.length === 0) {
            alert("Comece a sessão ou digite algo para dar contexto ao bibliotecário.");
            return;
        }

        setIsConsultingLibrary(true);
        try {
            // Build context from last messages
            const context = messages.slice(-3).map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${m.text}`).join('\n');
            const suggestion = await consultCoreLibrary(context);

            const libraryMsg: Message = {
                id: crypto.randomUUID(),
                role: 'ai',
                text: `📚 **CONSULTA AO MANUAL SOCRÁTICO:**\n\n${suggestion}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, libraryMsg]);
        } catch (error) {
            console.error("Erro na consulta:", error);
        } finally {
            setIsConsultingLibrary(false);
        }
    };

    // Web Speech API setup
    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'pt-BR';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalText += transcript + ' ';
                    } else {
                        interimText += transcript;
                    }
                }

                if (finalText) {
                    setTranscript(prev => prev + finalText);
                    setInterimTranscript('');

                    // Auto-send after 2 seconds of silence
                    if (autoSendTimerRef.current) {
                        clearTimeout(autoSendTimerRef.current);
                    }
                    autoSendTimerRef.current = setTimeout(() => {
                        if (transcript.trim()) {
                            setInput(transcript.trim());
                            setTranscript('');
                        }
                    }, 2000);
                } else {
                    setInterimTranscript(interimText);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    // Silently ignore - user just paused
                    return;
                }
                setIsRecording(false);
            };

            recognition.onend = () => {
                if (isRecording) {
                    // Restart if still recording (continuous mode)
                    recognition.start();
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.warn('Web Speech API not supported in this browser');
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (autoSendTimerRef.current) {
                clearTimeout(autoSendTimerRef.current);
            }
        };
    }, [isRecording, transcript]);

    // Generate session script on session start
    const generateScript = async (isCrisis: boolean = false, crisisDetail: string = '') => {
        if (!currentPatient) return;

        setIsGeneratingScript(true);
        try {
            const lastSession = currentPatient.clinicalRecords?.sessions?.slice(-1)[0];

            // Build rich summary of last session
            let lastSessionSummary = 'Primeira sessão ou sem histórico.';
            if (lastSession?.soap) {
                const soap = lastSession.soap;
                const parts = [];
                if (soap.queixa_principal) parts.push(`Queixa Principal: ${soap.queixa_principal}`);
                if (soap.subjetivo?.length) parts.push(`Relatos: ${soap.subjetivo.map((s: any) => s.conteudo).slice(0, 2).join('; ')}`);
                if (soap.avaliacao) parts.push(`Avaliação: ${soap.avaliacao.slice(0, 200)}`);
                if (soap.plano?.length) parts.push(`Plano Anterior: ${soap.plano.slice(0, 3).join(', ')}`);
                lastSessionSummary = parts.join(' | ');
            }

            const planSummary = currentPatient.clinicalRecords?.treatmentPlan?.goals?.join(', ') || 'Plano a definir';

            const script = await generateSessionScript(
                currentPatient.name,
                lastSessionSummary,
                planSummary,
                isCrisis,
                crisisDetail
            );

            setSessionScript(script);
            setIsCrisisMode(isCrisis);

            // Parse script into structured items
            const parsedItems = parseScriptToItems(script);
            setScriptItems(parsedItems);

            // Add script as first message
            const scriptMsg: Message = {
                id: crypto.randomUUID(),
                role: 'ai',
                text: isCrisis
                    ? `🚨 **MODO CRISE ATIVADO**\n\n${script}`
                    : `📋 **ROTEIRO DA SESSÃO**\n\n${script}`,
                timestamp: new Date()
            };
            setMessages([scriptMsg]);

        } catch (error) {
            console.error('Error generating script:', error);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const handleStartSession = async () => {
        setSessionStartTime(new Date());
        await generateScript(false);
    };

    const handleCrisisMode = async () => {
        const crisisDetail = prompt('Descreva brevemente a situação de crise:');
        if (crisisDetail) {
            await generateScript(true, crisisDetail);
        }
    };

    // Handle accepting the adaptation suggestion
    const handleAcceptAdaptation = async () => {
        if (!pendingAdaptation || !currentPatient) return;

        setIsGeneratingScript(true);
        try {
            if (pendingAdaptation.action === 'substituir' && pendingAdaptation.newDemand) {
                // Generate new script for new demand
                await generateScript(true, pendingAdaptation.newDemand);
                const confirmMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'ai',
                    text: `✅ Roteiro atualizado! Foco agora: **${pendingAdaptation.newDemand}**`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, confirmMsg]);
            } else if (pendingAdaptation.action === 'adicionar' && pendingAdaptation.suggestedAddition) {
                // Add to existing script
                const additionScript = `\n\n📍 **ADICIONADO AO ROTEIRO:**\n- [ ] ${pendingAdaptation.suggestedAddition}`;
                setSessionScript(prev => prev + additionScript);
                const confirmMsg: Message = {
                    id: crypto.randomUUID(),
                    role: 'ai',
                    text: `✅ Adicionado ao roteiro: **${pendingAdaptation.suggestedAddition}**`,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, confirmMsg]);
            }
        } finally {
            setPendingAdaptation(null);
            setIsGeneratingScript(false);
        }
    };

    // Handle rejecting the adaptation (continue with original)
    const handleRejectAdaptation = () => {
        const confirmMsg: Message = {
            id: crypto.randomUUID(),
            role: 'ai',
            text: `👍 Entendido! Vamos continuar com o roteiro original.`,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, confirmMsg]);
        setPendingAdaptation(null);
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Reconhecimento de voz não disponível neste navegador. Use Chrome ou Edge.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            // Send accumulated transcript
            if (transcript.trim()) {
                setInput(transcript.trim());
                setTranscript('');
            }
        } else {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    // Helper function to parse script text into structured items
    const parseScriptToItems = (scriptText: string): ScriptItem[] => {
        const lines = scriptText.split('\n');
        const items: ScriptItem[] = [];

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            // Match lines starting with - [ ] or - [x]
            if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
                const text = trimmed.replace(/^- \[[ x]\]\s*/, '').trim();
                if (text) {
                    items.push({
                        id: `item_${idx}`,
                        text: text,
                        completed: trimmed.startsWith('- [x]'),
                        priority: text.toLowerCase().includes('urgent') || text.toLowerCase().includes('crise') ? 'high' : 'normal'
                    });
                }
            }
        });

        return items;
    };

    // Auto-gerar preview + check progress a cada 4 mensagens
    useEffect(() => {
        const shouldGenerate = messages.length > 0 &&
            messages.length >= lastPreviewCount + 4 &&
            !isLoading;

        if (shouldGenerate) {
            generatePreviewAndProgress();
        }
    }, [messages.length, isLoading]);

    const generatePreviewAndProgress = async () => {
        // Run all analyses in parallel (using Pro model)
        setIsGeneratingPreview(true);
        setIsCheckingProgress(true);
        setIsAnalyzingProcesses(true);

        try {
            const chatHistory = messages.map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${m.text}`).join('\n');
            const existingPBTNodes = currentPatient?.clinicalRecords?.caseFormulation?.pbtData?.nodes || [];

            const [preview, progressResult, processesResult] = await Promise.all([
                generateSOAPPreview(messages, currentPatient),
                scriptItems.length > 0
                    ? checkScriptProgress(chatHistory, scriptItems.map(i => i.text), currentPatient?.name || 'Paciente')
                    : Promise.resolve({ completedItems: [], reasoning: '' }),
                monitorActiveProcesses(chatHistory, existingPBTNodes)
            ]);

            setSOAPPreview(preview);
            setLastPreviewCount(messages.length);

            // Update script items with completed status
            if (progressResult.completedItems.length > 0) {
                setScriptItems(prev => prev.map((item, idx) => ({
                    ...item,
                    completed: progressResult.completedItems.includes(idx) || item.completed
                })));
            }

            // Update active processes
            if (processesResult?.active_nodes) {
                setActiveProcesses(processesResult.active_nodes);
                if (onAnalysisUpdate) {
                    onAnalysisUpdate({ active_nodes: processesResult.active_nodes });
                }
            }
        } catch (error) {
            console.error('Error generating preview/progress:', error);
        } finally {
            setIsGeneratingPreview(false);
            setIsCheckingProgress(false);
            setIsAnalyzingProcesses(false);
        }
    };

    const generatePreview = async () => {
        setIsGeneratingPreview(true);
        try {
            const preview = await generateSOAPPreview(messages, currentPatient);
            setSOAPPreview(preview);
            setLastPreviewCount(messages.length);
        } catch (error) {
            console.error('Error generating preview:', error);
        } finally {
            setIsGeneratingPreview(false);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const context = messages.slice(-5).map(m => `${m.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${m.text}`).join('\n');

            // Run Copilot with Flash model (quick response)
            const suggestion = await getCoPilotSuggestion(userMsg.text, context, currentPatient);

            const aiMsg: Message = { id: crypto.randomUUID(), role: 'ai', text: suggestion, timestamp: new Date() };
            setMessages(prev => [...prev, aiMsg]);

            // Note: PBT Radar now runs in background every 4 messages via generatePreviewAndProgress

            // ADAPTIVE SESSION: Analyze demand after first patient update (messages count ~2-3)
            if (sessionScript && messages.length <= 3 && currentPatient) {
                setIsAnalyzingDemand(true);
                try {
                    const treatmentPlan = currentPatient.clinicalRecords?.treatmentPlan?.goals?.join(', ') || 'Plano a definir';
                    const adaptation = await analyzeSessionDemand(
                        userMsg.text,
                        sessionScript,
                        treatmentPlan,
                        currentPatient.name
                    );

                    if (adaptation.action !== 'manter') {
                        // Show adaptation suggestion with action buttons
                        const adaptMsg: Message = {
                            id: crypto.randomUUID(),
                            role: 'ai',
                            text: `🎯 **SUGESTÃO DE ADAPTAÇÃO**\n\n${adaptation.messageToTherapist}\n\n_${adaptation.reasoning}_`,
                            timestamp: new Date(),
                            adaptation: adaptation
                        };
                        setMessages(prev => [...prev, adaptMsg]);
                        setPendingAdaptation(adaptation);
                    } else {
                        // Manter - just confirm
                        const confirmMsg: Message = {
                            id: crypto.randomUUID(),
                            role: 'ai',
                            text: `✅ ${adaptation.messageToTherapist}`,
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, confirmMsg]);
                    }
                } catch (adaptError) {
                    console.error("Adaptation analysis error:", adaptError);
                } finally {
                    setIsAnalyzingDemand(false);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalizeSession = async () => {
        if (messages.length === 0) return;
        if (!confirm("Encerrar sessão e gerar prontuário automático?")) return;

        setIsFinalizing(true);
        try {
            const fullHistory = messages.map(m => `[${m.timestamp.toLocaleTimeString()}] ${m.role === 'user' ? 'TERAPEUTA (Relato/Nota)' : 'CO-PILOTO (Sugestão)'}: ${m.text}`).join('\n');
            const currentPBT = currentPatient?.clinicalRecords?.caseFormulation?.pbtData || { nodes: [], edges: [] };
            const currentPlan = currentPatient?.clinicalRecords?.treatmentPlan || {};
            const currentFormulation = currentPatient?.clinicalRecords?.caseFormulation || {};

            // 1. Run Analysis
            const [analysisResult, postSessionAnalysis] = await Promise.all([
                summarizeChatToSoap(fullHistory),
                generatePostSessionAnalysis(fullHistory, currentPBT, currentPlan, currentFormulation)
            ]);

            if (currentPatient) {
                const sessionId = crypto.randomUUID();

                // 2. Generate Prontuario Record Logic (Simplified Import)
                let prontuarioRecord = null;
                try {
                    const { generateSessionRecord } = await import('../lib/gemini');
                    prontuarioRecord = await generateSessionRecord({
                        soap: analysisResult.soap,
                        notes: fullHistory,
                        patientName: currentPatient.name
                    });
                } catch (err) { console.error(err); }

                // 3. New Session Object
                const newSession = {
                    id: sessionId,
                    date: new Date().toISOString(),
                    notes: "Sessão assistida por Co-Piloto.\n\n" + fullHistory,
                    soap: analysisResult.soap,
                    pbtNetwork: postSessionAnalysis?.pbt_update?.new_struct?.nodes
                        ? postSessionAnalysis.pbt_update.new_struct
                        : (analysisResult.pbt_network || currentPBT),
                    adaptation: analysisResult.adaptacao
                };

                // 4. Update Patient
                const updatedPatient = { ...currentPatient };
                updatedPatient.clinicalRecords.sessions = [newSession, ...updatedPatient.clinicalRecords.sessions];

                // Add prontuario record
                if (prontuarioRecord) {
                    updatedPatient.clinicalRecords.prontuarioRecords = {
                        ...(updatedPatient.clinicalRecords.prontuarioRecords || {}),
                        [sessionId]: { ...prontuarioRecord, sessionDate: new Date().toISOString(), updatedAt: new Date().toISOString(), consultationType: 'presencial' }
                    };
                }

                // Update PBT if changed
                if (postSessionAnalysis?.pbt_update?.new_struct?.nodes?.length > 0) {
                    updatedPatient.clinicalRecords.caseFormulation.pbtData = postSessionAnalysis.pbt_update.new_struct;
                }

                updatePatient(updatedPatient);
                onSessionEnd();

                // 5. Feedback Report
                let msg = `✅ Sessão encerrada!\n\n`;
                if (postSessionAnalysis) {
                    msg += `🧠 INTELIGÊNCIA CLÍNICA:\n\n`;
                    msg += `1️⃣ PBT: ${postSessionAnalysis.pbt_update?.status === 'mudou' ? 'ATUALIZADA' : 'MANTIDA'}\n`;
                    if (postSessionAnalysis.pbt_update?.description) msg += `   "${postSessionAnalysis.pbt_update.description}"\n`;

                    msg += `\n2️⃣ PLANO: ${postSessionAnalysis.plan_review?.status === 'ajustar' ? '⚠️ SUGESTÃO DE AJUSTE' : '✅ MANTIDO'}\n`;
                    if (postSessionAnalysis.plan_review?.suggestions) msg += `   Sugestão: ${postSessionAnalysis.plan_review.suggestions.join('; ')}\n`;

                    msg += `\n3️⃣ DIAGNÓSTICO: ${postSessionAnalysis.formulation_check?.status || 'Ok'}\n`;
                    if (postSessionAnalysis.formulation_check?.insight) msg += `   Obs: ${postSessionAnalysis.formulation_check.insight}`;
                }
                alert(msg);
            }
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Erro ao processar encerramento.");
        } finally {
            setIsFinalizing(false);
        }
    };

    return (
        <div className="flex gap-3 h-[calc(100vh-3rem)]">
            {/* LEFT: CHAT */}
            <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">CO-PILOTO EM TEMPO REAL</h3>
                            <p className="text-xs text-gray-500">
                                {sessionStartTime ? `Sessão iniciada às ${sessionStartTime.toLocaleTimeString('pt-BR')}` : 'Supervisão imediata'}
                            </p>
                            {activeProcesses.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Radar PBT:</span>
                                    {activeProcesses.slice(0, 3).map((proc, idx) => (
                                        <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${proc.status === 'rigido'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                            {proc.status === 'rigido' ? <Activity className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                            {proc.label}
                                        </span>
                                    ))}
                                    {activeProcesses.length > 3 && <span className="text-[10px] text-gray-400 self-center">+{activeProcesses.length - 3}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!sessionStartTime && (
                            <button
                                onClick={handleStartSession}
                                className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                Iniciar
                            </button>
                        )}
                        <button
                            onClick={toggleRecording}
                            disabled={isFinalizing}
                            className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${isRecording
                                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                : 'bg-gray-500 hover:bg-gray-400 text-white'
                                }`}
                            title={isRecording ? 'Parar' : 'Gravar'}
                        >
                            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                        {sessionStartTime && (
                            <>
                                <button
                                    onClick={handleCrisisMode}
                                    disabled={isGeneratingScript || isFinalizing}
                                    className={`px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${isCrisisMode
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : 'bg-amber-500 hover:bg-amber-400 text-white'
                                        }`}
                                    title="Mudar demanda da sessão"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Mudar
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleFinalizeSession}
                            disabled={isFinalizing || messages.length === 0}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isFinalizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {isFinalizing ? "..." : "Encerrar"}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                            <Bot className="w-16 h-16 mb-4" />
                            <p className="text-sm">Sessão iniciada. Digite notas ou falas...</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-indigo-100'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                    ? 'bg-white text-gray-800 border border-gray-100 rounded-tr-none'
                                    : 'bg-indigo-600 text-white rounded-tl-none shadow-md'
                                    }`}>
                                    <div className="whitespace-pre-wrap">
                                        {msg.text.split('\n').map((line, i) => {
                                            // Render checkboxes
                                            if (line.trim().startsWith('- [ ]')) {
                                                const text = line.replace('- [ ]', '').trim();
                                                return (
                                                    <div key={i} className="flex items-start gap-2 my-1">
                                                        <input type="checkbox" className="mt-1 rounded" disabled />
                                                        <span>{text}</span>
                                                    </div>
                                                );
                                            }
                                            // Render bold text
                                            const boldRegex = /\*\*(.*?)\*\*/g;
                                            const parts = line.split(boldRegex);
                                            return (
                                                <div key={i}>
                                                    {parts.map((part, j) =>
                                                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Action Buttons for Adaptation Suggestions */}
                                    {msg.adaptation && pendingAdaptation && msg.adaptation === pendingAdaptation && (
                                        <div className="mt-3 flex gap-2 pt-3 border-t border-white/20">
                                            {msg.adaptation.action === 'substituir' && (
                                                <>
                                                    <button
                                                        onClick={handleAcceptAdaptation}
                                                        disabled={isGeneratingScript}
                                                        className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                                                    >
                                                        {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                                        Mudar Foco
                                                    </button>
                                                    <button
                                                        onClick={handleRejectAdaptation}
                                                        className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Manter Roteiro
                                                    </button>
                                                </>
                                            )}
                                            {msg.adaptation.action === 'adicionar' && (
                                                <>
                                                    <button
                                                        onClick={handleAcceptAdaptation}
                                                        disabled={isGeneratingScript}
                                                        className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                                                    >
                                                        {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                        Adicionar
                                                    </button>
                                                    <button
                                                        onClick={handleRejectAdaptation}
                                                        className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                        Ignorar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-indigo-50 px-4 py-2 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-gray-200">
                    {/* Transcript preview */}
                    {(transcript || interimTranscript) && (
                        <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                            <span className="text-amber-700 font-medium">🎤 Transcrevendo: </span>
                            <span className="text-gray-700">{transcript}</span>
                            <span className="text-gray-400 italic">{interimTranscript}</span>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="relative flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isRecording ? "Fale... (auto-envia em 2s de pausa)" : "Ex: 'Paciente relatou piora no sono'..."}
                            className={`flex-1 bg-gray-50 border text-gray-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isRecording ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                }`}
                            autoFocus
                            disabled={isRecording}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading || isFinalizing}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: COMMAND CENTER WITH TABS */}
            <div className="w-[480px] flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200">
                    {[
                        { id: 'roteiro' as CommandTab, label: 'Roteiro GPS', icon: '🧭', color: 'emerald' },
                        { id: 'soap' as CommandTab, label: 'SOAP', icon: '📋', color: 'purple' },
                        { id: 'rede' as CommandTab, label: 'Rede PBT', icon: '🧠', color: 'teal' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveCommandTab(tab.id);
                                setTabNotifications(prev => ({ ...prev, [tab.id]: false }));
                                setLastSeenData(prev => ({
                                    ...prev,
                                    [tab.id]: tab.id === 'rede' ? activeProcesses.length
                                        : tab.id === 'roteiro' ? scriptItems.filter(i => i.completed).length
                                            : soapPreview ? 1 : 0
                                }));
                            }}
                            className={`flex-1 px-2 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 relative transition-all ${activeCommandTab === tab.id
                                ? `bg-${tab.color}-50 text-${tab.color}-700 border-b-2 border-${tab.color}-500`
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tabNotifications[tab.id] && activeCommandTab !== tab.id && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                    {/* Rede PBT */}
                    {activeCommandTab === 'rede' && (
                        <div className="h-full">
                            <ProcessNetworkMini
                                activeProcesses={activeProcesses}
                                isLoading={isAnalyzingProcesses}
                            />
                        </div>
                    )}

                    {/* Roteiro GPS */}
                    {activeCommandTab === 'roteiro' && (
                        <div className="h-full">
                            <ScriptProgressTracker
                                scriptItems={scriptItems}
                                isLoading={isCheckingProgress}
                                onRefresh={() => generatePreviewAndProgress()}
                            />
                        </div>
                    )}

                    {/* SOAP Preview */}
                    {activeCommandTab === 'soap' && (
                        <div className="h-full flex flex-col">
                            <div className="p-2 border-b bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-white" />
                                    <h4 className="text-sm font-bold text-white">SOAP PREVIEW</h4>
                                </div>
                                <button
                                    onClick={generatePreview}
                                    disabled={isGeneratingPreview || messages.length === 0}
                                    className="p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                                    title="Atualizar preview"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 text-white ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 bg-purple-50">
                                {isGeneratingPreview ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                    </div>
                                ) : !soapPreview ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                        <p>Aguardando sessão...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs font-bold text-purple-600">S - Subjetivo</span>
                                            <p className="text-sm text-gray-700 mt-1">{soapPreview.queixa_principal || 'A definir...'}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs font-bold text-purple-600">O - Objetivo</span>
                                            <p className="text-sm text-gray-700 mt-1">{soapPreview.objetivo || 'A definir...'}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs font-bold text-purple-600">A - Avaliação</span>
                                            <p className="text-sm text-gray-700 mt-1">{soapPreview.avaliacao || 'A definir...'}</p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                                            <span className="text-xs font-bold text-purple-600">P - Plano</span>
                                            <p className="text-sm text-gray-700 mt-1">{soapPreview.plano || 'A definir...'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
