import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Valores médios estimados de mercado por hora em Angola (Kz).
 * Usados como fallback caso a tabela `skill_rates` esteja indisponível.
 */
export const FALLBACK_RATES_KZ: Record<string, number> = {
  Design: 5000,
  Contabilidade: 7000,
  "Programação": 10000,
  Marketing: 6000,
  "Gestão": 8000,
  Direito: 9000,
  "Educação": 4500,
  "Saúde": 8500,
  "Tradução": 4000,
  "Comunicação": 5500,
};

export const DEFAULT_RATE_KZ = 5000;

export async function loadRates(supabase: SupabaseClient<any>): Promise<Record<string, number>> {
  const { data } = await supabase.from("skill_rates").select("skill,hourly_rate_kz");
  if (!data || data.length === 0) return { ...FALLBACK_RATES_KZ };
  const map: Record<string, number> = {};
  for (const r of data as { skill: string; hourly_rate_kz: number }[]) {
    map[r.skill] = Number(r.hourly_rate_kz);
  }
  return map;
}

/** Escolhe a taxa média das competências do projeto (ou o valor padrão). */
export function rateForSkills(skills: string[], rates: Record<string, number>): number {
  const known = skills.map((s) => rates[s]).filter((v): v is number => typeof v === "number" && v > 0);
  if (known.length === 0) return rates["__default__"] ?? DEFAULT_RATE_KZ;
  return known.reduce((a, b) => a + b, 0) / known.length;
}

export type ImpactResult = {
  projectId: string;
  totalHours: number;
  hourlyRateKz: number;
  valueKz: number;
  volunteers: number;
  mainSkill: string | null;
};

/**
 * Calcula e persiste o Valor Pro Bono Equivalente de um projeto finalizado.
 * Total de horas (tarefas concluídas) x valor médio/hora da competência.
 */
export async function computeAndSaveImpact(
  supabase: SupabaseClient<any>,
  userId: string,
  projectId: string,
): Promise<ImpactResult> {
  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,ngo_id,created_by,skills")
    .eq("id", projectId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!project) throw new Error("Projeto não encontrado");
  if (project.created_by !== userId) throw new Error("Apenas a ONG responsável pode finalizar este projeto");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("hours_logged,column_name")
    .eq("project_id", projectId);
  const totalHours = (tasks ?? [])
    .filter((t: any) => t.column_name === "concluido")
    .reduce((sum: number, t: any) => sum + Number(t.hours_logged ?? 0), 0);

  const { data: apps } = await supabase
    .from("applications")
    .select("volunteer_id")
    .eq("project_id", projectId)
    .eq("status", "aprovado");
  const volunteerIds = Array.from(new Set((apps ?? []).map((a: any) => a.volunteer_id as string)));

  let companyId: string | null = null;
  if (volunteerIds.length) {
    const { data: profs } = await supabase.from("profiles").select("company_id").in("id", volunteerIds);
    companyId = (profs ?? []).map((p: any) => p.company_id).find((c: string | null) => !!c) ?? null;
  }

  const rates = await loadRates(supabase);
  const skills: string[] = project.skills ?? [];
  const hourlyRateKz = rateForSkills(skills, rates);
  const valueKz = Math.round(totalHours * hourlyRateKz);

  const { error: upErr } = await supabase.from("project_impact").upsert(
    {
      project_id: projectId,
      ngo_id: project.ngo_id,
      company_id: companyId,
      total_hours: totalHours,
      hourly_rate_kz: hourlyRateKz,
      value_kz: valueKz,
      volunteers_count: volunteerIds.length,
      main_skill: skills[0] ?? null,
      closed_at: new Date().toISOString(),
    },
    { onConflict: "project_id" },
  );
  if (upErr) throw new Error(upErr.message);

  const { error: stErr } = await supabase.from("projects").update({ status: "concluido" }).eq("id", projectId);
  if (stErr) throw new Error(stErr.message);

  return {
    projectId,
    totalHours,
    hourlyRateKz,
    valueKz,
    volunteers: volunteerIds.length,
    mainSkill: skills[0] ?? null,
  };
}
