import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, MapPin, Clock, Wifi } from "lucide-react";

export type ProjectCardData = {
  id: string;
  title: string;
  description: string;
  skills: string[];
  provincia: string | null;
  remote: boolean;
  hours_per_week: number;
  duration_weeks: number | null;
  ngo: { name: string; status: string; area_atuacao: string } | null;
};

export function ProjectCard({
  project,
  applied,
  onApply,
  loading,
}: {
  project: ProjectCardData;
  applied?: boolean;
  onApply?: () => void;
  loading?: boolean;
}) {
  const verified = project.ngo?.status === "aprovado";
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{project.title}</CardTitle>
          {project.ngo?.area_atuacao && (
            <Badge variant="secondary" className="shrink-0">{project.ngo.area_atuacao}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{project.ngo?.name ?? "ONG"}</span>
          {verified && (
            <span className="inline-flex items-center gap-1 text-[color:var(--brand)] text-xs font-medium">
              <BadgeCheck className="h-4 w-4" /> Verificada
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {project.skills.map((s) => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            {project.remote ? <><Wifi className="h-3.5 w-3.5" /> Remoto</> : <><MapPin className="h-3.5 w-3.5" /> {project.provincia}</>}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {project.hours_per_week}h/sem
            {project.duration_weeks ? ` · ${project.duration_weeks} sem` : ""}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90"
          onClick={onApply}
          disabled={applied || loading}
        >
          {applied ? "Candidatura enviada" : loading ? "A enviar…" : "Candidatar-me"}
        </Button>
      </CardFooter>
    </Card>
  );
}
