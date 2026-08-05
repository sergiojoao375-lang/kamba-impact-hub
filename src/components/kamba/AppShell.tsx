import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, Briefcase, LogOut, ShieldCheck, User, Building2, Award } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NotificationsBell } from "./NotificationsBell";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--surface)]">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 gap-2">
          <Link to="/app/feed"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link to="/app/feed" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
              <Briefcase className="h-4 w-4" /> Vagas
            </Link>
            <Link to="/app/ngo" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
              <LayoutGrid className="h-4 w-4" /> Painel ONG
            </Link>
            <Link to="/app/esg" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
              <Building2 className="h-4 w-4" /> Portal ESG
            </Link>
            {isAdmin && (
              <Link to="/app/admin" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            {uid && (
              <Link to="/volunteer/$userId" params={{ userId: uid }}>
                <Button variant="ghost" size="icon" title="O meu perfil"><User className="h-5 w-5" /></Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
