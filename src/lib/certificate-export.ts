import { jsPDF } from "jspdf";

const A4_W_PT = 841.89; // A4 landscape width in pt
const A4_H_PT = 595.28;
const REF_WIDTH = 1123; // A4 landscape @96dpi

export async function exportCertificateElement(el: HTMLElement, filename: string) {
  const { default: html2canvas } = await import("html2canvas-pro");

  const REF_HEIGHT = Math.round(REF_WIDTH / 1.414);

  const canvas = await html2canvas(el, {
    scale: 2,
    width: REF_WIDTH,
    height: REF_HEIGHT,
    windowWidth: REF_WIDTH,
    windowHeight: REF_HEIGHT,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    onclone: (_doc, node) => {
      const n = node as HTMLElement;
      n.style.width = `${REF_WIDTH}px`;
      n.style.height = `${REF_HEIGHT}px`;
      n.style.maxWidth = "none";
      n.style.margin = "0";
    },
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
