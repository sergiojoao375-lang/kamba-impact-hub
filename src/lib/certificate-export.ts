import { jsPDF } from "jspdf";

const A4_W_PT = 841.89; // A4 landscape width in pt
const A4_H_PT = 595.28;
const REF_WIDTH = 1123; // A4 landscape @96dpi

export async function exportCertificateElement(el: HTMLElement, filename: string) {
  const { default: html2canvas } = await import("html2canvas-pro");

  const rect = el.getBoundingClientRect();
  // Escala relativa à largura de referência para qualidade igual em qualquer ecrã
  const scale = Math.min(4, Math.max(2, (REF_WIDTH / Math.max(rect.width, 1)) * 2));

  const canvas = await html2canvas(el, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: REF_WIDTH,
  });

  const img = canvas.toDataURL("image/jpeg", 0.95);
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Preserva o rácio, centrando na folha A4
  const ratio = canvas.width / canvas.height;
  let w = A4_W_PT;
  let h = w / ratio;
  if (h > A4_H_PT) {
    h = A4_H_PT;
    w = h * ratio;
  }
  doc.addImage(img, "JPEG", (A4_W_PT - w) / 2, (A4_H_PT - h) / 2, w, h);
  doc.save(filename);
}
