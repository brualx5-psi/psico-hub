import React, { useRef, useEffect } from 'react';
import { Brain, Target, TrendingDown, AlertCircle } from 'lucide-react';
import { ActiveProcess } from '../lib/gemini';

interface ProcessNetworkMiniProps {
    activeProcesses: ActiveProcess[];
    isLoading?: boolean;
}

// Color mapping for process status
const getStatusColor = (status: string, isKnown: boolean) => {
    if (status === 'rigido') return isKnown ? '#dc2626' : '#f97316'; // Red for known rigid, orange for new
    if (status === 'enfraquecendo') return '#22c55e'; // Green for weakening
    return '#6366f1'; // Indigo for flexible
};

const getStatusBg = (status: string, isKnown: boolean) => {
    if (status === 'rigido') return isKnown ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300';
    if (status === 'enfraquecendo') return 'bg-emerald-100 border-emerald-300';
    return 'bg-indigo-100 border-indigo-300';
};

const getStatusIcon = (status: string, isKnown: boolean) => {
    if (status === 'rigido' && isKnown) return <Target className="w-3 h-3" />;
    if (status === 'rigido') return <AlertCircle className="w-3 h-3" />;
    if (status === 'enfraquecendo') return <TrendingDown className="w-3 h-3" />;
    return null;
};

// Helper to clean markdown formatting from text
const cleanMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .trim();
};

export const ProcessNetworkMini: React.FC<ProcessNetworkMiniProps> = ({
    activeProcesses,
    isLoading
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw mini network visualization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || activeProcesses.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate node positions in a circle
        const nodes = activeProcesses.slice(0, 5); // Max 5 nodes
        const nodePositions: { [key: string]: { x: number; y: number } } = {};

        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
            nodePositions[node.id] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        // Draw connections first (behind nodes)
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        nodes.forEach(node => {
            if (node.connections) {
                node.connections.forEach(targetId => {
                    const targetNode = nodes.find(n => n.id === targetId);
                    if (targetNode && nodePositions[node.id] && nodePositions[targetId]) {
                        ctx.beginPath();
                        ctx.moveTo(nodePositions[node.id].x, nodePositions[node.id].y);
                        ctx.lineTo(nodePositions[targetId].x, nodePositions[targetId].y);
                        ctx.stroke();
                    }
                });
            }
        });

        ctx.setLineDash([]);

        // Draw nodes
        nodes.forEach(node => {
            const pos = nodePositions[node.id];
            if (!pos) return;

            const color = getStatusColor(node.status, node.isKnown);
            const nodeRadius = node.intensity === 'alta' ? 16 : node.intensity === 'media' ? 12 : 10;

            // Node circle with glow for rigid processes
            if (node.status === 'rigido') {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius + 8, 0, 2 * Math.PI);
                ctx.fillStyle = color + '30';
                ctx.fill();
            }

            // Main node circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();

            // White inner circle for known processes
            if (node.isKnown) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, nodeRadius * 0.4, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        });

    }, [activeProcesses]);

    if (isLoading) {
        return (
            <div className="h-full flex flex-col">
                <div className="p-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
                    <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-white" />
                        <h4 className="text-sm font-bold text-white">PROCESSOS ATIVOS</h4>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-purple-400 text-xs">Analisando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-white" />
                    <h4 className="text-sm font-bold text-white">PROCESSOS ATIVOS</h4>
                </div>
                <p className="text-[10px] text-purple-100 mt-0.5">
                    {activeProcesses.length > 0 ? `${activeProcesses.length} processos detectados` : 'Aguardando sessão...'}
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 p-2 overflow-hidden">
                {activeProcesses.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs text-center">
                        <div>
                            <Brain className="w-8 h-8 mx-auto mb-1 opacity-20" />
                            <p>Nenhum processo ativo detectado ainda</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Mini Canvas Network */}
                        <div className="flex-shrink-0 flex justify-center mb-2">
                            <canvas
                                ref={canvasRef}
                                width={160}
                                height={100}
                                className="rounded-lg bg-slate-50"
                            />
                        </div>

                        {/* Process List */}
                        <div className="flex-1 overflow-y-auto space-y-1">
                            {activeProcesses.slice(0, 4).map((proc) => (
                                <div
                                    key={proc.id}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${getStatusBg(proc.status, proc.isKnown)}`}
                                >
                                    {getStatusIcon(proc.status, proc.isKnown)}
                                    <span className="flex-1 truncate font-medium">{cleanMarkdown(proc.label)}</span>
                                    {proc.isKnown && (
                                        <span className="text-[9px] bg-white/60 px-1 rounded">🎯 CONHECIDO</span>
                                    )}
                                    {!proc.isKnown && proc.status === 'rigido' && (
                                        <span className="text-[9px] bg-white/60 px-1 rounded">⭐ NOVO</span>
                                    )}
                                </div>
                            ))}
                            {activeProcesses.length > 4 && (
                                <div className="text-[10px] text-gray-400 text-center">
                                    +{activeProcesses.length - 4} mais
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessNetworkMini;
