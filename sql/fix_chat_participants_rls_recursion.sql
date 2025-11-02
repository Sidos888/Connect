-- ============================================================================
-- FIX INFINITE RECURSION IN CHAT_PARTICIPANTS RLS POLICY
-- ============================================================================

BEGIN;

-- Drop ALL existing policies on chat_participants to avoid conflicts
DROP POLICY IF EXISTS "Users view their own chat participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_select_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_update_own" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete_own" ON chat_participants;

-- Create simple, clean policies without any potential recursion
CREATE POLICY "chat_participants_select_own" 
ON chat_participants FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "chat_participants_insert_own" 
ON chat_participants FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_participants_update_own" 
ON chat_participants FOR UPDATE 
USING (user_id = auth.uid());

-- Verify the table structure and constraints
DO $$
BEGIN
    -- Check if the table exists and has the right columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'chat_participants' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'chat_participants table exists';
        
        -- Check columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_participants' 
            AND column_name = 'user_id'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'user_id column exists';
        ELSE
            RAISE EXCEPTION 'user_id column missing from chat_participants';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'chat_participants' 
            AND column_name = 'chat_id'
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE 'chat_id column exists';
        ELSE
            RAISE EXCEPTION 'chat_id column missing from chat_participants';
        END IF;
        
    ELSE
        RAISE EXCEPTION 'chat_participants table does not exist';
    END IF;
END $$;

COMMIT;



