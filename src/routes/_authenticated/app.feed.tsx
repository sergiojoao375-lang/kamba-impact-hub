import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { ProjectCard, type ProjectCardData } from "@/components/kamba/ProjectCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PROVINCIAS_ANGOLA, COMPETENCIAS } from "@/lib/angola";
import { toast } from "sonner";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/feed")({
  head: () => ({
    meta: [
      { title: "Vagas Pro Bono · Kamba Social" },
      { name: "description", content: "Feed de vagas de voluntariado de competências em Angola." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [provincia, setProvincia] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const { data, error } = await supabase
        .from("projects")
        .select("id,title,description,skills,provincia,remote,hours_per_week,duration_weeks,ngo:ngos(name,status,area_atuacao)")
        .eq("status", "aberto")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setProjects((data ?? []) as unknown as ProjectCardData[]);
      if (uid) {
        const { data: apps } = await supabase.from("applications").select("project_id").eq("volunteer_id", uid);
        setApplied(new Set((apps ?? []).map((a) => a.project_id)));
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (provincia !== "all" && p.provincia !== provincia && !(provincia === "Remoto" && p.remote)) return false;
      if (skill !== "all" && !p.skills?.includes(skill)) return false;
      if (q && !`${p.title} ${p.description} ${p.ngo?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [projects, provincia, skill, q]);

  const apply = async (projectId: string) => {
    setApplyingId(projectId);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { toast.error("Sessão expirou"); setApplyingId(null); return; }
    const { error } = await supabase.from("applications").insert({ project_id: projectId, volunteer_id: uid });
    if (error) toast.error(error.message);
    else {
      toast.success("Candidatura enviada!");
      setApplied((s) => new Set(s).add(projectId));
    }
    setApplyingId(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Vagas Pro Bono</h1>
          <p className="text-sm text-muted-foreground">Encontre projetos de impacto onde as suas competências fazem a diferença.</p>
        </div>

        <div className="rounded-lg border bg-card p-3 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar vagas ou ONGs…" className="pl-9" />
          </div>
          <Select value={provincia} onValueChange={setProvincia}>
            <SelectTrigger><SelectValue placeholder="Província" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as províncias</SelectItem>
              <SelectItem value="Remoto">Remoto</SelectItem>
              {PROVINCIAS_ANGOLA.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger><SelectValue placeholder="Competência" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as competências</SelectItem>
              {COMPETENCIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">A carregar vagas…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
            Ainda não há vagas com estes filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                applied={applied.has(p.id)}
                loading={applyingId === p.id}
                onApply={() => apply(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
