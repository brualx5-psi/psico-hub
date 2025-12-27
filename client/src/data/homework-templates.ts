// Biblioteca de Templates de Lições de Casa / Tarefas Terapêuticas

import { HomeworkTemplate, HomeworkCategory } from '../types/homework';

export const CATEGORY_INFO: Record<HomeworkCategory, { label: string; icon: string; color: string }> = {
    registro_pensamentos: {
        label: 'Registro de Pensamentos',
        icon: '📝',
        color: 'blue'
    },
    relaxamento: {
        label: 'Exercícios de Relaxamento',
        icon: '🧘',
        color: 'green'
    },
    exposicao: {
        label: 'Técnicas de Exposição',
        icon: '🎯',
        color: 'orange'
    },
    ativacao_comportamental: {
        label: 'Ativação Comportamental',
        icon: '⚡',
        color: 'purple'
    },
    habilidades_sociais: {
        label: 'Habilidades Sociais',
        icon: '🗣️',
        color: 'pink'
    },
    escrita_terapeutica: {
        label: 'Escrita Terapêutica',
        icon: '✍️',
        color: 'teal'
    },
    outro: {
        label: 'Outro',
        icon: '📋',
        color: 'gray'
    }
};

export const HOMEWORK_TEMPLATES: HomeworkTemplate[] = [
    // ==================== REGISTRO DE PENSAMENTOS ====================
    {
        id: 'rpd-basico',
        category: 'registro_pensamentos',
        name: 'Registro de Pensamentos Disfuncionais (RPD)',
        description: 'Identificar e registrar pensamentos automáticos negativos',
        instructions: `Quando perceber uma mudança de humor ou desconforto emocional:
1. Anote a SITUAÇÃO (o que estava acontecendo)
2. Anote os PENSAMENTOS automáticos (o que passou pela sua mente)
3. Anote as EMOÇÕES (o que sentiu, de 0-10)
4. Tente identificar DISTORÇÕES cognitivas
5. Formule um PENSAMENTO alternativo mais realista`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['depression', 'gad', 'panic', 'social_anxiety']
    },
    {
        id: 'diario-pensamentos',
        category: 'registro_pensamentos',
        name: 'Diário de Pensamentos Automáticos',
        description: 'Registro simples de pensamentos ao longo do dia',
        instructions: `Ao final de cada dia, reserve 10 minutos para:
1. Lembrar momentos em que se sentiu desconfortável
2. Anotar os pensamentos que teve nesses momentos
3. Classificar se eram realistas ou exagerados
4. Observar padrões ao longo da semana`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['depression', 'gad']
    },
    {
        id: 'questionamento-socratico',
        category: 'registro_pensamentos',
        name: 'Exercício de Questionamento Socrático',
        description: 'Desafiar pensamentos automáticos com perguntas',
        instructions: `Quando identificar um pensamento negativo, pergunte-se:
1. Qual é a evidência a FAVOR desse pensamento?
2. Qual é a evidência CONTRA?
3. Existe uma explicação alternativa?
4. Qual é o pior que poderia acontecer? E o melhor?
5. O que eu diria a um amigo nessa situação?`,
        suggestedFrequency: 'Quando necessário',
        targetDisorders: ['depression', 'gad', 'ocd']
    },

    // ==================== RELAXAMENTO ====================
    {
        id: 'respiracao-diafragmatica',
        category: 'relaxamento',
        name: 'Respiração Diafragmática',
        description: 'Técnica de respiração para reduzir ansiedade',
        instructions: `Pratique 2-3 vezes ao dia por 5 minutos:
1. Sente-se confortavelmente ou deite-se
2. Coloque uma mão no peito e outra na barriga
3. Inspire lentamente pelo nariz (4 segundos) - a barriga deve subir
4. Segure a respiração (2 segundos)
5. Expire lentamente pela boca (6 segundos)
6. Repita 10-15 vezes`,
        suggestedFrequency: '2-3x ao dia',
        targetDisorders: ['panic', 'gad', 'social_anxiety']
    },
    {
        id: 'relaxamento-progressivo',
        category: 'relaxamento',
        name: 'Relaxamento Muscular Progressivo',
        description: 'Tensionar e relaxar grupos musculares',
        instructions: `1. Reserve 15-20 minutos em ambiente tranquilo
2. Comece pelos pés: tensione por 5 segundos, relaxe por 10
3. Suba progressivamente: panturrilhas, coxas, glúteos, abdômen, mãos, braços, ombros, pescoço, rosto
4. Note a diferença entre tensão e relaxamento
5. Termine com algumas respirações profundas`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['gad', 'panic', 'insomnia']
    },
    {
        id: 'mindfulness-5min',
        category: 'relaxamento',
        name: 'Meditação Mindfulness (5 min)',
        description: 'Prática breve de atenção plena',
        instructions: `Pratique diariamente:
1. Sente-se confortavelmente e feche os olhos
2. Foque na sua respiração natural
3. Quando a mente divagar, gentilmente volte à respiração
4. Observe pensamentos sem julgamento
5. Pode usar app guiado (Headspace, Calm, Insight Timer)`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['gad', 'depression', 'ocd']
    },

    // ==================== EXPOSIÇÃO ====================
    {
        id: 'hierarquia-exposicao',
        category: 'exposicao',
        name: 'Construir Hierarquia de Exposição',
        description: 'Lista graduada de situações temidas',
        instructions: `1. Liste 10-15 situações relacionadas ao seu medo
2. Dê uma nota de ansiedade para cada (0-100 SUDS)
3. Ordene da menos ansiogênica para a mais
4. Comece praticando exposição pelos itens mais baixos
5. Só avance quando o item atual gerar menos de 30 SUDS`,
        suggestedFrequency: 'Uma vez',
        targetDisorders: ['panic', 'social_anxiety', 'ocd', 'phobia']
    },
    {
        id: 'exposicao-gradual',
        category: 'exposicao',
        name: 'Prática de Exposição Gradual',
        description: 'Enfrentar situação temida de forma controlada',
        instructions: `Escolha um item da sua hierarquia:
1. Planeje como vai se expor à situação
2. Antes: anote seu nível de ansiedade esperado (0-100)
3. Durante: fique NA situação até a ansiedade diminuir naturalmente
4. Depois: anote a ansiedade máxima que sentiu e como diminuiu
5. Repita até que a situação não cause mais medo significativo`,
        suggestedFrequency: '3-5x por semana',
        targetDisorders: ['panic', 'social_anxiety', 'phobia']
    },
    {
        id: 'exposicao-interoceptiva',
        category: 'exposicao',
        name: 'Exposição Interoceptiva',
        description: 'Provocar sensações físicas de ansiedade propositalmente',
        instructions: `Para dessensibilizar medo de sensações corporais:
- Girar na cadeira (tontura)
- Hiperventilar por 30s (falta de ar)
- Correr no lugar (coração acelerado)
- Respirar por um canudo (sufocamento)

Pratique cada exercício até que as sensações não causem mais medo.`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['panic']
    },

    // ==================== ATIVAÇÃO COMPORTAMENTAL ====================
    {
        id: 'agenda-prazer',
        category: 'ativacao_comportamental',
        name: 'Agenda de Atividades Prazerosas',
        description: 'Planejar atividades que trazem prazer ou realização',
        instructions: `1. Liste 10 atividades que costumavam te dar prazer
2. Escolha 1-2 para fazer esta semana
3. Agende um horário específico para cada
4. Faça a atividade MESMO sem vontade
5. Depois, avalie: Prazer (0-10) e Realização (0-10)`,
        suggestedFrequency: 'Semanal',
        targetDisorders: ['depression']
    },
    {
        id: 'ativacao-gradual',
        category: 'ativacao_comportamental',
        name: 'Aumento Gradual de Atividades',
        description: 'Aumentar nível de atividade progressivamente',
        instructions: `Semana 1: Faça 1 atividade pequena por dia (ex: caminhar 10min)
Semana 2: Aumente para 2 atividades
Semana 3: Adicione uma atividade social
Semana 4: Adicione algo novo que nunca fez

Anote como se sentiu antes e depois de cada atividade.`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['depression']
    },
    {
        id: 'monitoramento-humor',
        category: 'ativacao_comportamental',
        name: 'Monitoramento de Atividade-Humor',
        description: 'Registrar relação entre atividades e humor',
        instructions: `Ao longo do dia, anote:
- O que estava fazendo
- Com quem estava
- Nível de humor (1-10)

Ao final da semana, identifique:
- Quais atividades melhoram seu humor?
- Quais pioram?
- Como aumentar as positivas?`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['depression']
    },

    // ==================== HABILIDADES SOCIAIS ====================
    {
        id: 'pratica-assertividade',
        category: 'habilidades_sociais',
        name: 'Prática de Assertividade',
        description: 'Exercitar comunicação assertiva no dia a dia',
        instructions: `Esta semana, pratique:
1. Fazer um pedido direto a alguém
2. Dizer "não" para algo que não quer fazer
3. Expressar uma opinião diferente de forma respeitosa
4. Dar um feedback construtivo
5. Receber um elogio sem minimizar

Anote como foi e como se sentiu.`,
        suggestedFrequency: 'Semanal',
        targetDisorders: ['social_anxiety', 'depression']
    },
    {
        id: 'conversa-casual',
        category: 'habilidades_sociais',
        name: 'Iniciar Conversas Casuais',
        description: 'Praticar small talk em situações cotidianas',
        instructions: `Objetivo: Iniciar ou manter pequenas conversas:
- Com o caixa do mercado
- Com um colega no trabalho
- Com alguém na fila
- Com um vizinho

Comece com comentários simples ("Que dia bonito, né?") e observe as reações.`,
        suggestedFrequency: '1x ao dia',
        targetDisorders: ['social_anxiety']
    },
    {
        id: 'contato-visual',
        category: 'habilidades_sociais',
        name: 'Prática de Contato Visual',
        description: 'Aumentar gradualmente o contato visual',
        instructions: `Progressão:
Semana 1: Mantenha contato visual por 2 segundos ao cumprimentar
Semana 2: Aumente para 3-4 segundos
Semana 3: Pratique olhar nos olhos durante conversas curtas
Semana 4: Mantenha contato visual natural em conversas longas

Lembre-se: é normal olhar brevemente para os lados às vezes.`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['social_anxiety']
    },

    // ==================== ESCRITA TERAPÊUTICA ====================
    {
        id: 'diario-emocional',
        category: 'escrita_terapeutica',
        name: 'Diário Emocional',
        description: 'Escrever livremente sobre sentimentos e experiências do dia',
        instructions: `Reserve 10-15 minutos no final do dia para escrever:
1. Como você se sentiu hoje? (use palavras de emoção)
2. O que aconteceu que influenciou seu humor?
3. O que você aprendeu sobre si mesmo hoje?
4. Escreva sem se preocupar com gramática ou estrutura
5. Seja honesto - ninguém vai ler isso`,
        suggestedFrequency: 'Diário',
        targetDisorders: ['depression', 'gad', 'trauma']
    },
    {
        id: 'carta-terapeutica',
        category: 'escrita_terapeutica',
        name: 'Carta Terapêutica',
        description: 'Escrever uma carta para processar emoções',
        instructions: `Escolha um dos formatos:
1. Carta para si mesmo do passado ou futuro
2. Carta para alguém com quem tem conflito (não precisa enviar)
3. Carta de perdão (a si mesmo ou a outro)
4. Carta de gratidão

Escreva tudo que gostaria de dizer, sem filtro.`,
        suggestedFrequency: 'Quando necessário',
        targetDisorders: ['depression', 'trauma', 'grief']
    },
    {
        id: 'escrita-expressiva',
        category: 'escrita_terapeutica',
        name: 'Escrita Expressiva (Pennebaker)',
        description: 'Técnica de escrita sobre eventos emocionalmente significativos',
        instructions: `Protocolo de 4 dias:
1. Escreva por 15-20 minutos, 4 dias seguidos
2. Escolha um evento/experiência emocionalmente significativo
3. Escreva seus sentimentos e pensamentos mais profundos sobre isso
4. Explore como esse evento afetou sua vida
5. Não se preocupe com gramática - apenas escreva

Pesquisas mostram benefícios significativos para saúde mental e física.`,
        suggestedFrequency: '4 dias consecutivos',
        targetDisorders: ['trauma', 'depression', 'gad']
    }
];

// Função para filtrar templates por categoria
export const getTemplatesByCategory = (category: HomeworkCategory): HomeworkTemplate[] => {
    return HOMEWORK_TEMPLATES.filter(t => t.category === category);
};

// Função para filtrar templates por transtorno
export const getTemplatesByDisorder = (disorder: string): HomeworkTemplate[] => {
    return HOMEWORK_TEMPLATES.filter(t =>
        !t.targetDisorders || t.targetDisorders.includes(disorder)
    );
};

// Função para buscar template por ID
export const getTemplateById = (id: string): HomeworkTemplate | undefined => {
    return HOMEWORK_TEMPLATES.find(t => t.id === id);
};
