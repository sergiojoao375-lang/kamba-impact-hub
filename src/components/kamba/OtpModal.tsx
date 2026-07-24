import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { generateOtp, sendOtp } from "@/lib/whatsapp";

export function OtpModal({
  open, onOpenChange, phone, onSuccess,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  phone: string;
  onSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [expected, setExpected] = useState<string>("");
  const canSubmit = code.length === 6;

  // Fase 4 · Simulação de OTP via WhatsApp Business API
  useEffect(() => {
    if (!open) { setCode(""); return; }
    const otp = generateOtp();
    setExpected(otp);
    // Em produção → server function POST /messages (template kamba_otp)
    sendOtp(`244${phone}`, otp);
    // Dica visível apenas em ambiente de desenvolvimento
    toast.info(`[DEV] Código simulado: ${otp}`, { duration: 8000 });
  }, [open, phone]);

  const submit = () => {
    if (code !== expected) {
      toast.error("Código incorreto. Tente novamente.");
      return;
    }
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--impact)]/15">
            <MessageCircle className="h-6 w-6 text-[color:var(--impact)]" />
          </div>
          <DialogTitle className="text-center">Confirme o código</DialogTitle>
          <DialogDescription className="text-center">
            Enviámos um código de 6 dígitos via <strong>WhatsApp</strong> para <br />
            <span className="font-medium text-foreground">+244 {phone}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          disabled={!canSubmit}
          onClick={submit}
          className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90"
        >
          Validar código
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Não recebeu? <button className="text-[color:var(--brand)] underline">Reenviar em 30s</button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
