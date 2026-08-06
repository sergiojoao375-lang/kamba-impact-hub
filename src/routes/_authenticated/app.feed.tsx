import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { ProjectCard, type ProjectCardData } from "@/components/kamba/ProjectCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROVINCIAS_ANGOLA, COMPETENCIAS } from "@/lib/angola";
import { toast } from "sonner";
import { Search, Lock, GraduationCap, Award, Clock, MapPin, Coins } from "lucide-react";
import { notify } from "@/components/kamba/NotificationsBell";
import { notifyMatch } from "@/lib/whatsapp";
import { DEMO_INTERNSHIPS, computePoints, medalsFor, fmtKz } from "@/lib/internships";

// Vagas mockadas para demo end-to-end quando não há sessão / DB vazia.
const DEMO_PROJECTS: ProjectCardData[] = [
  {
    id: "demo-1",
    title: "Site institucional para ONG de educação",
    description: "Redesign do site com foco em captação de doações e transparência financeira.",
    skills: ["Design", "Tecnologia"],
    provincia: "Luanda",
    remote: false,
    hours_per_week: 6,
    duration_weeks: 8,
    ngo: { name: "Fundação Kubuka Angola", status: "aprovado", area_atuacao: "Educação" },
  },
  {
    id: "demo-2",
    title: "Consultoria contabilística pro bono",
    description: "Apoio na organização das contas anuais e submissão à AGT.",
    skills: ["Finanças", "Contabilidade"],
    provincia: "Benguela",
    remote: true,
    hours_per_week: 4,
    duration_weeks: 12,
    ngo: { name: "Associação Mãos que Ajudam", status: "aprovado", area_atuacao: "Saúde" },
  },
  {
    id: "demo-3",
    title: "Campanha de marketing digital",
    description: "Estratégia de redes sociais para captação de voluntários no interior.",
    skills: ["Marketing"],
    provincia: "Huíla",
    remote: true,
    hours_per_week: 5,
    duration_weeks: 6,
    ngo: { name: "Rede Jovens de Impacto", status: "pendente", area_atuacao: "Juventude" },
  },
];


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
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [provincia, setProvincia] = useState<string>("all");
  const [skill, setSkill] = useState<string>("all");
  const [q, setQ] = useState("");
  const [done, setDone] = useState({ projetos: 0, horas: 0 });

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      const { data } = await supabase
        .from("projects")
        .select("id,title,description,skills,provincia,remote,hours_per_week,duration_weeks,ngo:ngos(name,status,area_atuacao)")
        .eq("status", "aberto")
        .order("created_at", { ascending: false });
      const list = (data ?? []) as unknown as ProjectCardData[];
      // Demo fallback: sem sessão ou DB vazia → mostrar vagas mockadas.
      setProjects(list.length ? list : DEMO_PROJECTS);
      if (uid) {
        const { data: apps } = await supabase
          .from("applications")
          .select("project_id,status,project:projects(status)")
          .eq("volunteer_id", uid);
        setApplied(new Set((apps ?? []).map((a) => a.project_id)));
        const concluidos = (apps ?? []).filter(
          (a: any) => a.status === "aprovado" && a.project?.status === "concluido",
        );
        if (concluidos.length) {
          const { data: tks } = await supabase
            .from("tasks")
            .select("hours_logged,project_id")
            .in("project_id", concluidos.map((a: any) => a.project_id));
          setDone({
            projetos: concluidos.length,
            horas: (tks ?? []).reduce((s, t) => s + Number(t.hours_logged ?? 0), 0),
          });
        }
        const { data: me } = await supabase.from("profiles").select("phone,skills,provincia").eq("id", uid).maybeSingle();
        if (me?.phone && me.skills?.length) {
          const appliedSet = new Set((apps ?? []).map((a) => a.project_id));
          const matches = list.filter((p: any) =>
            !appliedSet.has(p.id) &&
            (p.skills ?? []).some((s: string) => me.skills!.includes(s)) &&
            (p.remote || p.provincia === me.provincia),
          );
          matches.slice(0, 3).forEach((p: any) => notifyMatch(me.phone!, p.title, p.ngo?.name ?? "ONG parceira"));
        }
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

  const openRoom = (projectId: string) => navigate({ to: "/app/project/$projectId", params: { projectId } });

  const apply = async (projectId: string) => {
    setApplyingId(projectId);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    // Modo demo (sem sessão ou projecto mockado): simula sucesso e abre a sala.
    if (!uid || projectId.startsWith("demo-")) {
      toast.success("Candidatura aprovada! A abrir sala do projeto…");
      setApplied((s) => new Set(s).add(projectId));
      setApplyingId(null);
      setTimeout(() => openRoom(projectId), 600);
      return;
    }
    const { error } = await supabase.from("applications").insert({ project_id: projectId, volunteer_id: uid });
    if (error) toast.error(error.message);
    else {
      toast.success("Candidatura enviada! A abrir sala do projeto…");
      setApplied((s) => new Set(s).add(projectId));
      const proj = projects.find((p) => p.id === projectId);
      const { data: pdata } = await supabase.from("projects").select("created_by,title").eq("id", projectId).maybeSingle();
      if (pdata?.created_by) {
        await notify(pdata.created_by, "application", "Nova candidatura recebida", proj?.title ?? pdata.title, "/app/ngo");
      }
      setTimeout(() => openRoom(projectId), 600);
    }
    setApplyingId(null);
  };


  const pontos = computePoints(done.projetos, done.horas);
  const medals = medalsFor(done.projetos, done.horas);
  const unlocked = done.projetos >= 1;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Vagas Pro Bono</h1>
          <p className="text-sm text-muted-foreground">Encontre projetos de impacto onde as suas competências fazem a diferença.</p>
        </div>

        <Tabs defaultValue="probono" className="space-y-6">
          <TabsList>
            <TabsTrigger value="probono">Vagas Pro Bono</TabsTrigger>
            <TabsTrigger value="estagios" className="gap-1">
              {!unlocked && <Lock className="h-3 w-3" />} Vagas de Estágio
            </TabsTrigger>
          </TabsList>

          <TabsContent value="probono" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="estagios" className="space-y-6">
            {!unlocked ? (
              <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">Bloqueado</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Conclua pelo menos 1 projeto com uma ONG para liberar candidaturas a estágios.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDone({ projetos: 1, horas: 40 });
                    toast.success("Modo demo: projeto concluído registado. Estágios liberados!");
                  }}
                >
                  Simular projeto concluído (demo)
                </Button>
              </div>
            ) : (
              <>
                <Card>
                  <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-[color:var(--brand)]/10 flex items-center justify-center text-[color:var(--brand)]">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Os seus pontos</p>
                        <p className="text-2xl font-semibold">{pontos} pts</p>
                        <p className="text-xs text-muted-foreground">
                          {done.projetos} projeto(s) concluído(s) · {done.horas} h registadas
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {medals.map((m) => (
                        <Badge key={m.name} variant="secondary" title={m.hint}>
                          <span className="mr-1">{m.emoji}</span> {m.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DEMO_INTERNSHIPS.map((i) => {
                    const elegivel = pontos >= i.points_required;
                    return (
                      <Card key={i.id} className="flex flex-col">
                        <CardContent className="p-5 space-y-3 flex-1 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className="gap-1">
                              <GraduationCap className="h-3 w-3" /> {i.level}
                            </Badge>
                            <Badge variant="secondary">{i.area}</Badge>
                          </div>
                          <div>
                            <h3 className="font-semibold leading-tight">{i.title}</h3>
                            <p className="text-sm text-muted-foreground">{i.company}</p>
                          </div>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {i.provincia}</p>
                            <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {i.duration_months} meses</p>
                            <p className="flex items-center gap-2 text-foreground font-medium">
                              <Coins className="h-3.5 w-3.5" /> {fmtKz(i.stipend_kz)} / mês
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Requer {i.points_required} pts · tem {pontos} pts
                          </p>
                          <Button
                            className="mt-auto bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90"
                            disabled={!elegivel}
                            onClick={() => toast.success(`Candidatura ao estágio enviada a ${i.company}`)}
                          >
                            {elegivel ? "Candidatar-me ao estágio" : `Faltam ${i.points_required - pontos} pts`}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
