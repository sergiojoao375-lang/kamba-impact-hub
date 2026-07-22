import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, Briefcase, LogOut } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };
  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--surface)]">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/app/feed"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <Link to="/app/feed" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
              <Briefcase className="h-4 w-4" /> Vagas
            </Link>
            <Link to="/app/ngo" className="inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted" activeProps={{ className: "bg-muted font-medium" }}>
              <LayoutGrid className="h-4 w-4" /> Painel ONG
            </Link>
          </nav>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
