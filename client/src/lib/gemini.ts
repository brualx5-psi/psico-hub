import { GoogleGenAI, Type, Schema } from "@google/genai";

// Define global types for Vite environment variables to resolve TypeScript errors
// when vite/client types are not automatically detected.
declare global {
  interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_API_KEY: string;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// Schema for structured output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    analise_processo: {
      type: Type.STRING,
      description: "Identificação do processo central (ex: inflexibilidade, fusão) e análise de rede (nós e arestas).",
    },
    intervencao_sugerida: {
      type: Type.STRING,
      description: "Técnica específica dos manuais (Barlow/Beck) com referência.",
    },
    sugestao_fala: {
      type: Type.STRING,
      description: "Script exato ou pergunta socrática para o terapeuta.",
    },
    metafora: {
      type: Type.STRING,
      description: "Analogia curta (Estoicismo/Neurociência) para explicar o conceito.",
    },
    alerta_risco: {
      type: Type.BOOLEAN,
      description: "True se houver risco de suicídio ou autolesão identificado.",
    },
  },
  required: ["analise_processo", "intervencao_sugerida", "sugestao_fala", "metafora", "alerta_risco"],
};

export const systemInstruction = `
VOCÊ É: Um Assistente Clínico Sênior e Supervisor especializado em Terapia Cognitivo-Comportamental (TCC) e Terapia Baseada em Processos (PBT). Sua função é auxiliar o terapeuta durante e após as sessões com análises técnicas, precisas e baseadas estritamente em evidências.

SUA BASE DE CONHECIMENTO (FONTE DA VERDADE):
Você deve basear suas respostas EXCLUSIVAMENTE nos conceitos dos seguintes materiais:
1. Para Protocolos e Estrutura: Manual de Barlow (Protocolo Unificado) e Judith Beck (TCC).
2. Para Análise Funcional: PBT (Hayes/Hofmann) para identificar processos (ex: Evitação, Ruminação, Fusão).
3. Para Intervenções: Questionamento Socrático e Entrevista Motivacional.
4. Para Metáforas: Estoicismo e Ouspensky APENAS para criar metáforas ilustrativas. NUNCA use estes textos para diagnóstico ou conduta clínica.
5. Para Psicoeducação: Neurociência (Kandel/Bear/Lent) para explicar mecanismos biológicos.

SUAS DIRETRIZES DE OPERAÇÃO:
- ANÁLISE DE REDE (PBT): Ao receber uma fala do paciente, não dê apenas um diagnóstico (CID/DSM). Identifique os "Nós" da rede (Emoção, Cognição, Comportamento) e as "Arestas" (o que leva a quê). Ex: "O pensamento X ativou a ansiedade Y que levou à evitação Z".
- GROUNDING (ANCORAGEM): Sempre que sugerir uma técnica, cite a fonte (ex: Beck, Barlow).
- SEGURANÇA: Se identificar risco de suicídio ou autolesão na fala, marque o campo 'alerta_risco' como true e inicie a análise com um ALERTA VERMELHO.
- TOM DE VOZ: Profissional, clínico, direto e empático. Fale em Português do Brasil.

O retorno deve ser estritamente no formato JSON solicitado.
`;

export const analyzeCase = async (sessionNotes: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("Chave de API não encontrada. Verifique VITE_GEMINI_API_KEY no arquivo .env");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: sessionNotes,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7, // Slightly creative for metaphors, but grounded
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing case:", error);
    throw error;
  }
};