import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/kamba/Header";
import { Footer } from "@/components/kamba/Footer";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/verify/$ref")({
  head: () => ({
    meta: [
      { title: "Verificação de Certificado · Kamba Social" },
      { name: "description", content: "Valide a autenticidade de um certificado de voluntariado pro bono emitido pelo Kamba Social." },
      { property: "og:title", content: "Verificação de Certificado · Kamba Social" },
      { property: "og:description", content: "Confirme horas, competências e organização de um certificado Kamba Social." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerifyCertificate,
});

function VerifyCertificate() {
  const { ref } = Route.useParams();
  const q = Route.useSearch() as Record<string, string | undefined>;
  const name = q.n;
  const hours = q.h;
  const ngo = q.o;
  const project = q.p;
  const date = q.d;
  const skills = q.s?.split(",").filter(Boolean) ?? [];
  const valid = Boolean(name && hours && project);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-12">
        <div className="rounded-xl border bg-card p-6 md:p-8">
          {valid ? (
            <>
              <div className="flex items-center gap-2 text-[color:var(--impact)]">
                <BadgeCheck className="h-6 w-6" />
                <span className="font-semibold">Certificado válido</span>
              </div>
              <h1 className="mt-4 text-2xl font-semibold">{name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hours} hora(s) de voluntariado pro bono no projeto “{project}”
                {ngo ? ` em parceria com ${ngo}` : ""}.
              </p>

              {skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Referência</dt>
                  <dd className="font-medium">{ref}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Emissão</dt>
                  <dd className="font-medium">{date ?? "—"}</dd>
                </div>
              </dl>

              <p className="mt-6 rounded-md bg-[color:var(--accent)] px-3 py-2 text-xs font-medium text-[color:var(--accent-foreground)]">
                Certificado emitido em conformidade com a Lei n.º 17/21 de Angola.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="h-6 w-6" />
                <span className="font-semibold">Não foi possível validar</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                A referência <span className="font-medium text-foreground">{ref}</span> não contém dados suficientes.
                Digitalize novamente o QR code impresso no certificado.
              </p>
            </>
          )}

          <div className="mt-6">
            <Link to="/" className="text-sm text-[color:var(--brand)] underline">
              Voltar ao Kamba Social
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
