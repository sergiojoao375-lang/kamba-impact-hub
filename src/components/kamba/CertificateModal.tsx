import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportCertificateElement } from "@/lib/certificate-export";


export type CertificateData = {
  volunteerName: string;
  projectTitle: string;
  ngoName: string;
  hours: number;
  skills?: string[];
  issuedAt?: Date;
  referenceId?: string;
};

function refCode(d: CertificateData) {
  if (d.referenceId) return d.referenceId;
  const base = `${d.volunteerName}${d.projectTitle}${d.hours}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `KS-${String(h).slice(0, 8).padStart(8, "0")}`;
}

export function CertificateModal({
  open,
  onOpenChange,
  data,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: CertificateData | null;
}) {
  if (!data) return null;
  const issued = data.issuedAt ?? new Date();
  const dt = issued.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  const competencia = data.skills?.length ? data.skills.slice(0, 4).join(" · ") : "Voluntariado de competências";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-y-auto max-h-[92vh] print:max-w-none print:border-0 print:shadow-none">
        <DialogTitle className="sr-only">Certificado Digital de Competências</DialogTitle>
        <DialogDescription className="sr-only">
          Certificado de voluntariado pro bono emitido pelo Kamba Social.
        </DialogDescription>

        <div className="p-4 md:p-6 print-certificate-wrap">
          <div className="print-certificate mx-auto w-full aspect-[1.414/1] bg-card text-foreground relative">
            {/* Moldura dupla */}
            <div className="absolute inset-[1.5%] border-[3px] border-[color:var(--brand)]" />
            <div className="absolute inset-[3%] border border-[color:var(--impact)]/50" />

            <div className="relative h-full w-full flex flex-col items-center text-center px-[8%] py-[5%]">
              {/* Cabeçalho */}
              <div className="flex items-center gap-2">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
                  <circle cx="16" cy="16" r="15" fill="var(--brand)" />
                  <path d="M10 22V10h3v5l4-5h3.5l-4.5 5.5L21 22h-3.7l-4.3-5.2V22H10z" fill="var(--brand-foreground)" />
                  <circle cx="24" cy="9" r="3" fill="var(--impact)" />
                </svg>
                <span className="font-bold tracking-tight text-[clamp(0.8rem,1.4vw,1.05rem)]">
                  Kamba<span className="text-[color:var(--impact)]">Social</span>
                </span>
              </div>
              <p className="mt-1 text-[clamp(0.5rem,0.85vw,0.7rem)] uppercase tracking-[0.28em] text-muted-foreground">
                República de Angola · Voluntariado Pro Bono
              </p>

              <h2 className="mt-[3%] font-semibold tracking-tight text-[clamp(1.3rem,3.4vw,2.6rem)] text-[color:var(--brand)]">
                Certificado de Competências
              </h2>
              <div className="mt-2 h-px w-[38%] bg-[color:var(--impact)]" />

              <p className="mt-[3%] text-[clamp(0.6rem,1vw,0.85rem)] text-muted-foreground">Certificamos que</p>
              <p className="mt-1 font-bold text-[clamp(1.1rem,2.6vw,2rem)]">{data.volunteerName}</p>

              <p className="mt-[2.5%] max-w-[85%] text-[clamp(0.6rem,1.05vw,0.9rem)] leading-relaxed text-muted-foreground">
                dedicou <span className="font-semibold text-foreground">{data.hours} hora(s)</span> de voluntariado pro
                bono, aplicando as competências de{" "}
                <span className="font-semibold text-foreground">{competencia}</span>, no projeto{" "}
                <span className="font-semibold text-foreground">“{data.projectTitle}”</span>, em parceria com a
                organização <span className="font-semibold text-foreground">{data.ngoName}</span>.
              </p>

              <div className="mt-auto w-full">
                <div className="flex items-end justify-center">
                  <div className="w-[46%]">
                    <div className="h-px w-full bg-border" />
                    <p className="mt-1 text-[clamp(0.5rem,0.85vw,0.72rem)] font-medium">Kamba Social</p>
                    <p className="text-[clamp(0.45rem,0.75vw,0.65rem)] text-muted-foreground">
                      Plataforma de Voluntariado de Competências
                    </p>
                  </div>
                </div>

                <div className="mt-[3%] flex items-center justify-between text-[clamp(0.45rem,0.72vw,0.62rem)] text-muted-foreground">
                  <span>Ref. {refCode(data)}</span>
                  <span>Emitido em {dt} · Luanda, Angola</span>
                </div>

                <p className="mt-2 rounded-sm bg-[color:var(--accent)] px-3 py-1.5 text-[clamp(0.5rem,0.85vw,0.72rem)] font-semibold text-[color:var(--accent-foreground)]">
                  Certificado emitido em conformidade com a Lei n.º 17/21 de Angola
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3 print:hidden">
          <Button variant="outline" onClick={() => generateCertificate(data)}>
            <Download className="h-4 w-4 mr-1.5" /> Descarregar PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" /> Imprimir / Guardar em PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
