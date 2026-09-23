-- 1. Create the payment_receipts table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id text NOT NULL REFERENCES public.profiles(telegram_id),
  transaction_id text,
  receipt_url text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Storage Bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow public to view receipts
CREATE POLICY "Public Receipt Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'receipts');
  
-- Allow authenticated users to upload (or in our case, the service role bypasses this, but good to have)
CREATE POLICY "Auth Upload Receipts" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'receipts');
