import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, HeartHandshake, Building2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[color:var(--surface)] via-background to-white" />
      <div className="absolute -top-24 -right-24 -z-10 h-96 w-96 rounded-full bg-[color:var(--brand)]/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 -z-10 h-96 w-96 rounded-full bg-[color:var(--impact)]/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-[color:var(--brand)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--impact)]" />
            Voluntariado Pro Bono em Angola
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Transforme o seu talento em <span className="text-[color:var(--brand)]">impacto real</span> em Angola
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl">
            Ligamos profissionais e estudantes qualificados a ONGs e projetos locais que precisam de competências — design, contabilidade, programação, marketing e gestão.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/auth" search={{ role: "volunteer" }}>
              <Button size="lg" className="w-full sm:w-auto bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
                <HeartHandshake className="mr-2 h-4 w-4" /> Quero ser voluntário
              </Button>
            </Link>
            <Link to="/auth" search={{ role: "ngo" }}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-[color:var(--impact)] text-[color:var(--impact)] hover:bg-[color:var(--impact)]/10">
                <Building2 className="mr-2 h-4 w-4" /> Cadastrar ONG / Empresa
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Grátis para ONGs • Conforme a Lei n.º 17/21 <ArrowRight className="inline h-3 w-3" />
          </p>
        </div>

        <div className="relative">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projeto ativo em Luanda</p>
                <h3 className="font-semibold mt-1">Contabilidade para ONG Kubuka</h3>
              </div>
              <span className="rounded-full bg-[color:var(--impact)]/15 text-[color:var(--impact)] text-xs px-2 py-1 font-medium">
                Urgente
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <Stat label="Horas" value="20h" />
              <Stat label="Duração" value="1 mês" />
              <Stat label="Formato" value="Remoto" />
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-2/3 bg-[color:var(--brand)]" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">4 de 6 voluntários confirmados</p>
          </div>

          <div className="absolute -bottom-4 -left-4 hidden md:block rounded-xl border bg-white p-3 shadow-sm">
            <p className="text-xs text-muted-foreground">Novo match</p>
            <p className="text-sm font-medium">+3 voluntários hoje</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[color:var(--surface)] py-2">
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
