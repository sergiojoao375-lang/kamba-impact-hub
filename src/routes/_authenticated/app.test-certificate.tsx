import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/kamba/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateModal, type CertificateData } from "@/components/kamba/CertificateModal";
import { Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/test-certificate")({
  head: () => ({
    meta: [
      { title: "Pré-visualização do Certificado · Kamba Social" },
      { name: "description", content: "Pré-visualização do Certificado Digital de Competências emitido ao abrigo da Lei n.º 17/21 de Angola." },
      { property: "og:title", content: "Pré-visualização do Certificado · Kamba Social" },
      { property: "og:description", content: "Veja o layout institucional do certificado, com QR code de verificação e assinatura digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestCertificate,
});

const DEMO_CERT: CertificateData = {
  volunteerName: "Mário António",
  projectTitle: "Redesenho da Identidade Visual Institucional",
  ngoName: "Associação Kubuka",
  hours: 40,
  skills: ["Design Gráfico", "Comunicação Visual"],
  issuedAt: new Date(),
  referenceId: "KS-DEMO2026",
};

function TestCertificate() {
  const [open, setOpen] = useState(true);

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Pré-visualização do Certificado</h1>
          <p className="text-sm text-muted-foreground">
            Rota temporária de testes com dados fictícios para validar o layout institucional.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <p><span className="text-muted-foreground">Voluntário:</span> <strong>Mário António</strong></p>
            <p><span className="text-muted-foreground">Horas:</span> <strong>40 horas</strong></p>
            <p><span className="text-muted-foreground">Competência:</span> <strong>Design Gráfico</strong></p>
            <p><span className="text-muted-foreground">ONG:</span> <strong>Associação Kubuka</strong></p>
            <Button onClick={() => setOpen(true)} className="bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
              <Award className="h-4 w-4 mr-2" /> Abrir certificado
            </Button>
          </CardContent>
        </Card>

        <CertificateModal open={open} onOpenChange={setOpen} data={DEMO_CERT} />
      </div>
    </AppShell>
  );
}
