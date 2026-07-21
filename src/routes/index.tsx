import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/kamba/Header";
import { Footer } from "@/components/kamba/Footer";
import { Hero } from "@/components/kamba/Hero";
import { ImpactStats } from "@/components/kamba/ImpactStats";
import { HowItWorks } from "@/components/kamba/HowItWorks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kamba Social — Voluntariado Pro Bono em Angola" },
      { name: "description", content: "Ligamos profissionais e estudantes a ONGs e projetos locais em Angola. Transforme o seu talento em impacto real, em conformidade com a Lei n.º 17/21." },
      { property: "og:title", content: "Kamba Social — Voluntariado Pro Bono em Angola" },
      { property: "og:description", content: "Plataforma angolana que conecta talento a ONGs através de voluntariado de competências." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <ImpactStats />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
