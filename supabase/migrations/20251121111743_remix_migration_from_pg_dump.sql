--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'hr',
    'department_head',
    'employee'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND company_id = _company_id
  )
$$;


--
-- Name: is_company_member(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    check_in_time timestamp with time zone,
    check_out_time timestamp with time zone,
    check_in_location_lat numeric(10,8),
    check_in_location_lng numeric(11,8),
    check_out_location_lat numeric(10,8),
    check_out_location_lng numeric(11,8),
    check_in_photo_url text,
    check_out_photo_url text,
    status text DEFAULT 'present'::text,
    hours_worked numeric(5,2),
    date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    photo_url text NOT NULL,
    face_encoding text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    admin_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text NOT NULL,
    head_name text,
    head_id uuid,
    employee_count integer DEFAULT 0,
    budget numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: geofences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.geofences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    name text DEFAULT 'Office Location'::text NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    radius_meters integer DEFAULT 100 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invite_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    code text NOT NULL,
    max_uses integer DEFAULT 1,
    current_uses integer DEFAULT 0,
    created_by uuid NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    role public.app_role DEFAULT 'employee'::public.app_role NOT NULL
);


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    leave_type text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    employee_id text NOT NULL,
    basic_salary numeric NOT NULL,
    allowances numeric DEFAULT 0,
    deductions numeric DEFAULT 0,
    net_salary numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    pay_period text NOT NULL,
    pay_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: performance_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.performance_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    reviewer_id uuid,
    rating numeric(3,2),
    feedback text,
    goals text,
    achievements text,
    review_period_start date NOT NULL,
    review_period_end date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT performance_reviews_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (5)::numeric)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    avatar_url text,
    company_id uuid,
    phone text,
    department text,
    "position" text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_photos attendance_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photos
    ADD CONSTRAINT attendance_photos_pkey PRIMARY KEY (id);


--
-- Name: attendance_photos attendance_photos_user_id_company_id_is_primary_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photos
    ADD CONSTRAINT attendance_photos_user_id_company_id_is_primary_key UNIQUE (user_id, company_id, is_primary);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_user_id_company_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_user_id_company_id_date_key UNIQUE (user_id, company_id, date);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: geofences geofences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofences
    ADD CONSTRAINT geofences_pkey PRIMARY KEY (id);


--
-- Name: invite_codes invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_code_key UNIQUE (code);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: performance_reviews performance_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_company_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_company_id_role_key UNIQUE (user_id, company_id, role);


--
-- Name: attendance update_attendance_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: geofences update_geofences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON public.geofences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: leave_requests update_leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payroll update_payroll_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON public.payroll FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: performance_reviews update_performance_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: attendance attendance_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: attendance_photos attendance_photos_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photos
    ADD CONSTRAINT attendance_photos_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: attendance_photos attendance_photos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_photos
    ADD CONSTRAINT attendance_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: companies companies_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: departments departments_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: geofences geofences_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.geofences
    ADD CONSTRAINT geofences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invite_codes invite_codes_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: invite_codes invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: payroll payroll_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: performance_reviews performance_reviews_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: performance_reviews performance_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: performance_reviews performance_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.performance_reviews
    ADD CONSTRAINT performance_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: performance_reviews Admins and HR can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can create reviews" ON public.performance_reviews FOR INSERT WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: payroll Admins and HR can manage payroll; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can manage payroll" ON public.payroll USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: leave_requests Admins and HR can update leave requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can update leave requests" ON public.leave_requests FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: performance_reviews Admins and HR can update reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can update reviews" ON public.performance_reviews FOR UPDATE USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: attendance Admins and HR can view all attendance in company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can view all attendance in company" ON public.attendance FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: leave_requests Admins and HR can view all leave requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can view all leave requests" ON public.leave_requests FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: payroll Admins and HR can view all payroll in company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can view all payroll in company" ON public.payroll FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: attendance_photos Admins and HR can view all photos in company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can view all photos in company" ON public.attendance_photos FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: performance_reviews Admins and HR can view all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and HR can view all reviews" ON public.performance_reviews FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role, company_id) OR public.has_role(auth.uid(), 'hr'::public.app_role, company_id)));


--
-- Name: companies Admins can create companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create companies" ON public.companies FOR INSERT WITH CHECK ((auth.uid() = admin_id));


--
-- Name: departments Admins can manage departments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage departments" ON public.departments USING (public.has_role(auth.uid(), 'admin'::public.app_role, company_id));


--
-- Name: geofences Admins can manage geofences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage geofences" ON public.geofences USING (public.has_role(auth.uid(), 'admin'::public.app_role, company_id));


--
-- Name: invite_codes Admins can manage invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage invite codes" ON public.invite_codes USING (public.has_role(auth.uid(), 'admin'::public.app_role, company_id));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role, company_id));


--
-- Name: companies Admins can update their companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their companies" ON public.companies FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role, id));


--
-- Name: invite_codes Anyone can view valid invite codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view valid invite codes" ON public.invite_codes FOR SELECT USING (((expires_at IS NULL) OR (expires_at > now())));


--
-- Name: geofences Company members can view geofences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Company members can view geofences" ON public.geofences FOR SELECT USING (public.is_company_member(auth.uid(), company_id));


--
-- Name: leave_requests Users can create their own leave requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own leave requests" ON public.leave_requests FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: attendance Users can insert their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own attendance" ON public.attendance FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: attendance_photos Users can insert their own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own photos" ON public.attendance_photos FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: user_roles Users can insert their own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: attendance Users can update their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own attendance" ON public.attendance FOR UPDATE USING ((user_id = auth.uid()));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: departments Users can view departments in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view departments in their company" ON public.departments FOR SELECT USING (public.is_company_member(auth.uid(), company_id));


--
-- Name: profiles Users can view profiles in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles in their company" ON public.profiles FOR SELECT USING (((company_id IS NULL) OR public.is_company_member(auth.uid(), company_id)));


--
-- Name: user_roles Users can view roles in their company; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view roles in their company" ON public.user_roles FOR SELECT USING (public.is_company_member(auth.uid(), company_id));


--
-- Name: companies Users can view their companies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their companies" ON public.companies FOR SELECT USING (public.is_company_member(auth.uid(), id));


--
-- Name: attendance Users can view their own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own attendance" ON public.attendance FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: leave_requests Users can view their own leave requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own leave requests" ON public.leave_requests FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: payroll Users can view their own payroll; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own payroll" ON public.payroll FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: attendance_photos Users can view their own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own photos" ON public.attendance_photos FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: performance_reviews Users can view their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reviews" ON public.performance_reviews FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: companies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

--
-- Name: departments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

--
-- Name: geofences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

--
-- Name: invite_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: leave_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: payroll; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

--
-- Name: performance_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


