import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/kamba/Header";
import { Footer } from "@/components/kamba/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Download, ExternalLink, MapPin } from "lucide-react";
import { CertificateModal, type CertificateData } from "@/components/kamba/CertificateModal";

export const Route = createFileRoute("/volunteer/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil de Voluntário · Kamba Social" },
      { name: "description", content: "Perfil público de voluntariado pro bono em Angola." },
      { property: "og:title", content: "Perfil de Voluntário · Kamba Social" },
      { property: "og:description", content: "Projetos de impacto e certificado de horas pro bono." },
    ],
  }),
  component: VolunteerProfile,
});

type Profile = { id: string; full_name: string | null; provincia: string | null; biografia: string | null; portfolio_url: string | null; skills: string[] | null };
type Completed = { project_id: string; project_title: string; ngo_name: string; hours: number };

function VolunteerProfile() {
  const { userId } = Route.useParams();
  const [p, setP] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Completed[]>([]);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertificateData | null>(null);

  useEffect(() => {
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("id,full_name,provincia,biografia,portfolio_url,skills").eq("id", userId).maybeSingle();
      setP(prof as Profile | null);

      // Approved applications → completed projects with hours summed from concluido tasks
      const { data: apps } = await supabase
        .from("applications")
        .select("project_id, project:projects(id,title,ngo:ngos(name))")
        .eq("volunteer_id", userId)
        .eq("status", "aprovado");

      const rows: Completed[] = [];
      for (const a of apps ?? []) {
        const proj = (a as any).project;
        if (!proj) continue;
        const { data: tasks } = await supabase.from("tasks").select("hours_logged").eq("project_id", proj.id).eq("column_name", "concluido");
        const hours = (tasks ?? []).reduce((s, t: any) => s + Number(t.hours_logged ?? 0), 0);
        rows.push({ project_id: proj.id, project_title: proj.title, ngo_name: proj.ngo?.name ?? "ONG", hours });
      }
      setProjects(rows);
      setLoading(false);
    })();
  }, [userId]);

  const totalHours = projects.reduce((s, r) => s + r.hours, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 w-full">
        {loading ? (
          <div className="text-sm text-muted-foreground">A carregar…</div>
        ) : !p ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Perfil não encontrado.</p>
            <Link to="/" className="text-[color:var(--brand,#1E5AA8)] underline text-sm">Voltar</Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-end gap-6 pb-6 border-b">
              <div className="h-24 w-24 rounded-full bg-[color:var(--brand,#1E5AA8)] text-white flex items-center justify-center text-3xl font-semibold">
                {(p.full_name ?? "V").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold">{p.full_name ?? "Voluntário"}</h1>
                {p.provincia && <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3.5 w-3.5" /> {p.provincia}</p>}
                {p.biografia && <p className="mt-3 text-sm">{p.biografia}</p>}
                {p.portfolio_url && (
                  <a href={p.portfolio_url} target="_blank" rel="noreferrer" className="text-sm text-[color:var(--brand,#1E5AA8)] inline-flex items-center gap-1 mt-2">
                    Portfólio <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="rounded-lg border bg-card p-4 text-center min-w-40">
                <Award className="h-6 w-6 mx-auto text-[color:var(--impact,#22A06B)]" />
                <div className="text-2xl font-bold mt-1">{totalHours}h</div>
                <div className="text-xs text-muted-foreground">horas pro bono</div>
              </div>
            </div>

            {p.skills?.length ? (
              <div className="mt-6">
                <h2 className="text-sm font-medium mb-2">Competências</h2>
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            ) : null}

            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-3">Projetos de impacto</h2>
              {projects.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Ainda sem projetos aprovados.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.map((r) => (
                    <Card key={r.project_id}>
                      <CardContent className="p-4 space-y-2">
                        <div>
                          <div className="font-medium">{r.project_title}</div>
                          <div className="text-xs text-muted-foreground">{r.ngo_name}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{r.hours}h registadas</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={r.hours === 0}
                            onClick={() => setCert({
                              volunteerName: p.full_name ?? "Voluntário",
                              projectTitle: r.project_title,
                              ngoName: r.ngo_name,
                              hours: r.hours,
                              skills: p.skills ?? undefined,
                            })}
                          >
                            <Download className="h-4 w-4 mr-1.5" /> Certificado
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
      <CertificateModal open={!!cert} onOpenChange={(v) => !v && setCert(null)} data={cert} />
    </div>
  );
}
