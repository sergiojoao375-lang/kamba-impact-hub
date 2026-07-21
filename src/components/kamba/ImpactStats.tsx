import { Clock, Users, TrendingUp } from "lucide-react";

const stats = [
  { icon: Clock, label: "Horas pro bono doadas", value: "12.480h", color: "var(--brand)" },
  { icon: Users, label: "ONGs apoiadas", value: "87", color: "var(--impact)" },
  { icon: TrendingUp, label: "Valor pro bono equivalente", value: "Kz 156M", color: "var(--brand)" },
];

export function ImpactStats() {
  return (
    <section id="impacto" className="mx-auto max-w-6xl px-4 py-14">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold">O impacto que estamos criando juntos</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Números simulados — em breve conectados a dados reais da nossa base.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border bg-white p-6 hover:shadow-sm transition">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2" style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
