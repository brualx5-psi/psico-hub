import React from 'react';
import { ListChecks, Check, Circle, ChevronDown, RefreshCw, Loader2 } from 'lucide-react';
import { ScriptItem } from '../lib/gemini';

interface ScriptProgressTrackerProps {
    scriptItems: ScriptItem[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

// Helper to clean markdown formatting from text
const cleanMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/__(.*?)__/g, '$1')     // Remove __bold__
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
        .replace(/_(.*?)_/g, '$1')       // Remove _italic_
        .replace(/`(.*?)`/g, '$1')       // Remove `code`
        .trim();
};

export const ScriptProgressTracker: React.FC<ScriptProgressTrackerProps> = ({
    scriptItems,
    isLoading,
    onRefresh
}) => {
    const completedCount = scriptItems.filter(item => item.completed).length;
    const totalCount = scriptItems.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b bg-gradient-to-r from-emerald-600 to-teal-600 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-white" />
                        <h4 className="text-sm font-bold text-white">ROTEIRO GPS</h4>
                    </div>
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="p-1 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                            title="Atualizar progresso"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                {totalCount > 0 && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-emerald-100 mb-1">
                            <span>{completedCount}/{totalCount} concluídos</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500 ease-out rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content - Scrollable List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && scriptItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                ) : scriptItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center p-4">
                        <div>
                            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>Clique em "Iniciar Sessão" para gerar o roteiro</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {scriptItems.map((item, idx) => (
                            <div
                                key={item.id}
                                className={`flex items-start gap-2 p-2 rounded-lg border transition-all duration-300 ${item.completed
                                    ? 'bg-emerald-50 border-emerald-200'
                                    : item.priority === 'high'
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-white border-gray-200'
                                    }`}
                            >
                                {/* Checkbox indicator */}
                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${item.completed
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    {item.completed ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        <span className="text-[10px] font-bold">{idx + 1}</span>
                                    )}
                                </div>

                                {/* Item text */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs leading-relaxed ${item.completed ? 'text-emerald-700 line-through opacity-70' : 'text-gray-700'
                                        }`}>
                                        {cleanMarkdown(item.text)}
                                    </p>
                                </div>

                                {/* Priority indicator */}
                                {item.priority === 'high' && !item.completed && (
                                    <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                        PRIORIDADE
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with scroll indicator */}
            {scriptItems.length > 4 && (
                <div className="p-2 border-t bg-gray-50 text-center flex-shrink-0">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                        <ChevronDown className="w-3 h-3" />
                        <span>Role para ver todos os itens</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScriptProgressTracker;
