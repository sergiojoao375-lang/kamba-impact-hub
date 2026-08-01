## Objetivo

1. O Painel da ONG (`/app/ngo`) nunca mais ficar preso em "A carregar…".
2. O Painel Admin (`/app/admin`) passar a ser uma tabela de gestão completa, com NIF, ação de aprovar/rejeitar, gatilho WhatsApp e um log visual das chamadas ao backend.

## Estado atual verificado

- `src/routes/_authenticated/app.ngo.tsx`: `load()` faz `return` cedo quando não há sessão e só faz `setLoading(false)` no fim — sem sessão ou com a DB indisponível, fica em "A carregar…" para sempre. Não há timeout nem dados de segurança.
- `src/routes/_authenticated/app.admin.tsx`: hoje mostra cartões (pendentes + histórico), não tabela; sem NIF; sem log de requisições.
- Tabela `ngos` tem: `name`, `area_atuacao`, `provincia`, `document_url`, `description`, `status`, `created_by`. **Não tem coluna NIF nem telefone da ONG.**

## 1. Fallback no Painel da ONG

- Envolver `load()` em `try/finally` com `setLoading(false)` garantido, mais um timeout de ~4 s.
- Se a sessão/DB falhar ou demorar, entrar em **modo demonstração**: ONG fictícia ("Associação Kubuka", status `aprovado`), 2 vagas e 3 candidaturas fictícias.
- Faixa discreta no topo: "Modo demonstração — dados fictícios (backend indisponível)" com botão "Tentar novamente".
- Nesse modo, aprovar/recusar altera apenas o estado local (sem escrita na DB), mantendo o fluxo testável no Preview.

## 2. Migração de base de dados

Adicionar à tabela `ngos`:
- `nif` (texto, opcional)
- `phone` (texto, opcional) — necessário para o alerta WhatsApp de aprovação da ONG

O formulário de cadastro de ONG (`NgoOnboarding.tsx`) passa a recolher NIF e telefone (+244).

## 3. Painel Admin reconstruído

- Tabela com colunas: **Nome da ONG · NIF · Província · Status** · Documento · Ações.
- Botão "Ver Diário da República" abre o PDF em nova aba; quando não há documento, abre um diálogo de pré-visualização simulada.
- Ações rápidas "Aprovar" / "Rejeitar" em cada linha, com estado de carregamento por linha.
- Filtro por status (Todas / Pendentes / Aprovadas / Rejeitadas) e contadores no topo.
- Fallback igual ao da ONG: se a DB falhar, tabela com ONGs fictícias e faixa de modo demonstração.

## 4. Lógica de backend + logs

- Função `approveNgo(id)` / `rejectNgo(id)` centralizada em `src/lib/admin.ts`:
  1. atualiza `ngos.status`,
  2. cria notificação interna para o criador da ONG,
  3. dispara o gatilho WhatsApp da Fase 4 (novo `notifyNgoApproved` em `src/lib/whatsapp.ts`, mesmo padrão simulado com comentários da Cloud API da Meta),
  4. devolve entradas de log estruturadas.
- Novo componente `src/components/kamba/BackendLog.tsx`: consola visual no fundo do painel Admin, mostrando cada requisição (`UPDATE ngos SET status=...`, `INSERT notifications`, `WHATSAPP send template=ngo_approved`) com hora, duração em ms e resultado OK/ERRO. Botão para limpar.

## Detalhes técnicos

- Sem Edge Functions: escritas via cliente Supabase do browser sob as políticas RLS já existentes (`Admins can update any NGO`), conforme a arquitetura atual do projeto.
- WhatsApp continua simulado (`console.info` + toast em dev), como na Fase 4.
- O GitHub é sincronizado automaticamente pela integração Lovable ↔ GitHub; não é preciso passo manual.
