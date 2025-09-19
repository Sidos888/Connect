-- Enable RLS on both tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_identities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/update/select their own records
CREATE POLICY "Users can manage their own accounts" ON accounts
  FOR ALL USING (auth.uid() = id::uuid);

CREATE POLICY "Users can manage their own identities" ON account_identities
  FOR ALL USING (auth.uid() = auth_user_id::uuid);

