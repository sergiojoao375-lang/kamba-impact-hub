import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { COMPETENCIAS, PROVINCIAS_ANGOLA } from "@/lib/angola";
import { Check } from "lucide-react";

export function VolunteerOnboarding() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<string[]>([]);
  const [provincia, setProvincia] = useState("");
  const [link, setLink] = useState("");

  const toggle = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = () => {
    if (!skills.length || !provincia) {
      toast.error("Selecione ao menos uma competência e a sua província.");
      return;
    }
    toast.success("Perfil criado! A abrir vagas Pro Bono…");
    navigate({ to: "/app/feed" });
  };


  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base">Suas competências</Label>
        <p className="text-sm text-muted-foreground mt-0.5">Escolha as áreas em que pode contribuir Pro Bono.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMPETENCIAS.map((c) => {
            const active = skills.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                    : "bg-white hover:border-[color:var(--brand)]"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />} {c}
              </button>
            );
          })}
        </div>
        {skills.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{skills.length} competência(s) selecionada(s)</p>
        )}
      </div>

      <div>
        <Label htmlFor="portfolio">Portfólio ou LinkedIn</Label>
        <Input
          id="portfolio"
          placeholder="https://linkedin.com/in/seu-perfil"
          className="mt-1.5"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <Label>Província</Label>
        <Select value={provincia} onValueChange={setProvincia}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Selecione a sua província" />
          </SelectTrigger>
          <SelectContent>
            {PROVINCIAS_ANGOLA.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-[color:var(--surface)] p-4">
        <p className="text-sm font-medium">Resumo do perfil</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
          {provincia && <Badge className="bg-[color:var(--impact)] text-white">{provincia}</Badge>}
          {!skills.length && !provincia && (
            <span className="text-xs text-muted-foreground">Nada preenchido ainda.</span>
          )}
        </div>
      </div>

      <Button onClick={submit} className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90" size="lg">
        Concluir cadastro e ver vagas
      </Button>
    </div>
  );
}
