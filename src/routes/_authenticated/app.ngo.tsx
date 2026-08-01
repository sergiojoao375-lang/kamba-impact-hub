import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PROVINCIAS_ANGOLA, COMPETENCIAS } from "@/lib/angola";
import { Plus, Check, X, ExternalLink, KanbanSquare, TriangleAlert, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/components/kamba/NotificationsBell";
import { notifyApproved } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/app/ngo")({
  head: () => ({
    meta: [
      { title: "Painel da ONG · Kamba Social" },
      { name: "description", content: "Publique vagas e gira as candidaturas dos voluntários." },
    ],
  }),
  component: NgoDashboard,
});

type Ngo = { id: string; name: string; status: string };
type Project = { id: string; title: string; description: string; status: string; provincia: string | null; remote: boolean; hours_per_week: number };
type Application = {
  id: string;
  status: string;
  project_id: string;
  volunteer: { id: string; full_name: string | null; portfolio_url: string | null; provincia: string | null; skills: string[] } | null;
};

const DEMO_NGO: Ngo = { id: "demo-ngo", name: "Associação Kubuka", status: "aprovado" };
const DEMO_PROJECTS: Project[] = [
  { id: "demo-p1", title: "Website institucional", description: "Criação do site da ONG.", status: "aberto", provincia: "Luanda", remote: true, hours_per_week: 6 },
  { id: "demo-p2", title: "Organização contabilística", description: "Balanço anual da associação.", status: "aberto", provincia: "Benguela", remote: false, hours_per_week: 4 },
];
const DEMO_APPS: Application[] = [
  { id: "demo-a1", status: "pendente", project_id: "demo-p1", volunteer: { id: "demo-v1", full_name: "Ana Kiala", portfolio_url: null, provincia: "Luanda", skills: ["Design", "Programação"] } },
  { id: "demo-a2", status: "pendente", project_id: "demo-p2", volunteer: { id: "demo-v2", full_name: "Paulo Mendes", portfolio_url: null, provincia: "Benguela", skills: ["Contabilidade"] } },
  { id: "demo-a3", status: "aprovado", project_id: "demo-p1", volunteer: { id: "demo-v3", full_name: "Teresa Nzinga", portfolio_url: null, provincia: "Huíla", skills: ["Marketing"] } },
];

