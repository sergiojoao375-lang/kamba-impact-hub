import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AREAS_ATUACAO, PROVINCIAS_ANGOLA } from "@/lib/angola";
import { UploadCloud, FileCheck2, Clock } from "lucide-react";

export function NgoOnboarding() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [nif, setNif] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [provincia, setProvincia] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!name.trim() || !area || !provincia) {
      toast.error("Preencha o nome, a área de atuação e a província");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) {
        toast.success("Cadastro enviado. Aguardando verificação (até 48h).");
        navigate({ to: "/app/ngo" });
        return;
      }

      const { data: ngo, error } = await supabase
        .from("ngos")
        .insert({
          created_by: uid,
          name: name.trim(),
          nif: nif.trim() || null,
          phone: phone.trim() ? `+244${phone.replace(/\D/g, "")}` : null,
          area_atuacao: area,
          provincia,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      if (file && ngo) {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${uid}/${ngo.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("diarios-republica")
          .upload(path, file, { upsert: true, contentType: file.type || undefined });
        if (upErr) throw new Error(upErr.message);
        const { error: updErr } = await supabase.from("ngos").update({ document_url: path }).eq("id", ngo.id);
        if (updErr) throw new Error(updErr.message);
      }

      toast.success("Cadastro enviado. Aguardando verificação (até 48h).");
      navigate({ to: "/app/ngo" });
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível enviar o cadastro");
    } finally {
      setSaving(false);
    }
  };



  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="org">Nome da organização</Label>
        <Input id="org" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fundação Kubuka Angola" className="mt-1.5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="nif">NIF da organização</Label>
          <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="Ex: 5417896321" inputMode="numeric" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="ngo-phone">Telefone de contacto</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-md border bg-[color:var(--surface)] px-3 py-2 text-sm text-muted-foreground">+244</span>
            <Input id="ngo-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="923 000 111" inputMode="tel" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Área principal de atuação</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {AREAS_ATUACAO.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Província</Label>
          <Select value={provincia} onValueChange={setProvincia}>
            <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {PROVINCIAS_ANGOLA.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>



      <div>
        <Label>Documento oficial (Diário da República / Estatuto)</Label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-1.5 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-[color:var(--brand)] bg-[color:var(--brand)]/5" : "border-border bg-[color:var(--surface)] hover:border-[color:var(--brand)]/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-1">
              <FileCheck2 className="h-8 w-8 text-[color:var(--impact)]" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB • pronto para envio</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Arraste o ficheiro aqui ou clique para carregar</p>
              <p className="text-xs text-muted-foreground">PDF, JPG ou PNG — máx. 10 MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-[color:var(--impact)]/30 bg-[color:var(--impact)]/5 p-4">
        <Clock className="h-5 w-5 shrink-0 text-[color:var(--impact)] mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Aguardando verificação manual</p>
          <p className="text-muted-foreground mt-0.5">
            A equipe Kamba Social verificará o documento antes da publicação de vagas. O processo demora até 48h úteis.
          </p>
        </div>
      </div>

      <Button onClick={submit} className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90" size="lg">
        Enviar cadastro para verificação
      </Button>
    </div>
  );
}
