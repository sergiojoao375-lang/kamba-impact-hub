# Finalização do backend Kamba Social

Nota de leitura do código atual: a tabela de organizações no banco chama-se `ngos`, com as colunas `status` (pendente/aprovado/rejeitado) e `document_url` — não existe `organizations`/`status_verificacao`/`diario_republica_url`. Vou usar as colunas reais. Também não existe hoje nenhuma tabela de empresas parceiras nem storage bucket; o Portal ESG usa números fixos no ficheiro.

## 1. Valor Pro Bono Equivalente

- Nova tabela `project_impact`: projeto, ONG, empresa parceira (opcional), total de horas, valor calculado em Kz, data de fecho.
- Tabela `companies` mínima (nome, criador) + coluna opcional em `profiles` para vincular o voluntário à empresa parceira, permitindo agregar por empresa.
- Tabela de referência de valor/hora por competência com os valores pedidos: Design 5.000, Contabilidade 7.000, Programação 10.000, Marketing 6.000 Kz/h (e um valor padrão para as restantes).
- Server function `finalizeProject`: soma `tasks.hours_logged` do projeto, multiplica pela taxa da competência principal do projeto, grava em `project_impact` e marca o projeto como `concluido`.
- Botão "Concluir projeto" na Sala do Projeto (visível ao dono da ONG) que chama essa função.
- `/app/esg` passa a ler os KPIs reais agregados de `project_impact` (Valor Pro Bono, Total de Horas, Funcionários Ativos), mantendo o fallback demo quando não houver dados.

## 2. Trava de segurança para ONGs pendentes

- No Painel da ONG: se `status !== 'aprovado'`, o botão "Publicar Nova Vaga" fica desativado e aparece um aviso de bloqueio explicando que a verificação está pendente; o envio é impedido antes de qualquer escrita.
- Reforço no banco: policy de inserção em `projects` passa a exigir que a ONG vinculada esteja com `status = 'aprovado'`, garantindo que o feed nunca receba vagas de organizações não verificadas mesmo fora da UI.

## 3. Upload real do Diário da República

- Criar bucket privado `diarios_republica` com políticas: a ONG carrega/lê os próprios ficheiros; admins leem todos.
- No onboarding da ONG, o formulário passa a gravar de verdade: cria o registo em `ngos` (nome, NIF, telefone, área, província), envia o ficheiro para o bucket em `{user_id}/{ngo_id}.pdf` e guarda o caminho em `document_url`.
- No Painel Admin, o botão "Ver Diário da República" gera um link assinado temporário para abrir o documento real (mantendo o PDF simulado quando não houver ficheiro).

## 4. Rota de teste do certificado

- Nova rota `/app/test-certificate` que abre o `CertificateModal` imediatamente com: Mário António, 40 horas, Design Gráfico, Associação Kubuka — com moldura, assinaturas, QR Code e o texto da Lei n.º 17/21.
- Link "Certificado (teste)" adicionado ao menu do AppShell para acesso rápido no preview.

## Notas técnicas

- Toda a lógica de escrita sensível (cálculo de impacto, finalização de projeto) fica em `createServerFn` com middleware de autenticação; a UI apenas invoca.
- Migrações incluem GRANTs e RLS para cada tabela nova.
- O commit é feito automaticamente pela sincronização do GitHub já ligada ao projeto; a Vercel aplica o deploy a seguir.