function NgoDashboard() {
  const [ngo, setNgo] = useState<Ngo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const enterDemo = () => {
    setNgo(DEMO_NGO);
    setProjects(DEMO_PROJECTS);
    setApps(DEMO_APPS);
    setDemo(true);
  };

  const load = async () => {
    setLoading(true);
    setDemo(false);
    const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 5000));
    try {
      const work = (async () => {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) return null;
        const { data: ngos } = await supabase.from("ngos").select("id,name,status").eq("created_by", uid).limit(1);
        const myNgo = (ngos ?? [])[0] ?? null;
        if (!myNgo) return null;
        const { data: pr } = await supabase.from("projects").select("id,title,description,status,provincia,remote,hours_per_week").eq("ngo_id", myNgo.id).order("created_at", { ascending: false });
        const projectRows = (pr ?? []) as Project[];
        const ids = projectRows.map((p) => p.id);
        let appRows: Application[] = [];
        if (ids.length) {
          const { data: ap } = await supabase.from("applications").select("id,status,project_id,volunteer_id").in("project_id", ids);
          const rows = ap ?? [];
          const volIds = Array.from(new Set(rows.map((r) => r.volunteer_id)));
          const { data: profs } = volIds.length
            ? await supabase.from("profiles").select("id,full_name,portfolio_url,provincia,skills").in("id", volIds)
            : { data: [] as any[] };
          const byId = new Map((profs ?? []).map((p) => [p.id, p]));
          appRows = rows.map((r) => ({
            id: r.id, status: r.status, project_id: r.project_id,
            volunteer: (byId.get(r.volunteer_id) as Application["volunteer"]) ?? null,
          }));
        }
        return { myNgo, projectRows, appRows };
      })();

      const res = await Promise.race([work, timeout]);
      if (res === "timeout" || res === null) {
        enterDemo();
      } else {
        setNgo(res.myNgo);
        setProjects(res.projectRows);
        setApps(res.appRows);
      }
    } catch {
      enterDemo();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: "aprovado" | "rejeitado") => {
    const app = apps.find((x) => x.id === id);
    if (demo) {
      setApps((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
      toast.success(status === "aprovado" ? "Voluntário aprovado (modo demonstração)" : "Candidatura recusada (modo demonstração)");
      return;
    }
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "aprovado" ? "Voluntário aprovado" : "Candidatura recusada");
      const proj = projects.find((p) => p.id === app?.project_id);
      if (app?.volunteer?.id && proj) {
        await notify(
          app.volunteer.id,
          "application",
          status === "aprovado" ? "Candidatura aprovada!" : "Candidatura não selecionada",
          `${proj.title} · ${ngo?.name ?? ""}`,
          status === "aprovado" ? `/app/project/${proj.id}` : "/app/feed",
        );
        // Fase 4 · Gatilho WhatsApp — "Aprovado numa Candidatura"
        if (status === "aprovado") {
          const { data: vp } = await supabase.from("profiles").select("phone").eq("id", app.volunteer.id).maybeSingle();
          if (vp?.phone) notifyApproved(vp.phone, proj.title, ngo?.name ?? "ONG");
        }
      }
      load();
    }
  };


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Painel da ONG</h1>
            <p className="text-sm text-muted-foreground">
              {ngo ? <>Organização: <span className="font-medium text-foreground">{ngo.name}</span> · Status: <Badge variant={ngo.status === "aprovado" ? "default" : "secondary"}>{ngo.status}</Badge></> : "Complete o cadastro da sua ONG para começar."}
            </p>
          </div>
          {ngo && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90"><Plus className="h-4 w-4 mr-2" /> Publicar Nova Vaga</Button>
              </DialogTrigger>
              <NewProjectDialog ngoId={ngo.id} onCreated={() => { setOpen(false); load(); }} />
            </Dialog>
          )}
        </div>

        {demo && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
            <div className="flex items-start gap-3">
              <TriangleAlert className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
              <div>
                <p className="font-medium">Modo demonstração — dados fictícios de segurança</p>
                <p className="text-muted-foreground">A base de dados está indisponível. As ações abaixo não são gravadas.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">A carregar…</div>

        ) : !ngo ? (
          <Card><CardContent className="p-6 text-sm">Ainda não registou a sua ONG. <Link to="/onboarding" className="text-[color:var(--brand)] underline">Concluir cadastro</Link></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="space-y-3">
              <h2 className="text-lg font-medium">As suas vagas</h2>
              {projects.length === 0 && <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Sem vagas publicadas.</div>}
              {projects.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.title}</CardTitle>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">{p.remote ? "Remoto" : p.provincia} · {p.hours_per_week}h/sem</div>
                    <Link to="/app/project/$projectId" params={{ projectId: p.id }}>
                      <Button size="sm" variant="outline"><KanbanSquare className="h-4 w-4 mr-2" /> Sala do projeto</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Candidaturas recebidas</h2>
              {apps.length === 0 && <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Ainda sem candidaturas.</div>}
              {apps.map((a) => {
                const proj = projects.find((p) => p.id === a.project_id);
                return (
                  <Card key={a.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium">{a.volunteer?.full_name ?? "Voluntário"}</div>
                          <div className="text-xs text-muted-foreground">Vaga: {proj?.title ?? "—"} · {a.volunteer?.provincia ?? "—"}</div>
                        </div>
                        <Badge variant={a.status === "aprovado" ? "default" : a.status === "rejeitado" ? "destructive" : "secondary"}>{a.status}</Badge>
                      </div>
                      {a.volunteer?.skills?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {a.volunteer.skills.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                        </div>
                      ) : null}
                      {a.volunteer?.portfolio_url && (
                        <a href={a.volunteer.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--brand)] inline-flex items-center gap-1">
                          Portfólio <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {a.status === "pendente" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => decide(a.id, "aprovado")} className="bg-[color:var(--impact)] hover:bg-[color:var(--impact)]/90 text-[color:var(--impact-foreground)]">
                            <Check className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => decide(a.id, "rejeitado")}>
                            <X className="h-4 w-4 mr-1" /> Recusar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function NewProjectDialog({ ngoId, onCreated }: { ngoId: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [provincia, setProvincia] = useState<string>("Luanda");
  const [remote, setRemote] = useState(false);
  const [hours, setHours] = useState(5);
  const [weeks, setWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  const toggleSkill = (s: string) => setSkills((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);

  const submit = async () => {
    if (!title.trim() || !description.trim()) { toast.error("Preencha título e descrição"); return; }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) { toast.error("Sessão expirou"); setSaving(false); return; }
    const { error } = await supabase.from("projects").insert({
      ngo_id: ngoId,
      created_by: uid,
      title, description, skills,
      provincia: remote ? null : provincia,
      remote,
      hours_per_week: hours,
      duration_weeks: weeks,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Vaga publicada"); onCreated(); }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Publicar nova vaga</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Título da vaga</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Redesenho do site institucional" />
        </div>
        <div className="space-y-1.5">
          <Label>Descrição do escopo</Label>
          <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva os objetivos, entregas e contexto do projeto." />
        </div>
        <div className="space-y-1.5">
          <Label>Competências necessárias</Label>
          <div className="flex flex-wrap gap-1.5">
            {COMPETENCIAS.map((c) => (
              <button type="button" key={c} onClick={() => toggleSkill(c)}
                className={`text-xs px-2.5 py-1 rounded-full border ${skills.includes(c) ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)] border-transparent" : "bg-background hover:bg-muted"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label className="mb-1 block">Trabalho remoto</Label>
            <p className="text-xs text-muted-foreground">Se ativado, a vaga não requer província.</p>
          </div>
          <Switch checked={remote} onCheckedChange={setRemote} />
        </div>
        {!remote && (
          <div className="space-y-1.5">
            <Label>Província</Label>
            <Select value={provincia} onValueChange={setProvincia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PROVINCIAS_ANGOLA.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Horas / semana</Label>
            <Input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Duração (semanas)</Label>
            <Input type="number" min={1} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
          {saving ? "A publicar…" : "Publicar vaga"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
