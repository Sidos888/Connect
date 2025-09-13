# Get Your Supabase Service Role Key

## Steps to get your service role key:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/rxlqtyfhsocxnsnnnlwl
2. **Click on "Settings" in the left sidebar**
3. **Click on "API"**
4. **Copy the "service_role" key** (it's a very long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Add it to your .env.local file:

Replace `your_service_role_key_here` in your `.env.local` file with the actual service role key.

## Why this is needed:

- The service role key allows the API to delete users from Supabase Auth
- Without it, only the profile is deleted, but the user remains in `auth.users`
- This causes the system to still recognize the user when they try to sign up again

## Test the fix:

1. Add your service role key to `.env.local`
2. Restart your dev server: `npm run dev`
3. Create an account
4. Delete the account
5. Try to sign up again with the same email/phone
6. It should create a new account instead of recognizing the old one
