-- Fix RLS policy for friend_requests table to allow users to delete their own sent requests
DROP POLICY IF EXISTS "Users can delete their own sent friend requests" ON public.friend_requests;

CREATE POLICY "Users can delete their own sent friend requests"
ON public.friend_requests FOR DELETE
TO authenticated
USING (sender_id = auth.uid());
