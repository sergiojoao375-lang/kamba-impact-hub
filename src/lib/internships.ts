export type InternshipLevel = "Ensino Médio" | "Universitário";

export type Internship = {
  id: string;
  title: string;
  company: string;
  level: InternshipLevel;
  provincia: string;
  stipend_kz: number;
  duration_months: number;
  area: string;
  points_required: number;
};

export const DEMO_INTERNSHIPS: Internship[] = [
  {
    id: "est-1",
    title: "Estagiário de Desenvolvimento Web",
    company: "Angotech Solutions",
    level: "Universitário",
    provincia: "Luanda",
    stipend_kz: 120_000,
    duration_months: 6,
    area: "Programação",
    points_required: 100,
  },
  {
    id: "est-2",
    title: "Assistente de Marketing Digital",
    company: "Banco Kwanza Invest",
    level: "Universitário",
    provincia: "Luanda",
    stipend_kz: 95_000,
    duration_months: 4,
    area: "Marketing",
    points_required: 80,
  },
  {
    id: "est-3",
    title: "Apoio Administrativo Júnior",
    company: "Sonafro Logística",
    level: "Ensino Médio",
    provincia: "Benguela",
    stipend_kz: 55_000,
    duration_months: 3,
    area: "Gestão",
    points_required: 40,
  },
  {
    id: "est-4",
    title: "Estagiário de Design Gráfico",
    company: "Agência Muxima",
    level: "Ensino Médio",
    provincia: "Huíla",
    stipend_kz: 60_000,
    duration_months: 5,
    area: "Design",
    points_required: 50,
  },
];

export type Medal = { name: string; emoji: string; hint: string };

/** Gamificação: 25 pontos por projeto concluído + 2 pontos por hora registada. */
export function computePoints(projectsDone: number, hours: number) {
  return projectsDone * 25 + Math.round(hours * 2);
}

export function medalsFor(projectsDone: number, hours: number): Medal[] {
  const medals: Medal[] = [];
  if (projectsDone >= 1) medals.push({ name: "Primeiro Impacto", emoji: "🥉", hint: "1 projeto concluído" });
  if (projectsDone >= 3) medals.push({ name: "Kamba Dedicado", emoji: "🥈", hint: "3 projetos concluídos" });
  if (projectsDone >= 5) medals.push({ name: "Embaixador Social", emoji: "🥇", hint: "5 projetos concluídos" });
  if (hours >= 40) medals.push({ name: "40 Horas Pro Bono", emoji: "⏱️", hint: "40h doadas" });
  if (hours >= 100) medals.push({ name: "Centurião", emoji: "🏆", hint: "100h doadas" });
  return medals;
}

export const fmtKz = (n: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

/** Banco de talentos (demonstração) — ranking nacional de voluntários. */
export const TALENT_POOL = [
  { nome: "Mário António", provincia: "Luanda", competencia: "Design Gráfico", horas: 128, projetos: 6, nivel: "Universitário" },
  { nome: "Ana Miguel", provincia: "Luanda", competencia: "Programação", horas: 112, projetos: 5, nivel: "Universitário" },
  { nome: "Célia Fortunato", provincia: "Benguela", competencia: "Contabilidade", horas: 94, projetos: 4, nivel: "Universitário" },
  { nome: "Bruno Cangombe", provincia: "Huíla", competencia: "Marketing", horas: 76, projetos: 4, nivel: "Ensino Médio" },
  { nome: "Eunice Baptista", provincia: "Huambo", competencia: "Gestão", horas: 61, projetos: 3, nivel: "Ensino Médio" },
  { nome: "Diogo Sanjuluca", provincia: "Cabinda", competencia: "Direito", horas: 48, projetos: 2, nivel: "Universitário" },
].map((v) => ({ ...v, pontos: computePoints(v.projetos, v.horas) }));
