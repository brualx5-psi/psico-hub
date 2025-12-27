import React, { useState, useMemo } from 'react';
import { usePatients } from '../context/PatientContext';
import { HomeworkTask, HomeworkStatus, HomeworkCategory, HomeworkTemplate } from '../types/homework';
import { GASPlan, GASMeta } from '../types/eells';
import { HOMEWORK_TEMPLATES, CATEGORY_INFO, getTemplatesByCategory } from '../data/homework-templates';
import {
    BookOpen,
    Plus,
    Check,
    X,
    Clock,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Target,
    Sparkles,
    Edit2,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

interface HomeworkPanelProps {
    onSuggestAI?: () => void;
}

export const HomeworkPanel: React.FC<HomeworkPanelProps> = ({ onSuggestAI }) => {
    const { currentPatient, updatePatient } = usePatients();
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<HomeworkCategory | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
    const [reviewingTask, setReviewingTask] = useState<string | null>(null);

    // Form state
    const [taskName, setTaskName] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskInstructions, setTaskInstructions] = useState('');
    const [taskCategory, setTaskCategory] = useState<HomeworkCategory>('outro');
    const [linkedGASMetaId, setLinkedGASMetaId] = useState<string>('');
    const [reviewStatus, setReviewStatus] = useState<HomeworkStatus>('pending');
    const [reviewNotes, setReviewNotes] = useState('');

    // Get patient data
    const activeTasks: HomeworkTask[] = useMemo(() => {
        return (currentPatient as any)?.homework?.activeTasks || [];
    }, [currentPatient]);

    const completedTasks: HomeworkTask[] = useMemo(() => {
        return (currentPatient as any)?.homework?.completedTasks || [];
    }, [currentPatient]);

    const gasPlans: GASPlan[] = useMemo(() => {
        return (currentPatient as any)?.eellsData?.gasPlans || [];
    }, [currentPatient]);

    const activeMetas: GASMeta[] = useMemo(() => {
        const activePlan = gasPlans.find(p => p.status === 'active');
        return activePlan?.metas.filter(m => m.status === 'active') || [];
    }, [gasPlans]);

    const toggleTask = (id: string) => {
        setExpandedTasks(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const handleSelectTemplate = (template: HomeworkTemplate) => {
        setTaskName(template.name);
        setTaskDescription(template.description);
        setTaskInstructions(template.instructions);
        setTaskCategory(template.category);
        setShowTemplates(false);
        setSelectedCategory(null);
        setIsCreating(true);
    };

    const handleCreateTask = () => {
        if (!taskName.trim() || !currentPatient) return;

        const newTask: HomeworkTask = {
            id: crypto.randomUUID(),
            patientId: currentPatient.id,
            name: taskName,
            description: taskDescription,
            instructions: taskInstructions,
            category: taskCategory,
            linkedGASMetaId: linkedGASMetaId || undefined,
            assignedAt: new Date().toISOString(),
            status: 'pending'
        };

        const currentHomework = (currentPatient as any).homework || { activeTasks: [], completedTasks: [] };

        updatePatient({
            ...currentPatient,
            homework: {
                ...currentHomework,
                activeTasks: [...currentHomework.activeTasks, newTask]
            }
        } as any);

        resetForm();
    };

    const handleReviewTask = (taskId: string) => {
        if (!currentPatient) return;

        const currentHomework = (currentPatient as any).homework || { activeTasks: [], completedTasks: [] };
        const task = currentHomework.activeTasks.find((t: HomeworkTask) => t.id === taskId);

        if (!task) return;

        const updatedTask: HomeworkTask = {
            ...task,
            status: reviewStatus,
            reviewedAt: new Date().toISOString(),
            completionNotes: reviewNotes
        };

        // Move to completed if done
        const isCompleted = reviewStatus === 'completed' || reviewStatus === 'not_done';

        updatePatient({
            ...currentPatient,
            homework: {
                activeTasks: isCompleted
                    ? currentHomework.activeTasks.filter((t: HomeworkTask) => t.id !== taskId)
                    : currentHomework.activeTasks.map((t: HomeworkTask) => t.id === taskId ? updatedTask : t),
                completedTasks: isCompleted
                    ? [...currentHomework.completedTasks, updatedTask]
                    : currentHomework.completedTasks
            }
        } as any);

        setReviewingTask(null);
        setReviewStatus('pending');
        setReviewNotes('');
    };

    const handleDeleteTask = (taskId: string) => {
        if (!currentPatient) return;

        const currentHomework = (currentPatient as any).homework || { activeTasks: [], completedTasks: [] };

        updatePatient({
            ...currentPatient,
            homework: {
                ...currentHomework,
                activeTasks: currentHomework.activeTasks.filter((t: HomeworkTask) => t.id !== taskId)
            }
        } as any);
    };

    const resetForm = () => {
        setTaskName('');
        setTaskDescription('');
        setTaskInstructions('');
        setTaskCategory('outro');
        setLinkedGASMetaId('');
        setIsCreating(false);
    };

    const getStatusInfo = (status: HomeworkStatus) => {
        switch (status) {
            case 'completed':
                return { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-100', label: 'Concluída' };
            case 'partial':
                return { icon: <AlertCircle className="w-4 h-4" />, color: 'text-amber-600 bg-amber-100', label: 'Parcial' };
            case 'not_done':
                return { icon: <X className="w-4 h-4" />, color: 'text-red-600 bg-red-100', label: 'Não fez' };
            default:
                return { icon: <Clock className="w-4 h-4" />, color: 'text-blue-600 bg-blue-100', label: 'Pendente' };
        }
    };

    if (!currentPatient) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Lições de Casa</h2>
                        <p className="text-sm text-gray-600">{activeTasks.length} tarefa(s) ativa(s)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {onSuggestAI && (
                        <button
                            onClick={onSuggestAI}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Sugestões IA
                        </button>
                    )}
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Tarefa
                    </button>
                </div>
            </div>

            {/* Active Tasks */}
            {activeTasks.length > 0 ? (
                <div className="space-y-3">
                    {activeTasks.map((task) => {
                        const isExpanded = expandedTasks.includes(task.id);
                        const isReviewing = reviewingTask === task.id;
                        const statusInfo = getStatusInfo(task.status);
                        const categoryInfo = CATEGORY_INFO[task.category];
                        const linkedMeta = activeMetas.find(m => m.id === task.linkedGASMetaId);

                        return (
                            <div key={task.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Task Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                        <span className="text-xl">{categoryInfo.icon}</span>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{task.name}</h4>
                                            <p className="text-xs text-gray-500">
                                                Prescrita em {new Date(task.assignedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {linkedMeta && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                                                <Target className="w-3 h-3" />
                                                GAS
                                            </span>
                                        )}
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo.color}`}>
                                            {statusInfo.icon}
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                                        {/* Description */}
                                        <p className="text-sm text-gray-700 mb-3">{task.description}</p>

                                        {/* Instructions */}
                                        {task.instructions && (
                                            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
                                                <h5 className="text-xs font-semibold text-gray-600 uppercase mb-2">Instruções</h5>
                                                <p className="text-sm text-gray-700 whitespace-pre-line">{task.instructions}</p>
                                            </div>
                                        )}

                                        {/* Linked GAS Meta */}
                                        {linkedMeta && (
                                            <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                                                <Target className="w-4 h-4 text-purple-600" />
                                                <span className="text-sm text-purple-700">Vinculada à meta: {linkedMeta.title}</span>
                                            </div>
                                        )}

                                        {/* Review Section */}
                                        {isReviewing ? (
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <h5 className="font-semibold text-gray-800 mb-3">Revisar Tarefa</h5>
                                                <div className="flex gap-2 mb-3">
                                                    {[
                                                        { value: 'completed', label: '✅ Fez', color: 'bg-green-500' },
                                                        { value: 'partial', label: '⚡ Parcial', color: 'bg-amber-500' },
                                                        { value: 'not_done', label: '❌ Não fez', color: 'bg-red-500' }
                                                    ].map(({ value, label, color }) => (
                                                        <button
                                                            key={value}
                                                            onClick={() => setReviewStatus(value as HomeworkStatus)}
                                                            className={`flex-1 py-3 rounded-lg text-white font-bold transition-all ${color} ${reviewStatus === value ? 'ring-4 ring-offset-2 ring-purple-500 scale-105' : 'opacity-60'}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    placeholder="Observações sobre a tarefa..."
                                                    value={reviewNotes}
                                                    onChange={(e) => setReviewNotes(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleReviewTask(task.id)}
                                                        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                                                    >
                                                        Salvar Revisão
                                                    </button>
                                                    <button
                                                        onClick={() => setReviewingTask(null)}
                                                        className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setReviewingTask(task.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Revisar
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma tarefa ativa</h3>
                    <p className="text-gray-500 mb-4">Prescreva tarefas para o paciente praticar entre sessões.</p>
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Tarefa
                    </button>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                            <h2 className="text-xl font-bold text-white">
                                {selectedCategory ? CATEGORY_INFO[selectedCategory].label : 'Biblioteca de Tarefas'}
                            </h2>
                            <button
                                onClick={() => { setShowTemplates(false); setSelectedCategory(null); }}
                                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                            {!selectedCategory ? (
                                /* Categories */
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {(Object.keys(CATEGORY_INFO) as HomeworkCategory[]).map((category) => {
                                        const info = CATEGORY_INFO[category];
                                        const count = HOMEWORK_TEMPLATES.filter(t => t.category === category).length;
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
                                            >
                                                <span className="text-4xl">{info.icon}</span>
                                                <span className="font-semibold text-gray-800">{info.label}</span>
                                                <span className="text-sm text-gray-500">{count} template(s)</span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => { setShowTemplates(false); setIsCreating(true); }}
                                        className="flex flex-col items-center gap-3 p-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl border-2 border-dashed border-indigo-300 transition-all"
                                    >
                                        <Plus className="w-10 h-10 text-indigo-600" />
                                        <span className="font-semibold text-indigo-700">Criar Personalizada</span>
                                    </button>
                                </div>
                            ) : (
                                /* Templates List */
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mb-4"
                                    >
                                        ← Voltar às categorias
                                    </button>
                                    {getTemplatesByCategory(selectedCategory).map((template) => (
                                        <div
                                            key={template.id}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 cursor-pointer transition-all"
                                            onClick={() => handleSelectTemplate(template)}
                                        >
                                            <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                                {template.suggestedFrequency}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Nova Tarefa</h2>
                            <button onClick={resetForm} className="p-2 rounded-full hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Task Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome da Tarefa</label>
                                <input
                                    type="text"
                                    value={taskName}
                                    onChange={(e) => setTaskName(e.target.value)}
                                    placeholder="Ex: Praticar respiração diafragmática"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    value={taskDescription}
                                    onChange={(e) => setTaskDescription(e.target.value)}
                                    placeholder="Breve descrição da tarefa..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                />
                            </div>

                            {/* Instructions */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Instruções Detalhadas</label>
                                <textarea
                                    value={taskInstructions}
                                    onChange={(e) => setTaskInstructions(e.target.value)}
                                    placeholder="Passos detalhados para o paciente seguir..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={4}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                                <select
                                    value={taskCategory}
                                    onChange={(e) => setTaskCategory(e.target.value as HomeworkCategory)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {(Object.keys(CATEGORY_INFO) as HomeworkCategory[]).map((cat) => (
                                        <option key={cat} value={cat}>
                                            {CATEGORY_INFO[cat].icon} {CATEGORY_INFO[cat].label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Link to GAS */}
                            {activeMetas.length > 0 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Vincular à Meta GAS (opcional)</label>
                                    <select
                                        value={linkedGASMetaId}
                                        onChange={(e) => setLinkedGASMetaId(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Nenhuma</option>
                                        {activeMetas.map((meta) => (
                                            <option key={meta.id} value={meta.id}>
                                                {meta.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateTask}
                                    disabled={!taskName.trim()}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prescrever Tarefa
                                </button>
                                <button
                                    onClick={resetForm}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeworkPanel;
