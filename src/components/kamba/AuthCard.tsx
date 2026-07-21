import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { OtpModal } from "./OtpModal";
import { Mail, Phone } from "lucide-react";

export function AuthCard({ defaultRole }: { defaultRole?: "volunteer" | "ngo" }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);

  const phoneValid = /^9\d{8}$/.test(phone);

  const goOnboarding = () => {
    navigate({ to: "/onboarding", search: { role: defaultRole ?? "volunteer" } });
  };

  return (
    <>
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-center">Entrar no Kamba Social</h1>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {defaultRole === "ngo" ? "Cadastro de ONG / Empresa" : "Junte-se como voluntário Pro Bono"}
        </p>

        <div className="mt-6 grid gap-2">
          <Button variant="outline" className="w-full justify-center gap-2" onClick={goOnboarding}>
            <GoogleIcon /> Entrar com o Google
          </Button>
          <Button variant="outline" className="w-full justify-center gap-2" onClick={goOnboarding}>
            <LinkedInIcon /> Entrar com o LinkedIn
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" /> OU <Separator className="flex-1" />
        </div>

        <Tabs defaultValue="phone">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="phone"><Phone className="h-3.5 w-3.5 mr-1.5" />Telefone</TabsTrigger>
            <TabsTrigger value="email"><Mail className="h-3.5 w-3.5 mr-1.5" />E-mail</TabsTrigger>
          </TabsList>

          <TabsContent value="phone" className="mt-4 space-y-3">
            <div>
              <Label htmlFor="tel">Número de telefone</Label>
              <div className="mt-1.5 flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring">
                <span className="pl-3 pr-2 text-sm text-muted-foreground border-r py-2">+244</span>
                <Input
                  id="tel"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="9XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="border-0 focus-visible:ring-0 shadow-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                9 dígitos, começando por 9 (padrão Angola).
              </p>
            </div>
            <Button
              disabled={!phoneValid}
              onClick={() => setOtpOpen(true)}
              className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90"
            >
              Receber código via WhatsApp
            </Button>
          </TabsContent>

          <TabsContent value="email" className="mt-4 space-y-3">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="voce@exemplo.ao" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="pwd">Palavra-passe</Label>
              <Input id="pwd" type="password" placeholder="••••••••" className="mt-1.5" />
            </div>
            <Button onClick={goOnboarding} className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
              Continuar
            </Button>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, aceita os Termos e a Política de Privacidade, conforme a Lei n.º 17/21.
        </p>
      </div>

      <OtpModal
        open={otpOpen}
        onOpenChange={setOtpOpen}
        phone={phone}
        onSuccess={() => {
          setOtpOpen(false);
          goOnboarding();
        }}
      />
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.5 2.4-6.9 2.4-5.4 0-9.9-3.1-11.3-7.5l-6.6 5.1C9.6 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2.1-2 3.9-3.6 5.2l6 4.9c-.4.4 6.3-4.6 6.3-14.1 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.44-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  );
}
