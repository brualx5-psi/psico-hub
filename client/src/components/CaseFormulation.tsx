import React, { useState, useEffect } from 'react';
import { usePatients } from '../context/PatientContext';
import { EellsMechanisms, EellsFormulationV2, CoreBelief, FormulationHistoryEntry } from '../types/eells';
import { Save, Wand2, Loader2, FileText, BrainCircuit, ArrowRight } from 'lucide-react';
import { generatePBTEdgesFromFormulation } from '../lib/gemini';
import { useNavigation } from '../context/NavigationContext';
import { aggregateAnamnesisData } from '../lib/anamnesis-utils';
import { MechanismsCard } from './MechanismsCard';
import { FormulationNarrativeCard } from './FormulationNarrativeCard';

// Default empty mechanisms
const defaultMechanisms: EellsMechanisms = {
    precipitants: [],
    origins: [],
    resources: [],
    obstacles: [],
    observablePatterns: [],
    maintainingProcesses: [],
    coreBeliefs: []
};

// Default empty formulation
const defaultFormulation: EellsFormulationV2 = {
    explanatoryNarrative: '',
    caseSummary: '',
    testablePredictions: [],
    treatmentImplications: '',
    primaryDiagnosis: '',
    differentialDiagnosis: [],
    diagnosisNA: false,
    diagnosisNAReason: ''
};

