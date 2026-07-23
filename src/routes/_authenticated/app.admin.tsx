import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { notify } from "@/components/kamba/NotificationsBell";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin · Kamba Social" },
      { name: "description", content: "Verificação de ONGs e Diário da República." },
    ],
  }),
  component: AdminPanel,
});

type Ngo = { id: string; name: string; nif: string | null; area_atuacao: string | null; diario_republica_url: string | null; status: string; created_by: string; created_at: string };

function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [ngos, setNgos] = useState<Ngo[]>([]);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setIsAdmin(false); return; }
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
    const admin = (roles ?? []).some((r) => r.role === "admin");
    setIsAdmin(admin);
    if (!admin) return;
    const { data } = await supabase.from("ngos").select("*").order("created_at", { ascending: false });
    setNgos((data ?? []) as Ngo[]);
  };

  useEffect(() => { load(); }, []);

  const decide = async (n: Ngo, status: "aprovado" | "rejeitado") => {
    const { error } = await supabase.from("ngos").update({ status }).eq("id", n.id);
    if (error) return toast.error(error.message);
    toast.success(status === "aprovado" ? "ONG aprovada" : "ONG rejeitada");
    await notify(n.created_by, "ngo_status", `A sua ONG foi ${status}`, n.name, "/app/ngo");
    load();
  };

  if (isAdmin === null) return <AppShell><div className="text-sm text-muted-foreground">A verificar permissões…</div></AppShell>;
  if (!isAdmin) return (
    <AppShell>
      <div className="rounded-lg border p-8 text-center">
        <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
        <h1 className="text-lg font-semibold mt-2">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">Esta área é reservada a administradores.</p>
      </div>
    </AppShell>
  );

  const pendentes = ngos.filter((n) => n.status === "pendente");
  const outras = ngos.filter((n) => n.status !== "pendente");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Verificação de ONGs</h1>
          <p className="text-sm text-muted-foreground">Reveja o Diário da República e aprove/rejeite as organizações pendentes.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Pendentes ({pendentes.length})</h2>
          {pendentes.length === 0 && <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Nenhuma pendente.</div>}
          {pendentes.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium">{n.name}</div>
                    <div className="text-xs text-muted-foreground">NIF: {n.nif ?? "—"} · Área: {n.area_atuacao ?? "—"}</div>
                  </div>
                  <Badge variant="secondary">{n.status}</Badge>
                </div>
                {n.diario_republica_url && (
                  <a href={n.diario_republica_url} target="_blank" rel="noreferrer" className="text-xs text-[color:var(--brand,#1E5AA8)] inline-flex items-center gap-1">
                    Ver Diário da República <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => decide(n, "aprovado")} className="bg-[color:var(--impact,#22A06B)] hover:opacity-90 text-white">
                    <Check className="h-4 w-4 mr-1" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decide(n, "rejeitado")}>
                    <X className="h-4 w-4 mr-1" /> Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Histórico ({outras.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {outras.map((n) => (
              <Card key={n.id}><CardContent className="p-3 flex items-center justify-between">
                <div className="text-sm">{n.name}</div>
                <Badge variant={n.status === "aprovado" ? "default" : "destructive"}>{n.status}</Badge>
              </CardContent></Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
