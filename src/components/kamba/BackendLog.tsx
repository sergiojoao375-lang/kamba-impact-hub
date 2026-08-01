import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, Eraser } from "lucide-react";
import type { BackendLogEntry } from "@/lib/admin";

export function BackendLog({
  entries,
  onClear,
}: {
  entries: BackendLogEntry[];
  onClear: () => void;
}) {
  return (
    <section className="rounded-xl border bg-[color:var(--surface,#F6F8FA)]">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4 text-[color:var(--brand,#1E5AA8)]" />
          Monitor de requisições ao backend
          <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear} disabled={entries.length === 0}>
          <Eraser className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </header>
      <div className="max-h-56 overflow-y-auto p-3 font-mono text-xs">
        {entries.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhuma requisição ainda. Aprove ou rejeite uma ONG para ver os pedidos enviados.
          </p>
        ) : (
          <ul className="space-y-1">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-muted-foreground">{e.at}</span>
                <span className={e.ok ? "text-[color:var(--impact,#22A06B)]" : "text-destructive"}>
                  {e.ok ? "OK " : "ERRO"}
                </span>
                <span className="font-semibold">{e.label}</span>
                <span className="text-muted-foreground">{e.detail}</span>
                <span className="text-muted-foreground">· {e.ms}ms</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
