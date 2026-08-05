import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const finalizeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => {
    if (!input?.projectId || typeof input.projectId !== "string") throw new Error("projectId inválido");
    return { projectId: input.projectId };
  })
  .handler(async ({ data, context }) => {
    const { computeAndSaveImpact } = await import("@/lib/impact.server");
    return computeAndSaveImpact(context.supabase as any, context.userId, data.projectId);
  });
