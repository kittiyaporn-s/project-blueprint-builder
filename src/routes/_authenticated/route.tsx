import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getLocalUser } from "@/lib/local-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = getLocalUser();
    if (!user) throw redirect({ to: "/" });
    return { user };
  },
  component: () => <Outlet />,
});
