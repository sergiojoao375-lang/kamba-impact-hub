/**
 * WhatsApp Business API — Simulação (Fase 4)
 *
 * Esta camada centraliza os gatilhos de notificação por WhatsApp para números
 * angolanos (+244). Em produção, substituir `simulateSend` por uma chamada
 * a um server function que invoque a WhatsApp Cloud API (Meta) ou Twilio
 * WhatsApp Business, usando templates aprovados como:
 *   - kamba_new_match      → "Nova vaga compatível com o seu perfil"
 *   - kamba_approved       → "A sua candidatura foi aprovada 🎉"
 *
 * Fluxo real recomendado:
 *   1. Guardar `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_ID` via add_secret.
 *   2. createServerFn POST → https://graph.facebook.com/v20.0/{PHONE_ID}/messages
 *   3. Body: { messaging_product: "whatsapp", to, type: "template",
 *              template: { name, language: { code: "pt_PT" }, components: [...] } }
 *   4. Chamar a partir de um trigger Postgres (pg_net) ou de dentro de
 *      `notifyMatch` / `notifyApproved` abaixo.
 */

export type WhatsAppTemplate = "new_match" | "approved" | "otp" | "ngo_approved";

interface SendArgs {
  phone: string; // formato E.164 sem "+", ex.: 244923456789
  template: WhatsAppTemplate;
  params?: Record<string, string>;
}

function simulateSend({ phone, template, params }: SendArgs) {
  // Simulação visual — em dev aparece na consola do browser/servidor.
  // eslint-disable-next-line no-console
  console.info(
    `[WhatsApp • simulado] → +${phone}\n  template: ${template}\n  params:`,
    params ?? {},
  );
}

/** Match de nova vaga compatível com skills/província do voluntário. */
export async function notifyMatch(phone: string, projectTitle: string, ngoName: string) {
  simulateSend({
    phone,
    template: "new_match",
    params: { projectTitle, ngoName },
  });
  // TODO(produção): await sendWhatsAppTemplate(...)
}

/** Voluntário aprovado numa candidatura. */
export async function notifyApproved(phone: string, projectTitle: string, ngoName: string) {
  simulateSend({
    phone,
    template: "approved",
    params: { projectTitle, ngoName },
  });
  // TODO(produção): await sendWhatsAppTemplate(...)
}

/** OTP de 6 dígitos enviado no login por telefone. */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp(phone: string, code: string) {
  simulateSend({ phone, template: "otp", params: { code } });
}
