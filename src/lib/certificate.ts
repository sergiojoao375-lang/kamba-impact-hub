import { jsPDF } from "jspdf";

export type CertificateInput = {
  volunteerName: string;
  projectTitle: string;
  ngoName: string;
  hours: number;
  skills?: string[];
  issuedAt?: Date;
};

export function generateCertificate({ volunteerName, projectTitle, ngoName, hours, skills, issuedAt = new Date() }: CertificateInput) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Border
  doc.setDrawColor(30, 90, 168);
  doc.setLineWidth(6);
  doc.rect(24, 24, w - 48, h - 48);
  doc.setLineWidth(1);
  doc.rect(36, 36, w - 72, h - 72);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 90, 168);
  doc.setFontSize(14);
  doc.text("KAMBA SOCIAL · ANGOLA", w / 2, 90, { align: "center" });

  doc.setFontSize(36);
  doc.setTextColor(20, 20, 20);
  doc.text("Certificado de Voluntariado", w / 2, 150, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Certificamos que", w / 2, 200, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(34, 160, 107);
  doc.text(volunteerName, w / 2, 245, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  const line = `concluiu ${hours} hora(s) de voluntariado pro bono no projeto`;
  doc.text(line, w / 2, 285, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(`"${projectTitle}"`, w / 2, 320, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  if (skills?.length) {
    doc.text(`Competências aplicadas: ${skills.slice(0, 4).join(" · ")}`, w / 2, 348, { align: "center" });
    doc.text(`em parceria com ${ngoName}, em conformidade com a Lei n.º 17/21.`, w / 2, 372, { align: "center" });
  } else {
    doc.text(`em parceria com ${ngoName}, em conformidade com a Lei n.º 17/21.`, w / 2, 350, { align: "center" });
  }

  const dt = issuedAt.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(11);
  doc.text(`Emitido em ${dt} · Luanda, Angola`, w / 2, h - 90, { align: "center" });

  doc.setDrawColor(150);
  doc.line(w / 2 - 120, h - 70, w / 2 + 120, h - 70);
  doc.setFont("helvetica", "italic");
  doc.text("Kamba Social — Plataforma de Voluntariado de Competências", w / 2, h - 55, { align: "center" });

  doc.save(`certificado-${volunteerName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
