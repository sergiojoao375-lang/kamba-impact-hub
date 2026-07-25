import { createFileRoute, Outlet } from "@tanstack/react-router";

// Modo DEMO: acesso destravado para permitir teste end-to-end do MVP no Preview.
// Em produção, restaurar o gate com supabase.auth.getUser() + redirect("/auth").
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
