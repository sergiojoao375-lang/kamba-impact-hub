# Certificado Digital de Competências — visual de alta fidelidade

Hoje o certificado é gerado direto em PDF (jsPDF) sem pré-visualização. A ideia é ter um documento oficial visível no ecrã, com opção de imprimir/guardar em PDF pelo navegador.

## O que será criado

**Novo componente `CertificateModal`** (`src/components/kamba/CertificateModal.tsx`)
- Abre a partir do botão "Certificado" no perfil público do voluntário.
- Renderiza o certificado em formato A4 paisagem, escalado para caber no ecrã (mobile inclusive).

**Composição do documento**
- Fundo claro elegante com moldura dupla fina (azul social + linha interna).
- Cabeçalho: logótipo Kamba Social + "República de Angola · Voluntariado Pro Bono".
- Título destacado: "Certificado de Competências".
- Corpo: nome do voluntário em destaque, horas doadas, competência técnica aplicada, nome da ONG apoiada e título do projeto.
- Linha de assinatura com traço e legenda "Kamba Social — Plataforma de Voluntariado de Competências".
- Data de emissão e um código de referência do certificado.
- Rodapé em destaque: "Certificado emitido em conformidade com a Lei n.º 17/21 de Angola".

**Botões**
- "Imprimir / Guardar em PDF": usa `window.print()` com estilos `@media print` que isolam só o certificado (A4 landscape, sem cabeçalho da app).
- Mantém-se também o download direto via jsPDF como alternativa.

## Alterações nos ficheiros existentes

- `src/routes/volunteer.$userId.tsx`: o botão "Certificado" passa a abrir o modal em vez de descarregar imediatamente; passa nome, horas, competências, ONG e projeto.
- `src/styles.css`: regras `@media print` (esconder tudo exceto `.print-certificate`, definir `@page { size: A4 landscape; margin: 0 }`) e tokens de cor do documento.
- `src/lib/certificate.ts`: mantido para o download jsPDF, ajustado para incluir a competência técnica.

## Notas técnicas

- Sem imagens pesadas: apenas SVG e cores sólidas, coerente com a estratégia mobile-first para ligações lentas.
- Cores via tokens semânticos do design system, sem classes hardcoded.
- Build verificada após as alterações para garantir que o repositório compila sem erros.
