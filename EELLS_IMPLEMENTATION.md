# Documentação: Modelo Eells - Implementação

## Visão Geral

Este documento descreve as implementações realizadas para alinhar o sistema com o **Modelo Eells de Formulação de Caso**, conforme o livro "Psychotherapy Case Formulation" de Tracy Eells.

---

## Etapa 1: Coleta (Assessment)

### Arquivos Modificados
- `client/src/types/eells.ts`
- `client/src/lib/eells-utils.ts`
- `client/src/components/AnamnesisForm.tsx`
- `client/src/components/ExternalSourcesPanel.tsx` *(novo)*
- `client/src/components/AssessmentScheduleCard.tsx` *(novo)*

### Tipos Adicionados

```typescript
// Fontes Externas
interface ExternalSource {
    id: string;
    type: 'prontuario' | 'familiar' | 'laudo' | 'exame' | 'escola' | 'outro';
    who: string;           // "Dr. João (psiquiatra)"
    date: string;          // ISO: YYYY-MM-DD
    summary: string;
    consent: boolean;
    reliability: 'alta' | 'media' | 'baixa';
    status: 'nao_aplicavel' | 'solicitado' | 'recebido' | 'revisado';
}

// Cronograma MBC
interface AssessmentSchedule {
    core: { instruments: string[]; frequency: AssessmentFrequency };
    complementary?: { instruments: string[]; frequency: AssessmentFrequency };
    tracking?: Record<string, { lastCompletedDate?: string; nextDueDate?: string }>;
}
```

### Cálculo de Progresso
| Critério | Peso |
|----------|------|
| Anamnese preenchida | 30% |
| Fontes externas (ou N/A) | 20% |
| Avaliação inicial | 30% |
| Cronograma definido (ou N/A) | 20% |

---

## Etapa 2: Problemas (Problem List)

### Arquivos Modificados
- `client/src/types/eells.ts`
- `client/src/lib/eells-utils.ts`
- `client/src/components/ProblemListCard.tsx` *(reescrito)*

### Tipos Adicionados/Expandidos

```typescript
type ProblemDomain = 'trabalho' | 'relacionamento' | 'familia' | 'saude' | 'estudo' | 'financeiro' | 'social' | 'outro';

interface Problem {
    // Novos campos
    priorityRank?: number;       // 1, 2, 3...
    isFocus?: boolean;           // Alvo atual do tratamento
    domains: ProblemDomain[];    // Onde afeta
    functionalImpact: number;    // 0-10
    triggerContext?: string;     // Quando/onde piora
    
    // Campos existentes mantidos
    problem: string;
    frequency: string;
    severity: number;
    status: 'active' | 'resolved' | 'improved';
}

interface SharedUnderstanding {
    reviewed: boolean;
    agreement: 'sim' | 'parcial' | 'nao';
    notes?: string;
    lastReviewedAt?: string;
}

interface ProblemListAgreement {
    sharedUnderstanding: SharedUnderstanding;
    priorityProblems: string[];
    lastUpdated: string;
}
```

### Cálculo de Progresso
| Critério | Peso |
|----------|------|
| Ter problemas identificados | 40% |
| Ter prioridades definidas | 30% |
| Acordo terapeuta-cliente revisado | 30% |

### UI Implementada
- Formulário com domínios, prioridade, impacto, gatilhos
- Botão 🎯 para marcar alvo atual
- Painel expansível de acordo terapeuta-cliente
- Ordenação automática por prioridade/foco
- **Alerta visual de ranks duplicados**

### Ajustes Finos (v1.1)
| Ajuste | Implementação |
|--------|---------------|
| `domains` opcional | Não obriga seleção, evita atrito |
| `functionalImpact` opcional | Não bloqueia salvar se vazio |
| Clamp 0-10 | Valores de severity/impact sempre válidos |
| `updatedAt` | Rastreia edições em ISO |
| Prioridades coerentes | Sem duplicatas + foco obrigatório para 30% |
| Alerta de duplicatas | Badge visual "⚠️ Ranks duplicados" |

---

## Próximas Etapas (Status)

| Etapa | Status | Descrição |
|-------|--------|-----------|
| 1. Coleta | ✅ | Fontes externas, cronograma MBC por instrumento |
| 2. Problemas | ✅ | Prioridades, domínios, acordo |
| 3. Mecanismos | ✅ | 4 quadrantes, processos, evidências |
| 4. Formulação | ✅ | Narrativa, diagnóstico N/A, **versionamento anti-spam** |
| 5. Tratamento | ✅ | GAS/SMART, **versionamento com motivo obrigatório** |
| 6. Monitoramento | 🔧 | **Tipos criados** - UI de alertas próximo passo |
| 7. Alta | ⏳ | Critérios + plano de prevenção |

---

## Etapa 6: Plano de Implementação

### Tipos já criados (27/12/2024):
- `InstrumentRecord` - Registro de aplicação (entidade própria)
- `ScheduledInstrumentStatus` - Status de alerta por instrumento
- `SessionInstrumentChecklist` - Lista "Aplicar hoje"
- `DecisionLog` - Log de decisão clínica
- `TemporalComparison` - Comparativo temporal
- `MonitoringData` - Container no EellsData

### Funções criadas em `monitoring-utils.ts`:
- `calculateNextDueDate()` - Calcula vencimento
- `calculateAlertStatus()` - Retorna status de alerta
- `generateSessionChecklist()` - Gera checklist da sessão
- `calculateTemporalComparison()` - Tendência com média móvel

### Implementado (28/12/2024):

1. ✅ **AlertCard no dashboard**
   - Lista vencidos e vence_em_breve
   - Badge de status, último aplicado, próximo vencimento
   - Botão "Aplicar" com modal de registro

2. ✅ **Ação "Adiar"**
   - Modal com motivo curto
   - Opções: 3, 7, 14, 30 dias

3. ✅ **SessionChecklist na sessão**
   - Lista de pendentes ao abrir sessão
   - Instrumentos opcionais ("quando indicado")
   - Estado de aplicados

4. ✅ **ProgressChart (Gráficos)**
   - Gráfico de área com evolução por instrumento
   - Seletor de instrumento
   - Tendência (melhorando/piorando/estável)
   - Faixas de severidade
   - Estatísticas: score atual, anterior, variação, média móvel

5. ✅ **DecisionLogCard (Decisões Clínicas)**
   - Seleção de instrumentos base (últimos 30 dias)
   - Interpretação dos dados
   - Decisão clínica + motivo/racional
   - Resultado esperado (outcome)
   - Follow-up programado (2, 4, 6, 8 semanas)
   - Badge de "Revisão pendente" quando passar a data

### Etapa 6 Completa! 🎉

### Critério de sucesso MVP:
> Bater o olho e saber "o que está vencido" sem pensar. ✅

---

## Referência

Baseado em: **Eells, T. D. (2022). Psychotherapy Case Formulation. American Psychological Association.**

