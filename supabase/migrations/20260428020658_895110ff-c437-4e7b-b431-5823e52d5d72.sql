-- Tighten support_tickets insert: only authenticated users, must match their own user_id
DROP POLICY IF EXISTS "own tickets insert" ON public.support_tickets;
CREATE POLICY "own tickets insert" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lock down SECURITY DEFINER function execute privileges
REVOKE EXECUTE ON FUNCTION public.handle_new_user_settings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;