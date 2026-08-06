import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/kamba/AppShell";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Briefcase, Building2, Clock, Code2, Coins, Copy, Download, GraduationCap, HeartHandshake, Trophy, Users } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useLiteMode } from "@/lib/lite-mode";
import { TALENT_POOL } from "@/lib/internships";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/app/esg")({
  head: () => ({
    meta: [
      { title: "Portal ESG · Kamba Social" },
      { name: "description", content: "Dashboard ESG para empresas parceiras: valor pro bono em Kz, horas dedicadas, ODS e balanço social." },
      { property: "og:title", content: "Portal ESG · Kamba Social" },
      { property: "og:description", content: "Balanço social corporativo com métricas em Kwanzas e alinhamento com as ODS da ONU." },
    ],
  }),
  component: EsgDashboard,
});

// KPIs de referência (fallback de demonstração quando ainda não há projetos concluídos).
const KPIS_DEMO = {
  valorPro: 42_850_000, // Kz
  horas: 3_420,
  colaboradores: 128,
  ongs: 17,
};


const ODS_DATA = [
  { name: "ODS 4 · Educação", value: 38, color: "#C5192D" },
  { name: "ODS 8 · Trabalho Decente", value: 34, color: "#A21942" },
  { name: "ODS 9 · Indústria e Inovação", value: 18, color: "#FD6925" },
  { name: "ODS 10 · Redução Desigualdades", value: 10, color: "#DD1367" },
];

const DEPT_DATA = [
  { dept: "Tecnologia", horas: 980 },
  { dept: "Marketing", horas: 620 },
  { dept: "Finanças", horas: 540 },
  { dept: "RH", horas: 410 },
  { dept: "Jurídico", horas: 380 },
  { dept: "Operações", horas: 490 },
];

const COLABORADORES = [
  { nome: "Ana Miguel", dept: "Tecnologia", projeto: "Plataforma Escolas Rurais", ong: "Educar Angola", horas: 42, status: "Ativo" },
  { nome: "Bruno Cangombe", dept: "Marketing", projeto: "Campanha Água Potável", ong: "Kubinga", horas: 28, status: "Ativo" },
  { nome: "Célia Fortunato", dept: "Finanças", projeto: "Auditoria Pro Bono", ong: "Mãos Dadas", horas: 35, status: "Ativo" },
  { nome: "Diogo Sanjuluca", dept: "Jurídico", projeto: "Assessoria APD", ong: "Justiça em Rede", horas: 18, status: "Concluído" },
  { nome: "Eunice Baptista", dept: "RH", projeto: "Capacitação Jovens", ong: "Futuro Angola", horas: 24, status: "Ativo" },
];

const fmtKz = (n: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

type Kpis = typeof KPIS_DEMO;

function exportPdf(KPIS: Kpis) {
  const doc = new jsPDF();
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255);
  doc.setFontSize(16);
  doc.text("Kamba Social · Relatório ESG", 14, 18);

  doc.setTextColor(20);
  doc.setFontSize(11);
  doc.text(`Emitido em ${new Date().toLocaleDateString("pt-AO")}`, 14, 40);

  doc.setFontSize(14);
  doc.text("Balanço de Impacto Social", 14, 54);
  doc.setFontSize(11);
  const lines = [
    `Valor Pro Bono Equivalente: ${fmtKz(KPIS.valorPro)}`,
    `Total de Horas Dedicadas: ${KPIS.horas.toLocaleString("pt-AO")} h`,
    `Colaboradores Ativos: ${KPIS.colaboradores}`,
    `ONGs Apoiadas: ${KPIS.ongs}`,
  ];

  lines.forEach((l, i) => doc.text(l, 14, 66 + i * 8));

  doc.setFontSize(14);
  doc.text("Alinhamento com ODS da ONU", 14, 108);
  doc.setFontSize(11);
  ODS_DATA.forEach((o, i) => doc.text(`• ${o.name} — ${o.value}%`, 18, 118 + i * 7));

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "Documento gerado pela plataforma Kamba Social · Conformidade Lei n.º 17/21 (APD Angola)",
    14, 285,
  );

  doc.save(`relatorio-esg-kamba-${Date.now()}.pdf`);
  toast.success("Relatório ESG exportado");
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[color:var(--brand)]/10 flex items-center justify-center text-[color:var(--brand)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EsgDashboard() {
  const [KPIS, setKpis] = useState<Kpis>(KPIS_DEMO);
  const [live, setLive] = useState(false);
  const [lite] = useLiteMode();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("project_impact")
        .select("total_hours,value_kz,volunteers_count,ngo_id");
      const rows = data ?? [];
      if (!rows.length) return;
      setKpis({
        valorPro: rows.reduce((s, r) => s + Number(r.value_kz ?? 0), 0),
        horas: rows.reduce((s, r) => s + Number(r.total_hours ?? 0), 0),
        colaboradores: rows.reduce((s, r) => s + Number(r.volunteers_count ?? 0), 0),
        ongs: new Set(rows.map((r) => r.ngo_id)).size,
      });
      setLive(true);
    })();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                <Building2 className="h-3 w-3 mr-1" /> Portal Corporativo
              </Badge>
              <Badge variant="outline">ESG · Balanço Social</Badge>
              <Badge variant={live ? "default" : "secondary"}>{live ? "Dados reais" : "Demonstração"}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-semibold">Impacto da sua Empresa</h1>
            <p className="text-sm text-muted-foreground">
              Meça o retorno social do voluntariado corporativo — em Kwanzas, horas e ODS.
            </p>
          </div>
          <Button onClick={() => exportPdf(KPIS)} className="bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
            <Download className="h-4 w-4 mr-2" /> Exportar Relatório ESG (PDF)
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={Coins} label="Valor Pro Bono" value={fmtKz(KPIS.valorPro)} hint="Equivalente em Kz" />
          <Kpi icon={Clock} label="Horas Dedicadas" value={`${KPIS.horas.toLocaleString("pt-AO")} h`} hint="Este ano" />
          <Kpi icon={Users} label="Colaboradores Ativos" value={String(KPIS.colaboradores)} />
          <Kpi icon={HeartHandshake} label="ONGs Apoiadas" value={String(KPIS.ongs)} />
        </div>


        {lite ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Alinhamento com ODS da ONU</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Objetivo</TableHead><TableHead className="text-right">Peso</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {ODS_DATA.map((o) => (
                      <TableRow key={o.name}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="text-right font-semibold">{o.value}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Horas por Departamento</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Departamento</TableHead><TableHead className="text-right">Horas</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEPT_DATA.map((d) => (
                      <TableRow key={d.dept}>
                        <TableCell className="font-medium">{d.dept}</TableCell>
                        <TableCell className="text-right font-semibold">{d.horas} h</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Alinhamento com ODS da ONU</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ODS_DATA} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {ODS_DATA.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Horas por Departamento</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPT_DATA}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="dept" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        )}

        <TalentPool />
        <ImpactBadge horas={KPIS.horas} valor={KPIS.valorPro} />


        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Colaboradores em Projetos Pro Bono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>ONG</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COLABORADORES.map((c) => (
                  <TableRow key={c.nome}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.dept}</TableCell>
                    <TableCell>{c.projeto}</TableCell>
                    <TableCell>{c.ong}</TableCell>
                    <TableCell className="text-right">{c.horas} h</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "Ativo" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Dados de demonstração. Em produção, os KPIs são agregados a partir das candidaturas aprovadas
          e das horas registadas nas tarefas Kanban dos colaboradores da empresa parceira.
        </p>
      </div>
    </AppShell>
  );
}
