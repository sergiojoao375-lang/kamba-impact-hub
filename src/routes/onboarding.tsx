import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Logo } from "@/components/kamba/Logo";
import { VolunteerOnboarding } from "@/components/kamba/VolunteerOnboarding";
import { NgoOnboarding } from "@/components/kamba/NgoOnboarding";
import { HeartHandshake, Building2 } from "lucide-react";

const searchSchema = z.object({
  role: z.enum(["volunteer", "ngo"]).default("volunteer"),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Onboarding · Kamba Social" },
      { name: "description", content: "Complete o seu perfil de voluntário ou ONG no Kamba Social." },
      { property: "og:title", content: "Onboarding · Kamba Social" },
      { property: "og:description", content: "Configure seu perfil pro bono ou de organização." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-4 h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <span className="text-xs text-muted-foreground">Passo 2 de 2</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vamos configurar o seu perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha o tipo de conta e preencha os dados. Pode alterar depois.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto">
          <RoleTab
            active={role === "volunteer"}
            onClick={() => navigate({ to: "/onboarding", search: { role: "volunteer" } })}
            icon={<HeartHandshake className="h-4 w-4" />}
            label="Voluntário"
          />
          <RoleTab
            active={role === "ngo"}
            onClick={() => navigate({ to: "/onboarding", search: { role: "ngo" } })}
            icon={<Building2 className="h-4 w-4" />}
            label="ONG / Empresa"
          />
        </div>

        <div className="mt-8 rounded-2xl border bg-white p-6 md:p-8 shadow-sm">
          {role === "volunteer" ? <VolunteerOnboarding /> : <NgoOnboarding />}
        </div>
      </main>
    </div>
  );
}

function RoleTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand)]"
          : "bg-white hover:border-[color:var(--brand)]/50"
      }`}
    >
      {icon} {label}
    </button>
  );
}
