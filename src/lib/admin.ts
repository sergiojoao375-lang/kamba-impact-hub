import { supabase } from "@/integrations/supabase/client";
import { notify } from "@/components/kamba/NotificationsBell";
import { notifyNgoApproved } from "@/lib/whatsapp";

export type BackendLogEntry = {
  id: string;
  at: string;
  label: string;
  detail: string;
  ms: number;
  ok: boolean;
};

export type NgoRow = {
  id: string;
  name: string;
  nif: string | null;
  phone: string | null;
  provincia: string | null;
  area_atuacao: string | null;
  document_url: string | null;
  status: string;
  created_by: string;
  created_at: string;
};

let seq = 0;
function entry(label: string, detail: string, ms: number, ok: boolean): BackendLogEntry {
  seq += 1;
  return {
    id: `log-${Date.now()}-${seq}`,
    at: new Date().toLocaleTimeString("pt-PT"),
    label,
    detail,
    ms,
    ok,
  };
}

async function timed<T>(
  label: string,
  detail: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; log: BackendLogEntry; error: unknown }> {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    return { result, log: entry(label, detail, ms, true), error: null };
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    return { result: null, log: entry(label, detail, ms, false), error };
  }
}

/**
 * Decisão de verificação de uma ONG (Painel Admin).
 *
 * Encadeia três operações de backend e devolve os logs de cada requisição
 * para o monitor visual (`BackendLog`):
 *   1. UPDATE public.ngos SET status = ...
 *   2. INSERT public.notifications (alerta interno para o criador da ONG)
 *   3. WhatsApp Business API (Fase 4) — apenas em aprovações
 */
export async function decideNgo(
  ngo: NgoRow,
  status: "aprovado" | "rejeitado",
): Promise<{ ok: boolean; logs: BackendLogEntry[]; message: string }> {
  const logs: BackendLogEntry[] = [];

  const upd = await timed(
    "UPDATE ngos",
    `SET status = '${status}' WHERE id = '${ngo.id}'`,
    async () => {
      const { error } = await supabase.from("ngos").update({ status }).eq("id", ngo.id);
      if (error) throw error;
      return true;
    },
  );
  logs.push(upd.log);
  if (upd.error) {
    return {
      ok: false,
      logs,
      message: (upd.error as { message?: string })?.message ?? "Falha ao atualizar a ONG",
    };
  }

  const notifyLog = await timed(
    "INSERT notifications",
    `user_id = '${ngo.created_by}' · kind = 'ngo_status'`,
    async () => {
      await notify(
        ngo.created_by,
        "ngo_status",
        status === "aprovado" ? "ONG aprovada 🎉" : "ONG rejeitada",
        ngo.name,
        "/app/ngo",
      );
      return true;
    },
  );
  logs.push(notifyLog.log);

  if (status === "aprovado") {
    const waLog = await timed(
      "WHATSAPP send",
      ngo.phone
        ? `template = 'ngo_approved' → +${ngo.phone}`
        : "ignorado — ONG sem telefone registado",
      async () => {
        if (ngo.phone) await notifyNgoApproved(ngo.phone, ngo.name);
        return true;
      },
    );
    logs.push(waLog.log);
  }

  return {
    ok: true,
    logs,
    message: status === "aprovado" ? "ONG aprovada" : "ONG rejeitada",
  };
}

/** Dados fictícios de segurança para quando o backend estiver indisponível. */
export const DEMO_NGOS: NgoRow[] = [
  {
    id: "demo-ngo-1",
    name: "Fundação Kubuka Angola",
    nif: "5417896321",
    phone: "244923000111",
    provincia: "Luanda",
    area_atuacao: "Educação",
    document_url: null,
    status: "pendente",
    created_by: "demo-user-1",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-ngo-2",
    name: "Associação Mãos do Namibe",
    nif: "5000123987",
    phone: "244912555444",
    provincia: "Namibe",
    area_atuacao: "Ambiente",
    document_url: null,
    status: "pendente",
    created_by: "demo-user-2",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-ngo-3",
    name: "Rede Jovem do Huambo",
    nif: "5432198760",
    phone: "244933777222",
    provincia: "Huambo",
    area_atuacao: "Juventude",
    document_url: null,
    status: "aprovado",
    created_by: "demo-user-3",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-ngo-4",
    name: "Solidariedade Cabinda",
    nif: "5111222333",
    phone: "244924888999",
    provincia: "Cabinda",
    area_atuacao: "Assistência Social",
    document_url: null,
    status: "rejeitado",
    created_by: "demo-user-4",
    created_at: new Date().toISOString(),
  },
];
