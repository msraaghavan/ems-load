-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'department_head', 'employee');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, role)
);

-- Create geofences table
CREATE TABLE public.geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Office Location',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invite_codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create attendance_photos table (for face recognition baseline)
CREATE TABLE public.attendance_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  face_encoding TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, is_primary)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_location_lat DECIMAL(10, 8),
  check_in_location_lng DECIMAL(11, 8),
  check_out_location_lat DECIMAL(10, 8),
  check_out_location_lng DECIMAL(11, 8),
  check_in_photo_url TEXT,
  check_out_photo_url TEXT,
  status TEXT DEFAULT 'present',
  hours_worked DECIMAL(5, 2),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, date)
);

-- Create performance_reviews table
CREATE TABLE public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  feedback TEXT,
  goals TEXT,
  achievements TEXT,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND company_id = _company_id
  )
$$;

-- Create security definer function to check if user is in company
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- RLS Policies for companies
CREATE POLICY "Users can view their companies"
  ON public.companies FOR SELECT
  USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "Admins can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their companies"
  ON public.companies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin', id));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their company"
  ON public.profiles FOR SELECT
  USING (
    company_id IS NULL OR 
    public.is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their company"
  ON public.user_roles FOR SELECT
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin', company_id));

-- RLS Policies for geofences
CREATE POLICY "Company members can view geofences"
  ON public.geofences FOR SELECT
  USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage geofences"
  ON public.geofences FOR ALL
  USING (public.has_role(auth.uid(), 'admin', company_id));

-- RLS Policies for invite_codes
CREATE POLICY "Anyone can view valid invite codes"
  ON public.invite_codes FOR SELECT
  USING (
    expires_at IS NULL OR expires_at > now()
  );

CREATE POLICY "Admins can manage invite codes"
  ON public.invite_codes FOR ALL
  USING (public.has_role(auth.uid(), 'admin', company_id));

-- RLS Policies for attendance_photos
CREATE POLICY "Users can view their own photos"
  ON public.attendance_photos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all photos in company"
  ON public.attendance_photos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

CREATE POLICY "Users can insert their own photos"
  ON public.attendance_photos FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
  ON public.attendance FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all attendance in company"
  ON public.attendance FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

CREATE POLICY "Users can insert their own attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attendance"
  ON public.attendance FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for performance_reviews
CREATE POLICY "Users can view their own reviews"
  ON public.performance_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all reviews"
  ON public.performance_reviews FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

CREATE POLICY "Admins and HR can create reviews"
  ON public.performance_reviews FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

CREATE POLICY "Admins and HR can update reviews"
  ON public.performance_reviews FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own leave requests"
  ON public.leave_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all leave requests"
  ON public.leave_requests FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

CREATE POLICY "Users can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and HR can update leave requests"
  ON public.leave_requests FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin', company_id) OR
    public.has_role(auth.uid(), 'hr', company_id)
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON public.geofences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();