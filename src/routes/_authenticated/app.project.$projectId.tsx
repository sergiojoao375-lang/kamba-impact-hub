import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/kamba/ChatPanel";

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

  const load = async () => {
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

  const addTask = async (col: Task["column_name"]) => {
    const title = (newTitle[col] ?? "").trim();
    if (!title) return;
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
    const { error } = await supabase.from("tasks").update({ column_name: col }).eq("id", taskId);
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/app/ngo"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button></Link>
          <div>
            <h1 className="text-2xl font-semibold">{project?.title ?? "Sala do projeto"}</h1>
            <p className="text-sm text-muted-foreground">{project?.ngo?.name} · Quadro colaborativo</p>
          </div>
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
                      className="p-3 text-sm bg-background cursor-grab active:cursor-grabbing flex items-start justify-between gap-2 group"
                    >
                      <span>{t.title}</span>
                      <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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

        <p className="text-xs text-muted-foreground">Arraste os cartões entre as colunas para atualizar o progresso.</p>
      </div>
    </AppShell>
  );
}
