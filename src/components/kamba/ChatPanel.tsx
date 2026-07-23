import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { notify } from "./NotificationsBell";

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export function ChatPanel({ projectId, projectTitle, memberIds }: { projectId: string; projectTitle: string; memberIds: string[] }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [uid, setUid] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [projectId, memberIds.join(",")]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || !uid) return;
    setText("");
    const { error } = await supabase.from("messages").insert({ project_id: projectId, sender_id: uid, body });
    if (error) return;
    // Notify other members
    const others = memberIds.filter((id) => id !== uid);
    await Promise.all(others.map((id) => notify(id, "message", `Nova mensagem — ${projectTitle}`, body.slice(0, 80), `/app/project/${projectId}`)));
  };

  return (
    <div className="rounded-lg border bg-card flex flex-col h-[420px]">
      <div className="px-3 py-2 border-b text-sm font-medium">Conversa do projeto</div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && <div className="text-xs text-muted-foreground text-center py-8">Envie a primeira mensagem para começar a colaborar.</div>}
        {messages.map((m) => {
          const mine = m.sender_id === uid;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className="text-[10px] text-muted-foreground mb-0.5">{names[m.sender_id] ?? "…"}</div>
              <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-[color:var(--brand,#1E5AA8)] text-white" : "bg-muted"}`}>{m.body}</div>
            </div>
          );
        })}
      </div>
      <div className="p-2 border-t flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Escreva uma mensagem…" />
        <Button size="icon" onClick={send} className="bg-[color:var(--brand,#1E5AA8)] hover:opacity-90"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
