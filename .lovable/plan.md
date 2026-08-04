# PDF real do Certificado (captura fiel do documento)

Hoje o botão "Imprimir / Guardar em PDF" chama `window.print()`, que depende do diálogo do navegador — em telemóvel muitas vezes falha, corta o documento ou imprime a página inteira. E o botão "Descarregar PDF" gera um PDF redesenhado à mão (jsPDF), que não corresponde ao certificado que o utilizador vê no ecrã.

## O que muda

O botão principal passa a exportar um PDF real e fiel ao que está no ecrã:

1. Captura apenas o elemento do certificado (`.print-certificate`), nada da app à volta.
2. Renderiza a captura numa página A4 paisagem, ocupando a folha inteira sem margens nem distorção.
3. Descarrega automaticamente como `certificado-<nome>.pdf`.
4. Funciona igual em telemóvel: a captura é feita numa largura fixa de referência (1123px, A4 landscape a 96dpi) com escala 2x, por isso a qualidade não depende do tamanho do ecrã do utilizador.

Durante a exportação o botão mostra estado "A gerar…" e fica desativado; se algo falhar, aparece um aviso e o utilizador pode tentar de novo.

Os dois botões deixam de ser redundantes: fica **"Guardar em PDF"** (captura fiel, principal) e **"Imprimir"** (window.print, para quem quer papel), removendo a versão jsPDF desenhada à mão que gerava um documento diferente do pré-visualizado.

## Detalhes técnicos

- Adicionar a dependência `html2canvas-pro` (fork mantido que suporta cores `oklch`, usadas em todo o design system deste projeto — o `html2canvas` clássico rebenta com elas).
- Novo `src/lib/certificate-export.ts`: `exportCertificateElement(el, filename)` — clona/renderiza o nó com `scale: 2`, `backgroundColor: '#ffffff'`, `windowWidth: 1123`, e insere a imagem num `jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })` via `addImage` cobrindo 841.89x595.28pt.
- `CertificateModal.tsx`: `useRef` no nó `.print-certificate`; o botão chama o export com estado de loading (`useState`) e `toast` de erro via sonner. Para que a captura não fique reduzida no telemóvel, o wrapper de escala visual é aplicado num contentor pai (transform/scale) e não no nó capturado, que mantém a largura de referência.
- `src/lib/certificate.ts` (jsPDF manual) deixa de ser usado pelo modal; mantido no repositório apenas se outra rota o importar — caso contrário é removido.
- As regras `@media print` em `src/styles.css` mantêm-se para o botão "Imprimir".
- Build verificada no fim.
