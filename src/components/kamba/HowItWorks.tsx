import { UserPlus, Search, Sparkles, Building2, ClipboardList, CheckCircle2 } from "lucide-react";

const volunteerSteps = [
  { icon: UserPlus, title: "Crie o seu perfil", desc: "Registe as suas competências e disponibilidade." },
  { icon: Search, title: "Encontre projetos", desc: "Filtre por província, área e formato remoto/presencial." },
  { icon: Sparkles, title: "Gere impacto", desc: "Contribua com o seu talento e receba certificado." },
];

const ngoSteps = [
  { icon: Building2, title: "Cadastre a ONG", desc: "Envie o Estatuto ou Diário da República para verificação." },
  { icon: ClipboardList, title: "Publique a vaga", desc: "Descreva a necessidade e o resultado esperado." },
  { icon: CheckCircle2, title: "Receba voluntários", desc: "Faça match com talento qualificado em Angola." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[color:var(--surface)] py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">Como funciona</h2>
          <p className="mt-2 text-muted-foreground text-sm">Simples, transparente e feito para a realidade angolana.</p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <StepColumn title="Para Voluntários" accent="var(--brand)" steps={volunteerSteps} />
          <StepColumn title="Para ONGs & Empresas" accent="var(--impact)" steps={ngoSteps} />
        </div>
      </div>
    </section>
  );
}

function StepColumn({ title, accent, steps }: { title: string; accent: string; steps: typeof volunteerSteps }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="font-semibold" style={{ color: accent }}>{title}</h3>
      <ol className="mt-5 space-y-5">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {i + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4" style={{ color: accent }} />
                <p className="font-medium">{s.title}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
