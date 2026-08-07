import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, FileText, ShieldAlert, RefreshCw, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { BackendLog } from "@/components/kamba/BackendLog";
import { decideNgo, DEMO_NGOS, type BackendLogEntry, type NgoRow } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/app/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin · Kamba Social" },
      { name: "description", content: "Verificação de ONGs e Diário da República." },
    ],
  }),
  component: AdminPanel,
});

const FILTERS = ["todas", "pendente", "aprovado", "rejeitado"] as const;
type Filter = (typeof FILTERS)[number];

function statusVariant(status: string) {
  if (status === "aprovado") return "default" as const;
  if (status === "rejeitado") return "destructive" as const;
  return "secondary" as const;
}

function AdminPanel() {
  const [ngos, setNgos] = useState<NgoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const [filter, setFilter] = useState<Filter>("todas");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BackendLogEntry[]>([]);
  const [docNgo, setDocNgo] = useState<NgoRow | null>(null);

  const pushLogs = (entries: BackendLogEntry[]) => setLogs((prev) => [...entries, ...prev].slice(0, 60));

  const load = useCallback(async () => {
    setLoading(true);
    setDemo(false);
    setRestricted(false);
    const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 5000));
    try {
      const work = (async () => {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return { restricted: false, rows: null as NgoRow[] | null };
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
        const admin = (roles ?? []).some((r) => r.role === "admin");
        const { data, error } = await supabase.from("ngos").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return { restricted: !admin && (data ?? []).length === 0, rows: (data ?? []) as NgoRow[] };
      })();

      const res = await Promise.race([work, timeout]);
      if (res === "timeout" || !res.rows || res.rows.length === 0) {
        setNgos(DEMO_NGOS);
        setDemo(true);
      } else {
        setNgos(res.rows);
        setRestricted(res.restricted);
      }
    } catch {
      setNgos(DEMO_NGOS);
      setDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const decide = async (n: NgoRow, status: "aprovado" | "rejeitado") => {
    setBusyId(n.id);
    if (demo || n.id.startsWith("demo-")) {
      const at = new Date().toLocaleTimeString("pt-PT");
      pushLogs([
        { id: `${n.id}-${status}-1`, at, label: "UPDATE ngos", detail: `SET status = '${status}' WHERE id = '${n.id}' (simulado)`, ms: 42, ok: true },
        { id: `${n.id}-${status}-2`, at, label: "INSERT notifications", detail: `kind = 'ngo_status' (simulado)`, ms: 18, ok: true },
        ...(status === "aprovado"
          ? [{ id: `${n.id}-${status}-3`, at, label: "WHATSAPP send", detail: `template = 'ngo_approved' → +${n.phone ?? "—"} (simulado)`, ms: 65, ok: true }]
          : []),
      ]);
      setNgos((prev) => prev.map((x) => (x.id === n.id ? { ...x, status } : x)));
      toast.success(status === "aprovado" ? "ONG aprovada (modo demonstração)" : "ONG rejeitada (modo demonstração)");
      setBusyId(null);
      return;
    }

    const res = await decideNgo(n, status);
    pushLogs(res.logs);
    if (res.ok) {
      toast.success(res.message);
      setNgos((prev) => prev.map((x) => (x.id === n.id ? { ...x, status } : x)));
    } else {
      toast.error(res.message);
    }
    setBusyId(null);
  };

  const counts = {
    todas: ngos.length,
    pendente: ngos.filter((n) => n.status === "pendente").length,
    aprovado: ngos.filter((n) => n.status === "aprovado").length,
    rejeitado: ngos.filter((n) => n.status === "rejeitado").length,
  };
  const rows = filter === "todas" ? ngos : ngos.filter((n) => n.status === filter);

  if (restricted) {
    return (
      <AppShell>
        <div className="rounded-lg border p-8 text-center">
          <ShieldAlert className="h-8 w-8 mx-auto text-muted-foreground" />
          <h1 className="text-lg font-semibold mt-2">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">Esta área é reservada a administradores.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Verificação de ONGs</h1>
            <p className="text-sm text-muted-foreground">
              Reveja o Diário da República e aprove ou rejeite as organizações registadas.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Recarregar
          </Button>
        </div>

        {demo && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm">
            <TriangleAlert className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium">Modo demonstração — dados fictícios de segurança</p>
              <p className="text-muted-foreground">
                A base de dados está indisponível ou vazia. As ações abaixo não são gravadas.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-[color:var(--brand,#1E5AA8)] hover:opacity-90" : ""}
            >
              {f === "todas" ? "Todas" : f[0]!.toUpperCase() + f.slice(1) + "s"} ({counts[f]})
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da ONG</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Província</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">A carregar…</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">Nenhuma ONG nesta categoria.</TableCell></TableRow>
                )}
                {!loading && rows.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="font-medium">{n.name}</div>
                      <div className="text-xs text-muted-foreground">{n.area_atuacao ?? "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{n.nif ?? "—"}</TableCell>
                    <TableCell className="text-sm">{n.provincia ?? "—"}</TableCell>
                    <TableCell><Badge variant={statusVariant(n.status)}>{n.status}</Badge></TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (n.document_url) {
                          if (/^https?:\/\//.test(n.document_url)) {
                            window.open(n.document_url, "_blank", "noopener");
                            return;
                          }
                          const { data, error } = await supabase.storage
                            .from("diarios-republica")
                            .createSignedUrl(n.document_url, 300);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
                          else { toast.error(error?.message ?? "Documento indisponível"); setDocNgo(n); }
                        } else setDocNgo(n);
                      }}>
                        <FileText className="h-4 w-4 mr-1" /> Ver Diário da República
                      </Button>
                    </TableCell>

                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === n.id || n.status === "aprovado"}
                          onClick={() => decide(n, "aprovado")}
                          className="bg-[color:var(--impact,#22A06B)] hover:opacity-90 text-white"
                        >
                          {busyId === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Aprovar</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === n.id || n.status === "rejeitado"}
                          onClick={() => decide(n, "rejeitado")}
                        >
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <BackendLog entries={logs} onClear={() => setLogs([])} />
      </div>

      <Dialog open={!!docNgo} onOpenChange={(o) => !o && setDocNgo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Diário da República · {docNgo?.name}</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border border-dashed bg-[color:var(--surface,#F6F8FA)] p-8 text-center space-y-2">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Pré-visualização simulada do PDF</p>
            <p className="text-xs text-muted-foreground">
              NIF {docNgo?.nif ?? "—"} · {docNgo?.provincia ?? "—"} · Estatuto publicado em Diário da República
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
