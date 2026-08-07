import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, Briefcase, LogOut, ShieldCheck, User, Building2, Award, Gauge, Menu } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NotificationsBell } from "./NotificationsBell";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useLiteMode } from "@/lib/lite-mode";
import { toast } from "sonner";

const NAV = [
  { to: "/app/feed", label: "Vagas", icon: Briefcase },
  { to: "/app/ngo", label: "Painel ONG", icon: LayoutGrid },
  { to: "/app/esg", label: "Portal ESG", icon: Building2 },
  { to: "/app/test-certificate", label: "Certificado", icon: Award },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [lite, setLite] = useLiteMode();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      setUid(id);
      if (id) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", id);
        setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
      }
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const liteToggle = (
    <div className="flex items-center gap-2 rounded-md border px-2 py-1.5">
      <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
      <Label htmlFor="lite-mode" className="text-xs cursor-pointer">Dados Leves</Label>
      <Switch
        id="lite-mode"
        checked={lite}
        onCheckedChange={(v) => {
          setLite(v);
          toast.success(v ? "Modo poupança de dados activado" : "Modo completo activado");
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--surface)]">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4">
          <Link to="/app/feed" className="shrink-0"><Logo /></Link>

          <nav className="hidden lg:flex items-center justify-center gap-1 text-sm min-w-0">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted whitespace-nowrap" activeProps={{ className: "bg-muted font-medium" }}>
                <Icon className="h-4 w-4 shrink-0" /> {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/app/admin" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted whitespace-nowrap" activeProps={{ className: "bg-muted font-medium" }}>
                <ShieldCheck className="h-4 w-4 shrink-0" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex items-center justify-end gap-1">
            <div className="hidden xl:flex mr-1">{liteToggle}</div>
            <NotificationsBell />
            {uid && (
              <Link to="/volunteer/$userId" params={{ userId: uid }} className="hidden sm:inline-flex">
                <Button variant="ghost" size="icon" title="O meu perfil"><User className="h-5 w-5" /></Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden lg:inline-flex">
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(88vw,320px)] p-0">
                <SheetHeader className="px-4 py-4 border-b text-left">
                  <SheetTitle><Logo /></SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-3 gap-1 text-sm">
                  {NAV.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted"
                      activeProps={{ className: "bg-muted font-medium" }}
                    >
                      <Icon className="h-4 w-4 shrink-0" /> {label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link to="/app/admin" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
                      <ShieldCheck className="h-4 w-4 shrink-0" /> Admin
                    </Link>
                  )}
                  {uid && (
                    <Link to="/volunteer/$userId" params={{ userId: uid }} onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted">
                      <User className="h-4 w-4 shrink-0" /> O meu perfil
                    </Link>
                  )}
                </nav>
                <div className="px-4 pb-4 space-y-3">
                  {liteToggle}
                  <Button variant="outline" className="w-full" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8 pb-24">{children}</div>
      </main>
    </div>
  );
}
