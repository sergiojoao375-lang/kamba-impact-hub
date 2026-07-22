
-- Enum for user roles (privilege escalation-safe pattern)
CREATE TYPE public.app_role AS ENUM ('admin', 'ngo', 'volunteer');
CREATE TYPE public.ngo_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- profiles
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'volunteer' CHECK (role IN ('volunteer','ngo','admin')),
  skills TEXT[] NOT NULL DEFAULT '{}',
  portfolio_url TEXT,
  provincia TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- user_roles (privilege-safe)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- ngos
-- =========================
CREATE TABLE public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_atuacao TEXT NOT NULL,
  provincia TEXT NOT NULL,
  document_url TEXT,
  description TEXT,
  status public.ngo_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ngos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ngos TO authenticated;
GRANT ALL ON public.ngos TO service_role;

ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_ngos_updated_at
BEFORE UPDATE ON public.ngos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- Profiles RLS
-- =========================
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- NGOs RLS
-- =========================
-- Anyone can view approved NGOs
CREATE POLICY "Approved NGOs are viewable by everyone"
ON public.ngos FOR SELECT
USING (status = 'aprovado');

-- Creator can view their own (any status)
CREATE POLICY "Creators can view their own NGOs"
ON public.ngos FOR SELECT TO authenticated
USING (auth.uid() = created_by);

-- Admins can view all
CREATE POLICY "Admins can view all NGOs"
ON public.ngos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can create their own NGO submission
CREATE POLICY "Users can create their own NGOs"
ON public.ngos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Creator can update their NGO but cannot change status
CREATE POLICY "Creators can update their own NGOs"
ON public.ngos FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Admins can update any NGO (including status)
CREATE POLICY "Admins can update any NGO"
ON public.ngos FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Creators can delete their pending submissions; admins any
CREATE POLICY "Creators can delete pending NGOs"
ON public.ngos FOR DELETE TO authenticated
USING (auth.uid() = created_by AND status = 'pendente');

CREATE POLICY "Admins can delete any NGO"
ON public.ngos FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- Auto-create profile on signup
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'volunteer')
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'volunteer'::public.app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
