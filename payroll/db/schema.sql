-- WDL Command Center DB schema (payroll core)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  classification TEXT,
  davis_bacon BOOLEAN DEFAULT false,
  base_rate NUMERIC(10,2) NOT NULL,
  fringe_rate NUMERIC(10,2) DEFAULT 0,
  deductions JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true
);
CREATE TABLE IF NOT EXISTS time_sheets (
  id UUID PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  project_code TEXT,
  week_ending DATE,
  hours_regular NUMERIC(10,2) DEFAULT 0,
  hours_ot NUMERIC(10,2) DEFAULT 0,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY,
  week_ending DATE,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT now(),
  approved_by TEXT
);
CREATE TABLE IF NOT EXISTS payroll_run_items (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES payroll_runs(id),
  employee_id UUID REFERENCES employees(id),
  davis_bacon BOOLEAN,
  hours_regular NUMERIC(10,2),
  hours_ot NUMERIC(10,2),
  gross_pay NUMERIC(12,2),
  fringe_pay NUMERIC(12,2),
  taxes NUMERIC(12,2),
  deductions NUMERIC(12,2),
  net_pay NUMERIC(12,2)
);
