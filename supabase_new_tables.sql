-- =============================================
-- GYAAN ASHRAM — NEW TABLES (Run in Supabase SQL Editor)
-- Run this ONCE after the initial setup
-- =============================================

-- 1. FEE RECORDS TABLE
CREATE TABLE fee_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  jan TEXT DEFAULT '-',
  feb TEXT DEFAULT '-',
  mar TEXT DEFAULT '-',
  apr TEXT DEFAULT '-',
  may TEXT DEFAULT '-',
  jun TEXT DEFAULT '-',
  jul TEXT DEFAULT '-',
  aug TEXT DEFAULT '-',
  sep TEXT DEFAULT '-',
  oct TEXT DEFAULT '-',
  nov TEXT DEFAULT '-',
  "dec" TEXT DEFAULT '-',
  year INT DEFAULT EXTRACT(YEAR FROM now())::INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SCHEDULE TABLE
CREATE TABLE schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch TEXT NOT NULL,
  days TEXT NOT NULL,
  time TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default schedule
INSERT INTO schedule (batch, days, time, sort_order) VALUES
  ('Class 8 - Morning', 'Mon - Sat', '7:00 AM - 9:00 AM', 1),
  ('Class 9 - Morning', 'Mon - Sat', '9:15 AM - 11:15 AM', 2),
  ('Class 10 - Afternoon', 'Mon - Sat', '2:00 PM - 4:00 PM', 3),
  ('Doubt Session (All)', 'Saturday', '4:30 PM - 6:00 PM', 4);

-- 3. NOTICES TABLE
CREATE TABLE notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  posted_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- 4. Enable Row Level Security
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 5. Public READ policies (everyone can see)
CREATE POLICY "Anyone can read fee_records" ON fee_records FOR SELECT USING (true);
CREATE POLICY "Anyone can read schedule" ON schedule FOR SELECT USING (true);
CREATE POLICY "Anyone can read notices" ON notices FOR SELECT USING (true);

-- 6. Admin WRITE policies (only authenticated users)
CREATE POLICY "Admin can insert fee_records" ON fee_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update fee_records" ON fee_records FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete fee_records" ON fee_records FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin can insert schedule" ON schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update schedule" ON schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete schedule" ON schedule FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin can insert notices" ON notices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update notices" ON notices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete notices" ON notices FOR DELETE TO authenticated USING (true);
