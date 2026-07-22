
CREATE TYPE public.project_status AS ENUM ('aberto', 'em_andamento', 'concluido', 'cancelado');
CREATE TYPE public.application_status AS ENUM ('pendente', 'aprovado', 'rejeitado');
CREATE TYPE public.task_column AS ENUM ('a_fazer', 'em_progresso', 'concluido');

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  provincia TEXT,
  remote BOOLEAN NOT NULL DEFAULT false,
  hours_per_week INTEGER NOT NULL DEFAULT 0,
  duration_weeks INTEGER,
  status public.project_status NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view open projects"
  ON public.projects FOR SELECT TO authenticated
  USING (status = 'aberto' OR created_by = auth.uid());

CREATE POLICY "NGO owners can insert projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.ngos n WHERE n.id = ngo_id AND n.created_by = auth.uid())
  );

CREATE POLICY "NGO owners can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "NGO owners can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status public.application_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, volunteer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteer sees own applications"
  ON public.applications FOR SELECT TO authenticated
  USING (volunteer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()));

CREATE POLICY "Volunteer creates own application"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (volunteer_id = auth.uid());

CREATE POLICY "NGO owner updates application status"
  ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()));

CREATE POLICY "Volunteer cancels own application"
  ON public.applications FOR DELETE TO authenticated
  USING (volunteer_id = auth.uid());

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  column_name public.task_column NOT NULL DEFAULT 'a_fazer',
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Helper: user is member of project (NGO owner or approved volunteer)
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = _project_id AND p.created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.project_id = _project_id AND a.volunteer_id = _user_id AND a.status = 'aprovado'
  )
$$;

CREATE POLICY "Project members view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Project members update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()))
  WITH CHECK (public.is_project_member(project_id, auth.uid()));

CREATE POLICY "Project members delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
