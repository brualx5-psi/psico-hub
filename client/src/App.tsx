import React, { useState } from 'react';
import { analyzeCase } from './lib/gemini';
import { 
  BrainCircuit, 
  Target, 
  MessageCircle, 
  Lightbulb, 
  AlertTriangle, 
  Send, 
  Loader2,
  BookOpen
} from 'lucide-react';

interface AnalysisResult {
  analise_processo: string;
  intervencao_sugerida: string;
  sugestao_fala: string;
  metafora: string;
  alerta_risco: boolean;
}

function App() {
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeCase(notes);
      setResult(data);
    } catch (err) {
      setError('Ocorreu um erro ao processar a análise. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">NeuroStudy Architect</h1>
              <p className="text-xs text-slate-500 font-medium">SUPERVISOR CLÍNICO AI</p>
            </div>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Baseado em evidências: TCC & PBT
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Relato da Sessão
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                    Insira a fala do paciente ou notas clínicas
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all text-sm leading-relaxed"
                    placeholder="Ex: Paciente relata: 'Sinto que se eu falhar na prova, todos vão ver que sou uma fraude. Por isso, nem consegui abrir o livro ontem, fiquei paralisado no sofá...'"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !notes.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisando Protocolos...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Gerar Supervisão
                    </>
                  )}
                </button>
              </form>
              <div className="mt-4 text-xs text-slate-400 text-center">
                * As respostas são baseadas em manuais de TCC e PBT (Barlow, Beck, Hayes).
              </div>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-12 bg-slate-50/50">
                <BrainCircuit className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Aguardando dados clínicos</p>
                <p className="text-sm">Insira o relato ao lado para iniciar a supervisão.</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-32 bg-slate-200 rounded-xl"></div>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {result.alerta_risco && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-red-800 font-bold">ALERTA DE RISCO IDENTIFICADO</h3>
                      <p className="text-red-700 text-sm mt-1">
                        O relato contém indicadores de risco à integridade do paciente. Avalie risco de suicídio/autolesão imediatamente conforme protocolo de segurança.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card 1: Análise de Processo */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-700" />
                    <h3 className="font-bold text-indigo-900">Análise de Processo (PBT)</h3>
                  </div>
                  <div className="p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {result.analise_processo}
                  </div>
                </div>

                {/* Card 2: Intervenção */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-700" />
                    <h3 className="font-bold text-emerald-900">Intervenção Sugerida</h3>
                  </div>
                  <div className="p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {result.intervencao_sugerida}
                  </div>
                </div>

                {/* Grid for Script and Metaphor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 3: Script */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-sky-50 px-6 py-4 border-b border-sky-100 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-sky-700" />
                      <h3 className="font-bold text-sky-900">Sugestão de Fala</h3>
                    </div>
                    <div className="p-6 text-slate-700 leading-relaxed flex-grow italic bg-slate-50/50">
                      "{result.sugestao_fala}"
                    </div>
                  </div>

                  {/* Card 4: Metáfora */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-700" />
                      <h3 className="font-bold text-amber-900">Metáfora Terapêutica</h3>
                    </div>
                    <div className="p-6 text-slate-700 leading-relaxed flex-grow">
                      {result.metafora}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
