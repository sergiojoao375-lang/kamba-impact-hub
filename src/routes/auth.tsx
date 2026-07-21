import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Logo } from "@/components/kamba/Logo";
import { AuthCard } from "@/components/kamba/AuthCard";

const searchSchema = z.object({
  role: z.enum(["volunteer", "ngo"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Entrar · Kamba Social" },
      { name: "description", content: "Aceda ao Kamba Social com Google, LinkedIn ou telefone (+244) via WhatsApp OTP." },
      { property: "og:title", content: "Entrar · Kamba Social" },
      { property: "og:description", content: "Entre com Google, LinkedIn ou telefone Angola." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role } = Route.useSearch();
  return (
    <div className="min-h-screen bg-[color:var(--surface)] flex flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <Link to="/"><Logo /></Link>
      </div>
      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <AuthCard defaultRole={role} />
      </main>
    </div>
  );
}
