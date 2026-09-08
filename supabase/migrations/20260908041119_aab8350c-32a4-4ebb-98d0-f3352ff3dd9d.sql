GRANT EXECUTE ON FUNCTION public.is_viewer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;