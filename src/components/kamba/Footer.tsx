import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t bg-[color:var(--surface)] mt-16">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            Plataforma angolana de voluntariado de competências (Pro Bono), conectando talento a impacto social.
          </p>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Plataforma</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li>Voluntários</li>
            <li>ONGs & Empresas</li>
            <li>Projetos ativos</li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="font-semibold mb-3">Conformidade legal</h4>
          <p className="text-muted-foreground leading-relaxed">
            Em conformidade com a <strong className="text-foreground">Lei do Voluntariado de Angola — Lei n.º 17/21</strong>, que regula o exercício da atividade voluntária em território nacional.
          </p>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>© {new Date().getFullYear()} Kamba Social — Luanda, Angola</span>
          <span>Feito com propósito 🇦🇴</span>
        </div>
      </div>
    </footer>
  );
}
