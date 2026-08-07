import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X, MessageCircle } from "lucide-react";
import { notify } from "./NotificationsBell";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

const DEMO_SEED: Msg[] = [
  { id: "m1", sender_id: "ong", body: "Olá! Bem-vindo à sala do projeto. Podemos começar pelo alinhamento inicial?", created_at: new Date().toISOString() },
  { id: "m2", sender_id: "me", body: "Olá! Claro, já revi as tarefas do quadro.", created_at: new Date().toISOString() },
];

const DEMO_REPLIES = [
  "Perfeito, obrigado pelo retorno!",
  "Vou registar isso no quadro Kanban.",
  "Podemos marcar uma chamada esta semana?",
  "Excelente trabalho, equipa Kamba! 💚",
];

export function ChatPanel({
  projectId,
  projectTitle,
  memberIds,
  demo = false,
  onClose,
}: {
  projectId: string;
  projectTitle: string;
  memberIds: string[];
  demo?: boolean;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>(demo ? DEMO_SEED : []);
  const [text, setText] = useState("");
  const [uid, setUid] = useState<string | null>(demo ? "me" : null);
  const [names, setNames] = useState<Record<string, string>>(demo ? { me: "Você", ong: "ONG Demo" } : {});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demo) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setUid(u.user?.id ?? null);
      const { data } = await supabase.from("messages").select("*").eq("project_id", projectId).order("created_at").limit(200);
      setMessages((data ?? []) as Msg[]);
      const ids = Array.from(new Set([...(data ?? []).map((m) => m.sender_id), ...memberIds]));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
        setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "Utilizador"])));
      }
      channel = supabase
        .channel(`msg-${projectId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` }, (p) => {
          setMessages((cur) => [...cur, p.new as Msg]);
        })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [projectId, memberIds.join(","), demo]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !uid) return;
    setText("");
    if (demo) {
      setMessages((cur) => [...cur, { id: `d${Date.now()}`, sender_id: "me", body, created_at: new Date().toISOString() }]);
      const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
      setTimeout(() => {
        setMessages((cur) => [...cur, { id: `d${Date.now()}r`, sender_id: "ong", body: reply, created_at: new Date().toISOString() }]);
      }, 900);
      return;
    }
    const { error } = await supabase.from("messages").insert({ project_id: projectId, sender_id: uid, body });
    if (error) return;
    const others = memberIds.filter((id) => id !== uid);
    await Promise.all(others.map((id) => notify(id, "message", `Nova mensagem — ${projectTitle}`, body.slice(0, 80), `/app/project/${projectId}`)));
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col h-full overflow-hidden shadow-lg">
      <div className="px-3 py-2 border-b flex items-center justify-between bg-[color:var(--brand)] text-[color:var(--brand-foreground)]">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageCircle className="h-4 w-4" /> Chat do Projeto
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Fechar chat" className="opacity-80 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Envie a primeira mensagem para começar a colaborar.</div>}
        {messages.map((m) => {
          const mine = m.sender_id === uid;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className="text-[10px] text-muted-foreground mb-0.5">{names[m.sender_id] ?? "…"}</div>
              <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-[color:var(--brand)] text-[color:var(--brand-foreground)]" : "bg-muted text-foreground"}`}>{m.body}</div>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva uma mensagem…" />
        <Button size="icon" onClick={send} className="bg-[color:var(--brand)] hover:opacity-90"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
