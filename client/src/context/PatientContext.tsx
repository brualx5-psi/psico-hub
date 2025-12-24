import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient } from '../types/patient';
import { migratePatientToEells, initializeEellsData } from '../lib/data-migration';

interface PatientContextType {
    patients: Patient[];
    currentPatient: Patient | null;
    isLoading: boolean;
    addPatient: (name: string, demographics?: any) => void;
    selectPatient: (id: string) => void;
    updatePatient: (patient: Patient) => void;
    deletePatient: (id: string) => void;
    clearCurrentPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Load initial state from localStorage
    const [patients, setPatients] = useState<Patient[]>([]);
    const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('clinic_patients');
        if (saved) {
            try {
                const loaded = JSON.parse(saved);
                const migrated = loaded.map((p: Patient) => migratePatientToEells(p));
                setPatients(migrated);
            } catch (e) {
                console.error("Failed to parse patients from local storage", e);
            }
        } else {
            // DEMO PATIENT: Maria Silva Santos
            const demoId = crypto.randomUUID();
            const mariaData: Patient = {
                id: demoId,
                name: "Maria Silva Santos",
                birthDate: "1985-05-15",
                createdAt: new Date().toISOString(),
                clinicalRecords: {
                    anamnesis: { content: "Paciente relata ansiedade e insônia após perda de emprego.", updatedAt: new Date().toISOString(), history: [] },
                    caseFormulation: { content: "", updatedAt: new Date().toISOString() },
                    treatmentPlan: { goals: ["Reduzir ruminação", "Melhorar sono"], updatedAt: new Date().toISOString() },
                    assessments: [],
                    customProtocols: [],
                    sessions: []
                },
                eellsData: {
                    ...initializeEellsData(),
                    pbt: {
                        nodes: [
                            { id: 'node-1', label: 'Desemprego', category: 'Contexto', change: 'novo', isTarget: false, isModerator: true }, // MODERATOR (Rounded)
                            { id: 'node-2', label: 'Preocupação', category: 'Cognitiva', change: 'aumentou', isTarget: true }, // MEDIATOR (Square)
                            { id: 'node-3', label: 'Isolamento', category: 'Comportamento', change: 'aumentou' },
                            { id: 'node-4', label: 'Motivação', category: 'Motivacional', change: 'diminuiu' },
                            { id: 'node-5', label: 'Tristeza', category: 'Afetiva', change: 'estavel' },
                            { id: 'node-6', label: 'Insônia', category: 'Biofisiológica', change: 'aumentou' },
                            { id: 'node-7', label: 'Irritabilidade', category: 'Afetiva', change: 'aumentou' }
                        ],
                        edges: [
                            // 1. Unidirectional (Black)
                            { source: 'node-1', target: 'node-2', relation: 'Gatilho', weight: 'forte', polarity: 'positive' },

                            // 2. Feedback Loop (Black-Black) "Spiral"
                            { source: 'node-2', target: 'node-3', relation: 'Ciclo Vicioso', weight: 'moderado', bidirectional: true, polarity: 'positive', reversePolarity: 'positive' },

                            // 3. Inhibition Loop (White-White) "Seesaw"
                            { source: 'node-4', target: 'node-5', relation: 'Conflito', weight: 'moderado', bidirectional: true, polarity: 'negative', reversePolarity: 'negative' },

                            // 4. Push-Pull (Black-White)
                            { source: 'node-6', target: 'node-7', relation: 'Desgaste', weight: 'forte', bidirectional: true, polarity: 'positive', reversePolarity: 'negative' }
                        ]
                    }
                }
            };
            setPatients([mariaData]);
        }
        setIsLoading(false);
    }, []);

    // Persist changes
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('clinic_patients', JSON.stringify(patients));
        }
    }, [patients, isLoading]);

    const addPatient = (name: string, demographics: any = {}) => {
        const newPatient: Patient = {
            id: crypto.randomUUID(),
            name,
            ...demographics,
            createdAt: new Date().toISOString(),
            clinicalRecords: {
                anamnesis: { content: "", updatedAt: new Date().toISOString(), history: [] },
                caseFormulation: { content: "", updatedAt: new Date().toISOString() },
                treatmentPlan: { goals: [], updatedAt: new Date().toISOString() },
                assessments: [],
                customProtocols: [],
                sessions: []
            },
            eellsData: initializeEellsData()
        };
        setPatients(prev => [...prev, newPatient]);
        // Auto select new patient? Maybe not.
    };

    const selectPatient = (id: string) => {
        const p = patients.find(p => p.id === id);
        setCurrentPatient(p || null);
    };

    const clearCurrentPatient = () => {
        setCurrentPatient(null);
    };

    const updatePatient = (updatedPatient: Patient) => {
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        if (currentPatient?.id === updatedPatient.id) {
            setCurrentPatient(updatedPatient);
        }
    };

    const deletePatient = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este paciente? Esta ação é irreversível.")) {
            setPatients(prev => prev.filter(p => p.id !== id));
            if (currentPatient?.id === id) {
                setCurrentPatient(null);
            }
        }
    };

    return (
        <PatientContext.Provider value={{ patients, currentPatient, isLoading, addPatient, selectPatient, updatePatient, deletePatient, clearCurrentPatient }}>
            {children}
        </PatientContext.Provider>
    );
};

export const usePatients = () => {
    const context = useContext(PatientContext);
    if (!context) throw new Error("usePatients must be used within a PatientProvider");
    return context;
};
