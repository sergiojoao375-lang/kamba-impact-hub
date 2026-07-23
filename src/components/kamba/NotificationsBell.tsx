import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "@tanstack/react-router";

type Notif = { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUid(id);
      if (!id) return;
      const { data: rows } = await supabase.from("notifications").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20);
      setItems((rows ?? []) as Notif[]);
      channel = supabase
        .channel(`notif-${id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${id}` }, (p) => {
          setItems((cur) => [p.new as Notif, ...cur].slice(0, 20));
        })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const unread = items.filter((i) => !i.read_at).length;

  const markAll = async () => {
    if (!uid || unread === 0) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
    setItems((cur) => cur.map((i) => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })));
  };

  return (
    <Popover onOpenChange={(o) => o && markAll()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[color:var(--impact,#22A06B)] text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b text-sm font-medium">Notificações</div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Sem notificações</div>}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => n.link && navigate({ to: n.link })}
              className={`w-full text-left px-3 py-2 border-b last:border-0 hover:bg-muted text-sm ${!n.read_at ? "bg-blue-50/50" : ""}`}
            >
              <div className="font-medium">{n.title}</div>
              {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
              <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-PT")}</div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to insert a notification from anywhere in the app
export async function notify(userId: string, kind: string, title: string, body?: string, link?: string) {
  await supabase.from("notifications").insert({ user_id: userId, kind, title, body: body ?? null, link: link ?? null });
}
