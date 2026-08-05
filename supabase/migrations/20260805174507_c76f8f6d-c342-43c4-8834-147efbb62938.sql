-- Empresas parceiras
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Users create their own company" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners update their company" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners delete their company" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department text;

-- Valores médios de mercado por hora (Kz)
CREATE TABLE public.skill_rates (
  skill text PRIMARY KEY,
  hourly_rate_kz numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skill_rates TO authenticated, anon;
GRANT ALL ON public.skill_rates TO service_role;
ALTER TABLE public.skill_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skill rates are public" ON public.skill_rates FOR SELECT USING (true);

INSERT INTO public.skill_rates (skill, hourly_rate_kz) VALUES
  ('Design', 5000), ('Contabilidade', 7000), ('Programação', 10000), ('Marketing', 6000),
  ('Gestão', 8000), ('Direito', 9000), ('Educação', 4500), ('Saúde', 8500),
  ('Tradução', 4000), ('Comunicação', 5500), ('__default__', 5000);

-- Impacto por projeto concluído
CREATE TABLE public.project_impact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  total_hours numeric NOT NULL DEFAULT 0,
  hourly_rate_kz numeric NOT NULL DEFAULT 0,
  value_kz numeric NOT NULL DEFAULT 0,
  volunteers_count integer NOT NULL DEFAULT 0,
  main_skill text,
  closed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.project_impact TO authenticated;
GRANT ALL ON public.project_impact TO service_role;
ALTER TABLE public.project_impact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read impact" ON public.project_impact FOR SELECT TO authenticated USING (true);
CREATE POLICY "NGO owner records impact" ON public.project_impact FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()));
CREATE POLICY "NGO owner updates impact" ON public.project_impact FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.created_by = auth.uid()));
CREATE TRIGGER trg_project_impact_updated_at BEFORE UPDATE ON public.project_impact FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trava: apenas ONGs aprovadas publicam vagas
DROP POLICY IF EXISTS "NGO owners can insert projects" ON public.projects;
CREATE POLICY "Approved NGO owners can insert projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.ngos n
      WHERE n.id = projects.ngo_id AND n.created_by = auth.uid() AND n.status = 'aprovado'::ngo_status
    )
  );