-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TYPE public.app_role AS ENUM ('admin','head','assistant','viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_viewer(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'viewer')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- productions
CREATE TABLE public.productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  product_types TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.productions TO authenticated;
GRANT ALL ON public.productions TO service_role;
ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "productions read" ON public.productions FOR SELECT TO authenticated USING (true);
CREATE POLICY "productions write" ON public.productions FOR ALL TO authenticated USING (NOT public.is_viewer(auth.uid())) WITH CHECK (NOT public.is_viewer(auth.uid()));

-- skills
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_code TEXT,
  skill_name TEXT NOT NULL,
  skill_category TEXT NOT NULL DEFAULT 'ทั่วไป',
  active_status BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skills read" ON public.skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills write" ON public.skills FOR ALL TO authenticated USING (NOT public.is_viewer(auth.uid())) WITH CHECK (NOT public.is_viewer(auth.uid()));

-- employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code TEXT,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT '',
  production_id UUID REFERENCES public.productions(id) ON DELETE SET NULL,
  competency_level INT NOT NULL DEFAULT 1 CHECK (competency_level BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'ปฏิบัติงาน',
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "employees read" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees write" ON public.employees FOR ALL TO authenticated USING (NOT public.is_viewer(auth.uid())) WITH CHECK (NOT public.is_viewer(auth.uid()));
CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- assessments
CREATE TABLE public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level INT NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 4),
  target_level INT NOT NULL DEFAULT 3 CHECK (target_level BETWEEN 1 AND 4),
  assessor TEXT,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_assessments TO authenticated;
GRANT ALL ON public.skill_assessments TO service_role;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assessments read" ON public.skill_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "assessments write" ON public.skill_assessments FOR ALL TO authenticated USING (NOT public.is_viewer(auth.uid())) WITH CHECK (NOT public.is_viewer(auth.uid()));
CREATE TRIGGER assessments_updated_at BEFORE UPDATE ON public.skill_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- seed productions
INSERT INTO public.productions (code, name, product_types, sort_order) VALUES
('P1','Production 1','ยาน้ำ, ผง, เม็ด, ยาน้ำสารกำจัดแมลง',1),
('P2','Production 2','ยาทรายกำจัดวัชพืช',2),
('P3','Production 3','ยาน้ำ, ผง, เม็ด, ยากำจัดวัชพืช, โรคพืช, สารควบคุมการเจริญเติบโตของพืช',3),
('P4','Production 4','ยาเหยื่อหนู, ยาน้ำปุ๋ยน้ำ, ยายุง',4),
('P5','Production 5','ยาทรายกำจัดแมลง',5),
('LDI','Production LDI','ยาน้ำ, ผง, เม็ด, ยาน้ำสารกำจัดแมลง, ยากำจัดวัชพืช, โรคพืช',6);

-- seed skills
INSERT INTO public.skills (skill_code, skill_name, skill_category, sort_order) VALUES
('S01','อ่านออก / เขียนได้','พื้นฐาน',1),
('S02','สัมผัสกลิ่น มองสี ปกติ','พื้นฐาน',2),
('S03','ตั้งค่า / ปรับเครื่องยิงสติ๊กเกอร์','เครื่องจักร',3),
('S04','ตั้งค่า / ปรับเครื่องอินดักชั่น','เครื่องจักร',4),
('S05','ตั้งค่า / ปรับเครื่องจักร','เครื่องจักร',5),
('S06','ตั้งค่า / ปรับเครื่องบรรจุ','เครื่องจักร',6),
('S07','กรองยา','ผสม',7),
('S08','หัวบรรจุ / บรรจุยา','บรรจุ',8),
('S09','คิดคำนวณน้ำหนักก่อนบรรจุ','บรรจุ',9),
('S10','ปิดฝา','บรรจุ',10),
('S11','ติดฉลากแบบมือ','บรรจุ',11),
('S12','เก็บผลิตภัณฑ์ใส่ภาชนะ','บรรจุ',12),
('S13','ท้ายไลน์ / ตรวจสอบน้ำหนัก','QC',13),
('S14','ติดฉลากบนภาชนะ','บรรจุ',14),
('S15','ขับรถโฟคลิฟท์ได้','Support',15),
('S16','ซีนภาชนะ','บรรจุ',16),
('S17','เย็บกระสอบ','บรรจุ',17),
('S18','เรียงกระสอบ','บรรจุ',18);