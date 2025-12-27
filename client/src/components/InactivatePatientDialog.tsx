import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface InactivatePatientDialogProps {
    isOpen: boolean;
    patientName: string;
    onClose: () => void;
    onConfirm: (reason: 'alta' | 'abandono' | 'transferencia' | 'outro', notes?: string) => void;
}

export const InactivatePatientDialog: React.FC<InactivatePatientDialogProps> = ({
    isOpen,
    patientName,
    onClose,
    onConfirm
}) => {
    const [reason, setReason] = useState<'alta' | 'abandono' | 'transferencia' | 'outro'>('alta');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(reason, notes);
        setNotes('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Inativar Paciente</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Você está prestes a inativar <span className="font-bold">{patientName}</span>.
                    Por favor, especifique o motivo:
                </p>

                <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                            type="radio"
                            name="reason"
                            value="alta"
                            checked={reason === 'alta'}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-800">Alta Terapêutica</div>
                            <div className="text-sm text-gray-500">Objetivos alcançados</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                            type="radio"
                            name="reason"
                            value="abandono"
                            checked={reason === 'abandono'}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-800">Abandono</div>
                            <div className="text-sm text-gray-500">Paciente interrompeu tratamento</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                            type="radio"
                            name="reason"
                            value="transferencia"
                            checked={reason === 'transferencia'}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-800">Transferência</div>
                            <div className="text-sm text-gray-500">Encaminhado para outro profissional</div>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                        <input
                            type="radio"
                            name="reason"
                            value="outro"
                            checked={reason === 'outro'}
                            onChange={(e) => setReason(e.target.value as any)}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-800">Outro Motivo</div>
                            <div className="text-sm text-gray-500">Especifique abaixo</div>
                        </div>
                    </label>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Observações (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 resize-none"
                        rows={3}
                        placeholder="Adicione observações sobre a inativação..."
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                    >
                        Confirmar Inativação
                    </button>
                </div>
            </div>
        </div>
    );
};
