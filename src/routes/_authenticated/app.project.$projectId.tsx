import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/kamba/ChatPanel";
import { useServerFn } from "@tanstack/react-start";
import { finalizeProject } from "@/lib/impact.functions";

const fmtKz = (n: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);


export const Route = createFileRoute("/_authenticated/app/project/$projectId")({
  head: () => ({
    meta: [
      { title: "Sala do Projeto · Kamba Social" },
      { name: "description", content: "Quadro Kanban colaborativo entre ONG e voluntário." },
    ],
  }),
  component: ProjectRoom,
});

type Task = { id: string; title: string; column_name: "a_fazer" | "em_progresso" | "concluido"; position: number; hours_logged: number };
type Project = { id: string; title: string; description: string; created_by: string; ngo: { name: string } | null };

const COLUMNS: { key: Task["column_name"]; label: string; tone: string }[] = [
  { key: "a_fazer", label: "A Fazer", tone: "bg-slate-100" },
  { key: "em_progresso", label: "Em Progresso", tone: "bg-blue-50" },
  { key: "concluido", label: "Concluído", tone: "bg-green-50" },
];

function ProjectRoom() {
  const { projectId } = Route.useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState<Record<string, string>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const finalizeFn = useServerFn(finalizeProject);

  const isDemo = projectId.startsWith("demo-");
  const isOwner = !isDemo && !!project && !!uid && project.created_by === uid;

  const finalize = async () => {
    setFinalizing(true);
    try {
      const res = await finalizeFn({ data: { projectId } });
      toast.success(
        `Projeto concluído · ${res.totalHours} h · Valor Pro Bono ${fmtKz(res.valueKz)}`,
      );
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível finalizar o projeto");
    } finally {
      setFinalizing(false);
    }
  };


  const load = async () => {
    if (isDemo) {
      setProject({
        id: projectId,
        title: "Projeto Demo · Kamba Social",
        description: "Sala de projeto simulada para testar o quadro Kanban colaborativo.",
        created_by: "demo",
        ngo: { name: "ONG Demo" },
      });
      setTasks([
        { id: "d1", title: "Reunião de alinhamento inicial", column_name: "a_fazer", position: 0, hours_logged: 0 },
        { id: "d2", title: "Definir escopo e entregáveis", column_name: "a_fazer", position: 1, hours_logged: 0 },
        { id: "d3", title: "Wireframes v1", column_name: "em_progresso", position: 0, hours_logged: 0 },
        { id: "d4", title: "Kickoff assinado", column_name: "concluido", position: 0, hours_logged: 2 },
      ]);
      setMemberIds([]);
      return;
    }
    const { data: p } = await supabase.from("projects").select("id,title,description,created_by,ngo:ngos(name)").eq("id", projectId).maybeSingle();
    setProject(p as unknown as Project);
    const { data: t, error } = await supabase.from("tasks").select("id,title,column_name,position,hours_logged").eq("project_id", projectId).order("position");
    if (error) toast.error(error.message);
    setTasks((t ?? []) as Task[]);
    const { data: apps } = await supabase.from("applications").select("volunteer_id").eq("project_id", projectId).eq("status", "aprovado");
    const ids = new Set<string>((apps ?? []).map((a) => a.volunteer_id));
    if (p) ids.add((p as any).created_by);
    setMemberIds(Array.from(ids));
  };

  useEffect(() => { load(); }, [projectId]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);


  const addTask = async (col: Task["column_name"]) => {
    const title = (newTitle[col] ?? "").trim();
    if (!title) return;
    if (isDemo) {
      setTasks((cur) => [...cur, { id: `d${Date.now()}`, title, column_name: col, position: cur.length, hours_logged: 0 }]);
      setNewTitle((s) => ({ ...s, [col]: "" }));
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const pos = tasks.filter((t) => t.column_name === col).length;
    const { error } = await supabase.from("tasks").insert({ project_id: projectId, title, column_name: col, position: pos, created_by: uid });
    if (error) toast.error(error.message);
    else { setNewTitle((s) => ({ ...s, [col]: "" })); load(); }
  };

  const move = async (taskId: string, col: Task["column_name"]) => {
    setTasks((cur) => cur.map((t) => t.id === taskId ? { ...t, column_name: col } : t));
    if (isDemo) return;
    const { error } = await supabase.from("tasks").update({ column_name: col }).eq("id", taskId);
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async (id: string) => {
    if (isDemo) { setTasks((cur) => cur.filter((t) => t.id !== id)); return; }
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/app/ngo"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-semibold">{project?.title ?? "Sala do projeto"}</h1>
            <p className="text-sm text-muted-foreground">{project?.ngo?.name} · Quadro colaborativo</p>
          </div>
          {isOwner && (
            <Button
              size="sm"
              onClick={finalize}
              disabled={finalizing}
              className="bg-[color:var(--impact)] hover:bg-[color:var(--impact)]/90 text-[color:var(--impact-foreground)]"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> {finalizing ? "A calcular…" : "Concluir projeto"}
            </Button>
          )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.column_name === col.key);
            return (
              <div
                key={col.key}
                className={`rounded-lg border ${col.tone} p-3 min-h-[300px] flex flex-col`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragId) { move(dragId, col.key); setDragId(null); } }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{col.label}</h3>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2">
                  {items.map((t) => (
                    <Card
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className="p-3 text-sm bg-background cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span>{t.title}</span>
                        <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {col.key === "concluido" && (
                        <label className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            defaultValue={t.hours_logged}
                            onBlur={async (e) => {
                              const h = Number(e.target.value) || 0;
                              await supabase.from("tasks").update({ hours_logged: h }).eq("id", t.id);
                              load();
                            }}
                            className="w-16 h-6 rounded border bg-background px-1"
                          />
                          horas
                        </label>
                      )}
                    </Card>
                  ))}
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Input
                    value={newTitle[col.key] ?? ""}
                    onChange={(e) => setNewTitle((s) => ({ ...s, [col.key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addTask(col.key)}
                    placeholder="Nova tarefa…"
                    className="h-9 bg-background"
                  />
                  <Button size="sm" variant="outline" onClick={() => addTask(col.key)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">Arraste os cartões entre as colunas para atualizar o progresso. Registe as horas nas tarefas concluídas para gerar o certificado.</p>
      </div>

      {/* Chat do Projeto — botão flutuante + janela */}
      {chatOpen && (
        <div className="fixed z-50 bottom-4 right-4 w-[min(92vw,380px)] h-[min(70vh,480px)]">
          <ChatPanel
            projectId={projectId}
            projectTitle={project?.title ?? "Projeto"}
            memberIds={memberIds}
            demo={isDemo || memberIds.length === 0}
            onClose={() => setChatOpen(false)}
          />
        </div>
      )}
      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          className="fixed z-50 bottom-4 right-4 rounded-full shadow-lg h-12 px-5 bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90 text-[color:var(--brand-foreground)]"
        >
          <MessageCircle className="h-5 w-5 mr-2" /> Chat do Projeto 💬
        </Button>
      )}
    </AppShell>
  );
}