export const CaseFormulation: React.FC = () => {
    const { currentPatient, updatePatient } = usePatients();
    const [mechanisms, setMechanisms] = useState<EellsMechanisms>(defaultMechanisms);
    const [formulation, setFormulation] = useState<EellsFormulationV2>(defaultFormulation);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingEdges, setIsGeneratingEdges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { navigateTo } = useNavigation();

    // Load existing data
    useEffect(() => {
        if (!currentPatient) return;

        const eellsData = (currentPatient as any).eellsData;

        // Load mechanisms (new format)
        if (eellsData?.mechanisms) {
            setMechanisms({
                ...defaultMechanisms,
                ...eellsData.mechanisms
            });
        }

        // Load formulation V2 (new format)
        if (eellsData?.formulationV2) {
            setFormulation({
                ...defaultFormulation,
                ...eellsData.formulationV2
            });
        }
        // Migrate from old format if exists
        else if (currentPatient.clinicalRecords.caseFormulation?.eells) {
            const oldEells = currentPatient.clinicalRecords.caseFormulation.eells;
            setFormulation({
                ...defaultFormulation,
                explanatoryNarrative: oldEells.narrative || '',
                primaryDiagnosis: oldEells.diagnosis || '',
                redFlags: oldEells.problemList?.redFlags,
                suicidality: oldEells.problemList?.suicidality,
                chemicalDependence: oldEells.problemList?.chemicalDependence
            });

            // Migrate quadrants to mechanisms if they exist in old format
            if (oldEells.explanatoryHypothesis) {
                const migratedMechanisms: EellsMechanisms = {
                    ...defaultMechanisms,
                    precipitants: oldEells.explanatoryHypothesis.precipitants
                        ? [{ id: crypto.randomUUID(), text: oldEells.explanatoryHypothesis.precipitants }]
                        : [],
                    origins: oldEells.explanatoryHypothesis.origins
                        ? [{ id: crypto.randomUUID(), text: oldEells.explanatoryHypothesis.origins }]
                        : [],
                    resources: oldEells.explanatoryHypothesis.resources
                        ? [{ id: crypto.randomUUID(), text: oldEells.explanatoryHypothesis.resources }]
                        : [],
                    obstacles: oldEells.explanatoryHypothesis.obstacles
                        ? [{ id: crypto.randomUUID(), text: oldEells.explanatoryHypothesis.obstacles }]
                        : []
                };
                setMechanisms(migratedMechanisms);
            }
        }
    }, [currentPatient]);

    // Save handler with version history
    const handleSave = (changeReason?: string) => {
        if (!currentPatient) return;
        setIsSaving(true);

        const now = new Date().toISOString();
        const existingFormulation = (currentPatient as any).eellsData?.formulationV2;

        // Create history entry only if MATERIAL change (anti-spam)
        let newHistory: FormulationHistoryEntry[] = formulation.history || [];

        const oldNarrative = existingFormulation?.explanatoryNarrative || '';
        const newNarrative = formulation.explanatoryNarrative || '';
        const oldDiagnosis = existingFormulation?.primaryDiagnosis || '';
        const newDiagnosis = formulation.primaryDiagnosis || '';

        // Calculate if change is material: >50 chars diff OR diagnosis changed
        const narrativeDiff = Math.abs(newNarrative.length - oldNarrative.length);
        const narrativeChanged = oldNarrative !== newNarrative && narrativeDiff > 50;

        // Diagnosis changed: had and removed, didn't have and added, or value changed
        const hadDiagnosis = oldDiagnosis.length > 0;
        const hasDiagnosis = newDiagnosis.length > 0;
        const diagnosisRemoved = hadDiagnosis && !hasDiagnosis;
        const diagnosisAdded = !hadDiagnosis && hasDiagnosis;
        const diagnosisModified = hadDiagnosis && hasDiagnosis && oldDiagnosis !== newDiagnosis;
        const diagnosisChanged = diagnosisRemoved || diagnosisAdded || diagnosisModified;

        const isMaterialChange = narrativeChanged || diagnosisChanged;

        if (existingFormulation?.explanatoryNarrative && isMaterialChange) {
            // Determine change type automatically
            let autoChangeType = 'Atualização';
            let structuredType: 'diagnosis_added' | 'diagnosis_removed' | 'diagnosis_modified' |
                'hypothesis_major' | 'hypothesis_minor' | 'combined' | 'update' = 'update';

            if (diagnosisRemoved) {
                autoChangeType = 'Remoção de diagnóstico (em revisão)';
                structuredType = 'diagnosis_removed';
            } else if (diagnosisAdded) {
                autoChangeType = 'Diagnóstico estabelecido';
                structuredType = 'diagnosis_added';
            } else if (diagnosisModified && narrativeChanged) {
                autoChangeType = 'Revisão de hipótese e diagnóstico';
                structuredType = 'combined';
            } else if (diagnosisModified) {
                autoChangeType = 'Revisão de diagnóstico';
                structuredType = 'diagnosis_modified';
            } else if (narrativeDiff > 200) {
                autoChangeType = 'Mudança significativa de hipótese';
                structuredType = 'hypothesis_major';
            } else {
                autoChangeType = 'Ajuste de narrativa';
                structuredType = 'hypothesis_minor';
            }

            const historyEntry: FormulationHistoryEntry = {
                id: crypto.randomUUID(),
                date: now,
                narrative: existingFormulation.explanatoryNarrative,
                diagnosis: existingFormulation.primaryDiagnosis,
                changeReason: changeReason || autoChangeType,
                changeType: structuredType,
                changedBy: 'terapeuta'
            };
            newHistory = [historyEntry, ...newHistory].slice(0, 20);
        }

        updatePatient({
            ...currentPatient,
            eellsData: {
                ...(currentPatient as any).eellsData,
                mechanisms: {
                    ...mechanisms,
                    lastUpdated: now.split('T')[0]
                },
                formulationV2: {
                    ...formulation,
                    history: newHistory,
                    lastUpdated: now.split('T')[0]
                }
            }
        } as any);

        setTimeout(() => setIsSaving(false), 1000);
    };

    // AI auto-fill (adapted for new format)
    const handleAutoFill = async () => {
        if (!currentPatient) return;
        setIsGenerating(true);

        try {
            const anamnesisText = aggregateAnamnesisData(currentPatient);
            const assessments = currentPatient.clinicalRecords.assessments || [];

            const { generateInitialFormulation } = await import('../lib/gemini');
            const result = await generateInitialFormulation(anamnesisText, assessments);

            // Helper: convert array or string to MechanismItem[]
            const toMechanismItems = (input: string[] | string | undefined): { id: string; text: string }[] => {
                if (!input) return [];
                if (Array.isArray(input)) {
                    return input.map(text => ({ id: crypto.randomUUID(), text }));
                }
                // Fallback for string (old format)
                return [{ id: crypto.randomUUID(), text: input }];
            };

            // Update Mechanisms with arrays from AI
            const newMechanisms: EellsMechanisms = {
                ...mechanisms,
                precipitants: result.precipitants?.length
                    ? toMechanismItems(result.precipitants)
                    : mechanisms.precipitants,
                origins: result.origins?.length
                    ? toMechanismItems(result.origins)
                    : mechanisms.origins,
                resources: result.resources?.length
                    ? toMechanismItems(result.resources)
                    : mechanisms.resources,
                obstacles: result.obstacles?.length
                    ? toMechanismItems(result.obstacles)
                    : mechanisms.obstacles,
                maintainingProcesses: result.maintainingProcesses?.length
                    ? result.maintainingProcesses
                    : mechanisms.maintainingProcesses,
                observablePatterns: result.observablePatterns?.length
                    ? result.observablePatterns
                    : mechanisms.observablePatterns
            };
            setMechanisms(newMechanisms);

            // Update Formulation V2
            const newFormulation: EellsFormulationV2 = {
                ...formulation,
                explanatoryNarrative: result.narrativeDraft || formulation.explanatoryNarrative,
                primaryDiagnosis: result.suggestedDiagnosis || formulation.primaryDiagnosis,
                redFlags: result.problemList || formulation.redFlags,
                suicidality: result.suicidality === true,
                chemicalDependence: result.chemicalDependence === true
            };
            setFormulation(newFormulation);

            // Auto-save
            const now = new Date().toISOString().split('T')[0];
            updatePatient({
                ...currentPatient,
                eellsData: {
                    ...(currentPatient as any).eellsData,
                    mechanisms: { ...newMechanisms, lastUpdated: now },
                    formulationV2: { ...newFormulation, lastUpdated: now }
                }
            } as any);

        } catch (error) {
            console.error("Auto-fill error", error);
            alert("Erro ao gerar formulação. Verifique a chave de API.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Generate PBT Edges
    const handleGeneratePBTEdges = async () => {
        if (!currentPatient) return;

        const currentSession = currentPatient.clinicalRecords.sessions[0];
        const existingNodes = currentSession?.pbtNetwork?.nodes || [];
        const existingEdges = currentSession?.pbtNetwork?.edges || [];

        if (existingNodes.length < 2) {
            alert('Você precisa ter pelo menos 2 processos (nós) na Rede PBT primeiro.\n\nDica: Vá para Anamnese e clique em "Gerar Processos PBT".');
            return;
        }

        if (!confirm(`Gerar Conexões (Setas) entre os ${existingNodes.length} processos existentes?`)) return;

        setIsGeneratingEdges(true);
        try {
            // Convert new format to old format for compatibility with existing function
            const legacyFormulation = {
                diagnosis: formulation.primaryDiagnosis || '',
                narrative: formulation.explanatoryNarrative || '',
                problemList: { redFlags: formulation.redFlags || '', suicidality: false, chemicalDependence: false, functioning: '' },
                explanatoryHypothesis: {
                    precipitants: mechanisms.precipitants.map(p => p.text).join('; '),
                    origins: mechanisms.origins.map(p => p.text).join('; '),
                    resources: mechanisms.resources.map(p => p.text).join('; '),
                    obstacles: mechanisms.obstacles.map(p => p.text).join('; '),
                    coreHypothesis: formulation.explanatoryNarrative || ''
                },
                treatmentPlan: { goals: '', interventions: '' }
            };

            const result = await generatePBTEdgesFromFormulation(legacyFormulation, existingNodes, existingEdges);

            const mergedEdges = [...existingEdges, ...result.edges];
            const updatedPatient = JSON.parse(JSON.stringify(currentPatient));
            updatedPatient.clinicalRecords.sessions[0].pbtNetwork = {
                nodes: existingNodes,
                edges: mergedEdges
            };

            updatePatient(updatedPatient);
            alert(`✅ ${result.edges.length} conexões geradas! Vá para "Rede PBT" para visualizar.`);
        } catch (error) {
            console.error('Erro ao gerar conexões PBT:', error);
            alert('Erro ao gerar conexões. Tente novamente.');
        } finally {
            setIsGeneratingEdges(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-400" />
                    Formulação de Caso (Eells)
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoFill}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        Auto-Preencher com IA
                    </button>
                    <button
                        onClick={handleGeneratePBTEdges}
                        disabled={isGeneratingEdges}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-lg hover:from-cyan-700 hover:to-teal-700 transition-colors text-sm font-medium shadow-md"
                    >
                        {isGeneratingEdges ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {isGeneratingEdges ? 'Gerando...' : '🕸️ Gerar Conexões PBT'}
                    </button>
                    <button
                        onClick={() => handleSave()}
                        className="flex items-center gap-2 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold transition-colors text-sm"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar
                    </button>
                </div>
            </div>

            {/* Mechanisms Card */}
            <MechanismsCard
                mechanisms={mechanisms}
                onChange={setMechanisms}
            />

            {/* Formulation Narrative Card */}
            <FormulationNarrativeCard
                formulation={formulation}
                onChange={setFormulation}
            />

            {/* Guidance for Next Steps */}
            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-200 rounded-2xl p-6 animate-in slide-in-from-bottom-8 duration-700 shadow-lg">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h4 className="text-lg font-bold text-cyan-900 flex items-center gap-2">
                            🧠 Conecte os Pontos
                        </h4>
                        <p className="text-sm text-cyan-800/80 max-w-lg">
                            Visualize e ajuste as conexões da rede de processos.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={handleGeneratePBTEdges}
                            disabled={isGeneratingEdges}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50"
                        >
                            {isGeneratingEdges ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                            {isGeneratingEdges ? 'Gerando...' : '🕸️ Gerar Conexões'}
                        </button>
                        <button
                            onClick={() => navigateTo('network')}
                            className="flex items-center justify-center gap-2 bg-white hover:bg-cyan-50 text-cyan-700 border-2 border-cyan-300 px-5 py-3 rounded-xl font-semibold transition-all shadow-sm"
                        >
                            Ver Rede PBT
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
