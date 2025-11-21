-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_name TEXT,
  head_id UUID,
  employee_count INTEGER DEFAULT 0,
  budget NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "Users can view departments in their company"
  ON public.departments
  FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage departments"
  ON public.departments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role, company_id));

-- Create payroll table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  employee_id TEXT NOT NULL,
  basic_salary NUMERIC NOT NULL,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  pay_period TEXT NOT NULL,
  pay_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payroll
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll
CREATE POLICY "Users can view their own payroll"
  ON public.payroll
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all payroll in company"
  ON public.payroll
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role, company_id) OR has_role(auth.uid(), 'hr'::app_role, company_id));

CREATE POLICY "Admins and HR can manage payroll"
  ON public.payroll
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role, company_id) OR has_role(auth.uid(), 'hr'::app_role, company_id));

-- Add update trigger for departments
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for payroll
CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();